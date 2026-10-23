# Serializers for the Offre model

from django.utils import timezone
from rest_framework import serializers
from .models import Offre

class OffreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Offre
        fields = [
            'id', 'titre', 'slug', 'type_offre', 'programme', 'departement', 'location',
            'contract_type', 'experience', 'description',
            'about_role', 'responsibilities', 'qualifications', 'benefits',
            'skills', 'actif', 'cloturee', 'cloturee_le', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'slug', 'cloturee_le', 'created_at', 'updated_at']

    def update(self, instance, validated_data):
        # Remember when the offer was closed (cleared when it is reopened)
        if 'cloturee' in validated_data and validated_data['cloturee'] != instance.cloturee:
            validated_data['cloturee_le'] = timezone.now() if validated_data['cloturee'] else None
        return super().update(instance, validated_data)
