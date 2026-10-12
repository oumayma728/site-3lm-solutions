

# Create your models here.
# Define your databases tables

from django.db import models
from django.utils.text import slugify
from django.core.validators import FileExtensionValidator
# Create your models here.
class Contact(models.Model):

    nom = models.CharField(max_length=200)
    email = models.CharField(max_length=200)
    sujet = models.CharField(max_length=200)
    message = models.CharField(max_length=400, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.nom
