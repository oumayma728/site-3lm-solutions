# Create your models here.
# Define your databases tables
import os , uuid
from django.db import models
from django.utils.text import slugify
from django.core.validators import FileExtensionValidator
# Create your models here.
TYPE_STAGE_CHOICES = [('pfe', 'Stage PFE'), ('ete', 'Stage été'), ('autre', 'Autre')]

# Single source of truth for the study levels. The stored value is the label itself,
# so it reads clearly in the DB/admin and matches NIVEAUX_ETUDE in CandidatureForm.tsx.
NIVEAU_ETUDE_CHOICES = [(n, n) for n in [
    'Licence 1', 'Licence 2', 'Licence 3',
    'Master 1', 'Master 2',
    'Cycle ingénieur 1', 'Cycle ingénieur 2', 'Cycle ingénieur 3',
    'Autre',
]]

# Pre-selection: only an accepted candidature is sent to the CRM (intern management tool) for analysis.
# 'refusee': turned down here, before reaching the CRM (once in the CRM, the decision is made there).
STATUT_CHOICES = [('nouvelle', 'Nouvelle'), ('preselectionnee', 'Pré-sélectionnée'), ('refusee', 'Refusée')]


def cv_upload_to(instance, filename):
    """Random, unguessable file name. The name the candidate uploaded is kept in cv_nom_original.

    CVs are never served from /media/: only through the authenticated GET /api/candidature/<id>/cv/.
    """
    ext = os.path.splitext(filename)[1].lower()
    return f"cvs/{uuid.uuid4().hex}{ext}"


class Candidature(models.Model):

    nom = models.CharField(max_length=200)
    email = models.EmailField(max_length=254)
    telephone = models.CharField(max_length=200)
    cv = models.FileField(upload_to=cv_upload_to,
        null=True,
        blank=True,
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx'])]
    )
    reference = models.CharField(max_length=200 , blank=True)

    message = models.CharField(max_length=400, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    type_stage = models.CharField(max_length=200, blank=True, choices=TYPE_STAGE_CHOICES)
    ecole = models.CharField(max_length=200, blank=True)
    niveau_etude = models.CharField(max_length=200, blank=True, choices=NIVEAU_ETUDE_CHOICES)
    linkedin_url = models.URLField(max_length=200, blank=True)
    consentement_date = models.DateTimeField(null=True, blank=True)
    consentement_version = models.CharField(max_length=20, blank=True)
    cv_nom_original = models.CharField(max_length=200, blank=True)
    offre = models.ForeignKey('offres.Offre', null=True, blank=True, on_delete=models.SET_NULL, related_name='candidatures')
    disponible_du = models.DateField(null=True, blank=True)
    disponible_au = models.DateField(null=True, blank=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='nouvelle')
    crm_envoye_le = models.DateTimeField(null=True, blank=True)   # set once the CRM has received it
    crm_tentatives = models.PositiveSmallIntegerField(default=0)
    crm_erreur = models.CharField(max_length=300, blank=True)     # last send error, empty when fine
    refusee_le = models.DateTimeField(null=True, blank=True)
    # E-mails to the candidate (null = not sent, or the mail server failed): never sent twice
    email_examen_envoye_le = models.DateTimeField(null=True, blank=True)   # "under review" (sent to the CRM)
    email_refus_envoye_le = models.DateTimeField(null=True, blank=True)

    # AI pre-analysis of the CV against the offer's required skills (candidature/analyse.py).
    # It only FLAGS candidatures outside the criteria: a person always decides (privacy policy).
    ANALYSE_CHOICES = [('', 'Non analysée'), ('en_cours', 'En cours'), ('ok', 'Analysée'),
                       ('non_analysable', 'Non analysable'), ('erreur', 'Erreur')]
    analyse_statut = models.CharField(max_length=20, choices=ANALYSE_CHOICES, blank=True, default='')
    analyse_le = models.DateTimeField(null=True, blank=True)
    # {competences: [offer skills found], technologies: [...], nb_projets, projets: [...], resume, modele}
    analyse = models.JSONField(default=dict, blank=True)
    analyse_erreur = models.CharField(max_length=300, blank=True)

    def save(self, *args, **kwargs):
        if self.email:
            self.email = self.email.strip().lower()
        super().save(*args, **kwargs)
    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(fields=['email', 'offre'], name='unique_candidature_email_offre')
        ]

    def __str__(self):
        return self.nom


class CriteresTri(models.Model):
    """Thresholds of the "Hors critères" flag (single row, edited from the candidatures page).

    A candidature is OUTSIDE the criteria when BOTH are true:
      fewer than `min_competences` of the offer's required skills appear in the CV, AND
      fewer than `min_projets` projects are described in it.
    """
    min_competences = models.PositiveSmallIntegerField(default=1)
    min_projets = models.PositiveSmallIntegerField(default=2)
    analyse_auto = models.BooleanField(default=True)   # analyse each new candidature on arrival

    class Meta:
        verbose_name = 'Critères de tri des candidatures'
        verbose_name_plural = 'Critères de tri des candidatures'

    @classmethod
    def actuels(cls):
        return cls.objects.order_by('id').first() or cls.objects.create()

    def __str__(self):
        return f'< {self.min_competences} compétence(s) et < {self.min_projets} projet(s)'
