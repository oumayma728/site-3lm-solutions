from datetime import datetime

from django.utils import timezone
from rest_framework import serializers
from .models import Client, Devis, LigneDevis, Prestation, RendezVous
from .services.currency import detecter_devise
from .services.pricing import appliquer_marge_cout_reel


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
            # prix_unitaire reste éditable : ces champs servent de base au calcul,
            # pas une valeur verrouillée (voir services.pricing.calculer_prix_ligne).
            'profil', 'jours_estimes', 'nombre_personnes', 'complexite',
        ]


class DevisSerializer(serializers.ModelSerializer):
    lignes = LigneDevisSerializer(many=True, required=False)
    client_nom = serializers.CharField(source='client.nom', read_only=True)

    class Meta:
        model = Devis
        fields = [
            'id', 'client', 'client_nom', 'manager',
            'besoins_client', 'synthese_ia', 'estimation_montant', 'devise',
            'mode_tarification', 'cout_reel',
            'statut', 'fichier_pdf', 'date_creation', 'date_modification',
            'lignes',
        ]

    def create(self, validated_data):
        lignes_data = validated_data.pop('lignes', [])
        # Devise détectée automatiquement depuis les besoins du client, sauf
        # si le front en envoie une explicitement (choix manuel côté aperçu).
        if 'devise' not in self.initial_data and validated_data.get('besoins_client'):
            validated_data['devise'] = detecter_devise(validated_data['besoins_client'])
        # Mode 'cout_reel' : si un coût réel est fourni dès la création, on
        # calcule tout de suite le prix final (coût + marge) — même logique
        # que dans update() ci-dessous, voir le commentaire là-bas.
        if validated_data.get('mode_tarification') == 'cout_reel' and validated_data.get('cout_reel') is not None:
            validated_data['estimation_montant'] = appliquer_marge_cout_reel(validated_data['cout_reel'])
        devis = Devis.objects.create(**validated_data)
        for ligne_data in lignes_data:
            LigneDevis.objects.create(devis=devis, **ligne_data)
        return devis

    def update(self, instance, validated_data):
        lignes_data = validated_data.pop('lignes', None)

        # Si les besoins du client changent sans que le front précise de
        # devise, on retente la détection — mais un choix manuel explicite
        # ('devise' présent dans la requête) n'est jamais écrasé.
        if 'besoins_client' in validated_data and 'devise' not in self.initial_data:
            validated_data['devise'] = detecter_devise(validated_data['besoins_client'])

        # Mode 'cout_reel' : dès que l'admin saisit/modifie le coût réel payé,
        # on recalcule automatiquement estimation_montant = coût + marge —
        # c'est ce champ que tout le reste de l'app lit déjà (aperçu, PDF,
        # liste des devis), donc rien d'autre n'a besoin de savoir quel mode
        # a été utilisé pour l'obtenir.
        mode = validated_data.get('mode_tarification', instance.mode_tarification)
        if 'cout_reel' in validated_data and mode == 'cout_reel':
            validated_data['estimation_montant'] = appliquer_marge_cout_reel(validated_data['cout_reel'])

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if lignes_data is not None:
            instance.lignes.all().delete()
            for ligne_data in lignes_data:
                LigneDevis.objects.create(devis=instance, **ligne_data)

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