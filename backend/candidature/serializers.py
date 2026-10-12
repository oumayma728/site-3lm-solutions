# Serializers for the Candidature model 

from rest_framework import serializers
from .models import Candidature
class CandidatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Candidature
        fields = [
            'id', 'nom', 'email', 'telephone', 'cv', 'offre', 'message','reference','created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        validators = []
    def validate_email(self, value):
        return value.strip().lower()  # Normaliser l'email en minuscules et supprimer les espaces
    def validate_offre(self, value):
        if value and not value.actif:
            raise serializers.ValidationError("L'offre sélectionnée n'est pas active.")
        return value

        
    def validate(self, data):
        offre = data.get('offre')
        email = data.get('email')
        if offre and email:
            existe = Candidature.objects.filter(email=email, offre=offre)
            if self.instance:
                existe = existe.exclude(pk=self.instance.pk)
            if existe.exists():
                raise serializers.ValidationError(
                    {"email": "Vous avez déjà postulé à cette offre avec cet email."}
                )
        return data