# Serializers for the Offre model 

from rest_framework import serializers
from .models import Offre

class OffreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Offre
        fields = [
            'id', 'titre', 'slug', 'type_offre', 'programme', 'departement', 'location',
            'contract_type', 'experience', 'description',
            'about_role', 'responsibilities', 'qualifications', 'benefits',
            'skills', 'actif', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']
