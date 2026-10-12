from django.db import models


class Employe(models.Model):
    PROFIL_CHOICES = [
        ('junior', 'junior'),
        ('senior', 'senior'),
        ('chef_de_projet', 'chef_de_projet'),
    ]

    nom = models.CharField(max_length=200)
    prenom = models.CharField(max_length=200)
    poste = models.CharField(max_length=200)
    profil = models.CharField(max_length=20, choices=PROFIL_CHOICES)
    email = models.EmailField(max_length=254, blank=True, null=True)
    telephone = models.CharField(max_length=20, blank=True, null=True)
    salaire = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    actif = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.prenom} {self.nom}"