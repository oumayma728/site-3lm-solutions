"""Never leave a CV on disk once its application is gone (privacy policy: CVs are deleted with the application)."""
from django.db import transaction
from django.db.models.signals import post_delete, pre_save
from django.dispatch import receiver

from .models import Candidature


def _delete_after_commit(storage, name):
    # only once the database change is committed: if it is rolled back, the file must still be there
    if name:
        transaction.on_commit(lambda: storage.delete(name))


@receiver(post_delete, sender=Candidature)
def delete_cv_with_candidature(sender, instance, **kwargs):
    _delete_after_commit(instance.cv.storage, instance.cv.name)


@receiver(pre_save, sender=Candidature)
def delete_replaced_cv(sender, instance, **kwargs):
    if not instance.pk:
        return
    old = Candidature.objects.filter(pk=instance.pk).values_list('cv', flat=True).first()
    if old and old != instance.cv.name:
        _delete_after_commit(instance.cv.storage, old)
