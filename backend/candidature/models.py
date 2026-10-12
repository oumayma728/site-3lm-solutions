

# Create your models here.
# Define your databases tables

from django.db import models
from django.utils.text import slugify
from django.core.validators import FileExtensionValidator
# Create your models here.
class Candidature(models.Model):

    nom = models.CharField(max_length=200)
    email = models.CharField(max_length=200)
    telephone = models.CharField(max_length=200)
    cv = models.FileField(upload_to='cvs/',
        null=True,
        blank=True,
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx'])]
    )
    reference = models.CharField(max_length=200 , blank=True)

    message = models.CharField(max_length=400, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.nom
