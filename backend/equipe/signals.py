from .models import  Employe
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver


@receiver(post_save, sender=Employe)
@receiver(post_delete, sender=Employe)
def recalculer_tarifs_profils_signal(sender, **kwargs):
    """Signal déclenché à chaque ajout/modification/suppression d'un employé
    dans l'app 'equipe'. Recalcule automatiquement le TJM de chaque profil
    à partir des salaires réels de l'équipe, sauf si 'tjm_manuel' est coché
    pour un profil donné."""
    from devis.services.pricing import recalculer_tarifs_profils

    recalculer_tarifs_profils()
