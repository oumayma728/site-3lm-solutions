# Define your databases tables

from django.db import models
from django.utils.text import slugify

# Create your models here.
class Offre(models.Model):
    TYPE_CHOICES = [
        ('emploi', 'Emploi'),
        ('stage', 'Stage'),
    ]
    PROGRAMME_CHOICES = [
        ('ete', 'Stage été'),
        ('pfe', 'Stage PFE'),
    ]
    titre = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True)
    type_offre = models.CharField(max_length=20, choices=TYPE_CHOICES , default='emploi')
    programme = models.CharField(max_length=10, choices=PROGRAMME_CHOICES, blank=True)
    departement = models.CharField(max_length=100, blank=True)
    location = models.CharField(max_length=100, blank=True)
    contract_type = models.CharField(max_length=100, default='Temps plein')
    experience = models.CharField(max_length=100, blank=True)
    description = models.TextField()
    about_role = models.JSONField(default=list, blank=True)
    responsibilities = models.JSONField(default=list, blank=True)
    qualifications = models.JSONField(default=list, blank=True)
    benefits = models.JSONField(default=list, blank=True)
    skills = models.JSONField(default=list, blank=True)
    # actif=False: archived — hidden from the public site, kept in the admin.
    # cloturee=True: still shown publicly as "Offre clôturée", but no longer accepts applications.
    actif = models.BooleanField(default=True)
    cloturee = models.BooleanField(default=False)
    cloturee_le = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.titre)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.titre
