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
    # Public address of the offer, made from the title (SlugField's default limit, 50, was too short:
    # long titles crashed with "value too long for type character varying(50)")
    slug = models.SlugField(max_length=200, unique=True, blank=True)
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
            self.slug = self._slug_libre()
        super().save(*args, **kwargs)

    def _slug_libre(self):
        """Slug from the title, cut to fit the column, made unique with -2, -3… if the title is taken."""
        base = slugify(self.titre)[:190].strip('-') or 'offre'
        slug, n = base, 2
        while Offre.objects.filter(slug=slug).exclude(pk=self.pk).exists():
            slug, n = f'{base}-{n}', n + 1
        return slug

    def __str__(self):
        return self.titre
