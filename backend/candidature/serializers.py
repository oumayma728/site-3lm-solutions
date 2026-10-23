# Serializers for the Candidature model 

from django.utils import timezone
from rest_framework import serializers
from .models import Candidature
import re
MAX_CV_SIZE= 5*1024*1024  # 5MB
# Accepts e.g. "22 333 444", "+216 22 333 444", "(+216) 22-333-444"
PHONE_RE = re.compile(r'^\(?\+?[\d\s\-()]{8,20}$')

# Bump this whenever the consent text in CandidatureForm.tsx changes
# 2026-10-2: adds 6-month retention + privacy policy link
# 2026-10-3: adds the transfer to the internal interns tool and the AI-assisted CV analysis
CONSENTEMENT_VERSION = '2026-10-3'

class CandidatureSerializer(serializers.ModelSerializer):
    # Checkbox sent by the form; the date and version are recorded server-side
    consentement = serializers.BooleanField(write_only=True, required=False)
    # Honeypot: hidden in the form, only bots fill it
    site_web = serializers.CharField(write_only=True, required=False, allow_blank=True)
    # The CV URL is never returned: the file is only downloadable via GET /candidature/<id>/cv/
    has_cv = serializers.SerializerMethodField()

    class Meta:
        model = Candidature
        fields = [
            'id', 'nom', 'email', 'telephone', 'cv', 'has_cv', 'type_stage','ecole','niveau_etude','linkedin_url','consentement','site_web','consentement_date','consentement_version','cv_nom_original','disponible_du','disponible_au','offre', 'message','reference','created_at', 'updated_at',
            'statut', 'crm_envoye_le', 'crm_erreur',
        ]
        # statut / crm_* are set by the server only: the public form must never be able to pre-select itself
        read_only_fields = ['id', 'type_stage', 'cv_nom_original', 'consentement_date', 'consentement_version', 'created_at', 'updated_at',
                            'statut', 'crm_envoye_le', 'crm_erreur']
        validators = []
        extra_kwargs = {
            'cv': {'write_only': True},
            'niveau_etude': {'error_messages': {'invalid_choice': "Niveau d'études invalide."}},
        }

    def get_has_cv(self, obj):
        return bool(obj.cv)





    def create(self, validated_data):
        validated_data.pop('consentement', None)
        validated_data.pop('site_web', None)
        cv = validated_data.get('cv')
        if cv:
            # Keep the name the candidate uploaded; the stored file name may differ
            validated_data['cv_nom_original'] = cv.name[:200]
        validated_data['consentement_date'] = timezone.now()
        validated_data['consentement_version'] = CONSENTEMENT_VERSION
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop('consentement', None)
        validated_data.pop('site_web', None)
        return super().update(instance, validated_data)

    def validate_email(self, value):
        return value.strip().lower()  # Normaliser l'email en minuscules et supprimer les espaces
    def validate_offre(self, value):
        if value and not value.actif:
            raise serializers.ValidationError("L'offre sélectionnée n'est pas active.")
        # Closed offer: no new applications (existing ones can still be edited by the team)
        if value and value.cloturee and not self.instance:
            raise serializers.ValidationError(
                "Cette offre est clôturée : elle n'accepte plus de candidatures."
            )
        return value
    def validate_telephone(self, value):
        value = value.strip()  # Supprimer les espaces avant et après
        if not PHONE_RE.match(value) or sum(c.isdigit() for c in value) < 8:
            raise serializers.ValidationError("Le numéro de téléphone n'est pas valide.")
        return value




    def validate_linkedin_url(self, value):
        value = value.strip()
        if value and 'linkedin.com/' not in value.lower():
            raise serializers.ValidationError("Le lien doit être un profil LinkedIn (linkedin.com/in/...).")
        return value

    def validate_site_web(self, value):
        # Vague message on purpose: don't tell bots why they were rejected
        if value:
            raise serializers.ValidationError("Requête invalide.")
        return value

    def validate_cv(self, value):
        if value and value.size > MAX_CV_SIZE:
            raise serializers.ValidationError("Le fichier CV est trop volumineux (max 5MB).")
        return value
    def validate(self, data):
        if not self.instance and not data.get('consentement'):
            raise serializers.ValidationError(
                {"consentement": "Vous devez accepter le traitement de vos données pour envoyer votre candidature."}
            )

        offre = data.get('offre')
        email = data.get('email')

        # The internship type comes from the offer (PFE / été), not from the candidate
        if offre:
            data['type_stage'] = offre.programme if offre.type_offre == 'stage' else ''

        # School, level and start date are required for internship applications
        if not self.instance and offre and offre.type_offre == 'stage':
            manquants = {
                champ: "Ce champ est obligatoire pour une candidature de stage."
                for champ in ('ecole', 'niveau_etude', 'disponible_du')
                if not data.get(champ)
            }
            if manquants:
                raise serializers.ValidationError(manquants)

        debut = data.get('disponible_du', getattr(self.instance, 'disponible_du', None))
        fin = data.get('disponible_au', getattr(self.instance, 'disponible_au', None))
        if debut and fin and fin < debut:
            raise serializers.ValidationError(
                {"disponible_au": "La date de fin doit être après la date de début."}
            )

        if email:
            if offre:
                existe = Candidature.objects.filter(email=email, offre=offre)
                message = "Vous avez déjà postulé à cette offre avec cet email."
            else:
                # Candidature sans offre (spontanée) : la contrainte unique (email, offre)
                # ne bloque pas ce cas car la base considère deux NULL comme différents
                existe = Candidature.objects.filter(
                    email=email, offre__isnull=True, reference=data.get('reference', '')
                )
                message = "Vous avez déjà envoyé une candidature avec cet email."
            if self.instance:
                existe = existe.exclude(pk=self.instance.pk)
            if existe.exists():
                raise serializers.ValidationError({"email": message})
        return data
    