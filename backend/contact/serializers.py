# Serializers for the Contact model 

from rest_framework import serializers
from .models import Contact

class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = [
            'id', 'nom', 'email', 'sujet', 'message','created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
