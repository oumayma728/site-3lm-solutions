from datetime import datetime

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.exceptions import APIException
from .models import Client, Devis, LigneDevis, Prestation, RendezVous
from .services.chiffrage import chiffrer, recalculer_estimation, remplacer_lignes, tarifs_modifies
from .services.currency import detecter_devise
from .services.pricing import TarificationError


class DevisFige(APIException):
    """409 : un devis validé ou envoyé ne se modifie plus (le client a reçu cette version)."""
    status_code = status.HTTP_409_CONFLICT
    default_detail = "Ce devis est validé : il ne peut plus être modifié. Créez un nouveau devis pour toute modification."
    default_code = 'devis_fige'


def _valider_creneau_futur(date_rdv, heure_rdv):
    if not date_rdv or not heure_rdv:
        return
    creneau = timezone.make_aware(datetime.combine(date_rdv, heure_rdv))
    if creneau < timezone.now():
        raise serializers.ValidationError("La date et l'heure du rendez-vous doivent être dans le futur.")


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'


class PrestationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prestation
        fields = ['id', 'nom', 'description', 'categorie', 'prix_reference', 'actif']


class LigneDevisSerializer(serializers.ModelSerializer):
    total = serializers.ReadOnlyField()
    prestation_nom = serializers.CharField(source='prestation.nom', read_only=True, default=None)

    class Meta:
        model = LigneDevis
        fields = [
            'id', 'prestation', 'prestation_nom', 'description', 'quantite', 'prix_unitaire', 'total',
            # Champs d'estimation — remplis par l'IA ou modifiables manuellement.
            # Quand ils sont tous renseignés (mode 'estimation_ia'), prix_unitaire
            # est RECALCULÉ côté serveur : la valeur envoyée est ignorée.
            'profil', 'jours_par_personne', 'nombre_personnes', 'complexite',
            # Instantané du calcul (lecture seule) — voir services.pricing.PrixLigne.
            'tjm', 'multiplicateur', 'jours_personne', 'prix',
        ]
        read_only_fields = ['tjm', 'multiplicateur', 'jours_personne', 'prix']
        extra_kwargs = {'prix_unitaire': {'required': False, 'default': 0}}


class DevisSerializer(serializers.ModelSerializer):
    lignes = LigneDevisSerializer(many=True, required=False)
    client_nom = serializers.CharField(source='client.nom', read_only=True)
    client_email = serializers.CharField(source='client.email', read_only=True)   # affiché avant l'envoi
    # Brouillon dont le TJM ou un multiplicateur a changé depuis le chiffrage.
    tarifs_modifies = serializers.SerializerMethodField()

    class Meta:
        model = Devis
        fields = [
            'id', 'numero', 'version', 'client', 'client_nom', 'client_email', 'manager',
            'besoins_client', 'synthese_ia', 'hypotheses', 'questions_ouvertes', 'budget_mentionne',
            'ia_modele', 'ia_version_prompt',
            'estimation_montant', 'devise', 'mode_tarification', 'cout_reel',
            'statut', 'fichier_pdf', 'date_creation', 'date_modification', 'date_validation', 'date_validite',
            'tarifs_modifies', 'lignes',
        ]
        # Le statut ne change que par les actions (valider, renvoyer…), le
        # montant est toujours déduit des lignes ou du coût réel, et les champs
        # IA ne viennent que de la génération.
        read_only_fields = [
            'numero', 'version', 'manager', 'hypotheses', 'questions_ouvertes', 'budget_mentionne',
            'ia_modele', 'ia_version_prompt', 'estimation_montant', 'statut', 'fichier_pdf',
            'date_validation', 'date_validite',
        ]

    def get_tarifs_modifies(self, devis):
        return tarifs_modifies(devis)

    def _lignes_chiffrees(self, lignes_data, mode):
        try:
            return [chiffrer(ligne, mode) for ligne in lignes_data]
        except TarificationError as exc:
            raise serializers.ValidationError({'lignes': str(exc)})

    def _recalculer(self, devis):
        try:
            recalculer_estimation(devis)
        except TarificationError as exc:
            raise serializers.ValidationError({'cout_reel': str(exc)})

    @transaction.atomic
    def create(self, validated_data):
        lignes_data = validated_data.pop('lignes', [])
        # Devise détectée automatiquement depuis les besoins du client, sauf
        # si le front en envoie une explicitement (choix manuel côté aperçu).
        if 'devise' not in self.initial_data and validated_data.get('besoins_client'):
            validated_data['devise'] = detecter_devise(validated_data['besoins_client'])
        mode = validated_data.get('mode_tarification', 'estimation_ia')
        lignes = self._lignes_chiffrees(lignes_data, mode)

        devis = Devis.objects.create(**validated_data)
        remplacer_lignes(devis, lignes)
        self._recalculer(devis)
        devis.save(update_fields=['estimation_montant'])
        return devis

    @transaction.atomic
    def update(self, instance, validated_data):
        if instance.est_fige:
            raise DevisFige()
        lignes_data = validated_data.pop('lignes', None)

        # Si les besoins du client changent sans que le front précise de
        # devise, on retente la détection — mais un choix manuel explicite
        # ('devise' présent dans la requête) n'est jamais écrasé.
        if 'besoins_client' in validated_data and 'devise' not in self.initial_data:
            validated_data['devise'] = detecter_devise(validated_data['besoins_client'])

        mode = validated_data.get('mode_tarification', instance.mode_tarification)
        mode_change = mode != instance.mode_tarification
        # Lignes à (re)chiffrer : celles envoyées, ou les lignes existantes si
        # seul le mode change (le prix doit suivre le nouveau mode).
        if lignes_data is None and mode_change:
            lignes_data = [
                {f: getattr(l, f) for f in ('description', 'prestation', 'quantite', 'prix_unitaire', 'profil',
                                            'jours_par_personne', 'nombre_personnes', 'complexite')}
                for l in instance.lignes.all()
            ]
        lignes = self._lignes_chiffrees(lignes_data, mode) if lignes_data is not None else None

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if lignes is not None:
            remplacer_lignes(instance, lignes)
            instance.version += 1
        # Toujours recalculé : somme des lignes ou coût réel + marge.
        self._recalculer(instance)
        instance.save()
        return instance


class RendezVousSerializer(serializers.ModelSerializer):
    client_nom = serializers.CharField(source='client.nom', read_only=True)
    client_entreprise = serializers.CharField(source='client.entreprise', read_only=True)
    client_telephone = serializers.CharField(source='client.telephone', read_only=True)
    client_email = serializers.CharField(source='client.email', read_only=True)
    devis_statut = serializers.CharField(source='devis.statut', read_only=True, default=None)

    class Meta:
        model = RendezVous
        fields = [
            'id', 'client', 'client_nom', 'client_entreprise', 'client_telephone', 'client_email',
            'devis', 'devis_statut', 'manager',
            'date_rdv', 'heure_rdv', 'type_rdv', 'statut', 'source', 'notes',
            'date_creation', 'date_modification',
        ]

    def validate(self, attrs):
        date_rdv = attrs.get('date_rdv', getattr(self.instance, 'date_rdv', None))
        heure_rdv = attrs.get('heure_rdv', getattr(self.instance, 'heure_rdv', None))
        _valider_creneau_futur(date_rdv, heure_rdv)
        if date_rdv and heure_rdv:
            qs = RendezVous.objects.filter(
                date_rdv=date_rdv, heure_rdv=heure_rdv, statut__in=['demande', 'confirme'],
            )
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError("Ce créneau est déjà pris.")
        return attrs


class RendezVousPublicSerializer(serializers.Serializer):
    """Formulaire public de prise de rendez-vous (module Ligne directe) : crée le prospect + le rendez-vous."""

    prenom = serializers.CharField(max_length=100)
    nom = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    telephone = serializers.CharField(max_length=20)
    entreprise = serializers.CharField(max_length=200, required=False, allow_blank=True)
    message = serializers.CharField(required=False, allow_blank=True)

    date_rdv = serializers.DateField()
    heure_rdv = serializers.TimeField()
    type_rdv = serializers.ChoiceField(choices=RendezVous.TYPE_CHOICES, default='appel')

    def validate(self, attrs):
        _valider_creneau_futur(attrs.get('date_rdv'), attrs.get('heure_rdv'))
        conflit = RendezVous.objects.filter(
            date_rdv=attrs['date_rdv'], heure_rdv=attrs['heure_rdv'], statut__in=['demande', 'confirme'],
        ).exists()
        if conflit:
            raise serializers.ValidationError("Ce créneau vient d'être réservé, merci d'en choisir un autre.")
        return attrs

    def create(self, validated_data):
        client, created = Client.objects.get_or_create(
            email=validated_data['email'],
            defaults={
                'nom': validated_data['nom'],
                'prenom': validated_data['prenom'],
                'entreprise': validated_data.get('entreprise', ''),
                'telephone': validated_data['telephone'],
                'message': validated_data.get('message', ''),
                'statut': 'nouveau',
            },
        )
        if not created:
            # Un visiteur déjà connu reprend contact : on rafraîchit ses coordonnées.
            client.nom = validated_data['nom']
            client.prenom = validated_data['prenom']
            client.telephone = validated_data['telephone']
            if validated_data.get('entreprise'):
                client.entreprise = validated_data['entreprise']
            if validated_data.get('message'):
                client.message = validated_data['message']
            client.save()

        rendez_vous = RendezVous.objects.create(
            client=client,
            date_rdv=validated_data['date_rdv'],
            heure_rdv=validated_data['heure_rdv'],
            type_rdv=validated_data.get('type_rdv', 'appel'),
            statut='demande',
            source='public',
            notes=validated_data.get('message', ''),
        )
        return rendez_vous