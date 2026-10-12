# Serializers for the Offre model 

from rest_framework import serializers
from .models import Employe

class EmployeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employe
        fields = [
            'id', 'nom', 'prenom', 'email', 'telephone', 'poste', 'profil', 'salaire','created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        if not (request and request.user and request.user.is_superuser):
            data.pop('salaire', None)   # seul un superuser voit les salaires
        return data