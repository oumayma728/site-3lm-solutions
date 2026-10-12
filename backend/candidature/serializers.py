# Serializers for the Candidature model 

from rest_framework import serializers
from .models import Candidature

class CandidatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Candidature
        fields = [
            'id', 'nom', 'email', 'telephone', 'cv', 'message','reference','created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
