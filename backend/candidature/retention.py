"""Data retention for applications, as promised by the privacy policy (/public/confidentialite).

Applications and their CV are deleted 6 months after they were received. The CV file itself is
removed by the post_delete signal (signals.py), so deleting a row never leaves a file behind.
"""
import logging
from datetime import timedelta

from django.core.files.storage import default_storage
from django.utils import timezone

from .models import Candidature

logger = logging.getLogger(__name__)

# 6 months. Keep in sync with the privacy policy and the consent text of the application form.
RETENTION_DAYS = 183
CV_DIR = 'cvs'


def expired_candidatures(now=None):
    limit = (now or timezone.now()) - timedelta(days=RETENTION_DAYS)
    return Candidature.objects.filter(created_at__lt=limit)


def purge_candidatures(now=None, dry_run=False) -> int:
    """Delete the applications older than RETENTION_DAYS (and, via the signal, their CV). Returns the count."""
    expired = expired_candidatures(now)
    count = expired.count()
    if not dry_run and count:
        # QuerySet.delete() sends post_delete for every row, so each CV file is removed too
        expired.delete()
        logger.info('Retention: %s candidature(s) older than %s days deleted', count, RETENTION_DAYS)
    return count


def orphan_cv_files() -> list:
    """CV files on disk that no application points to any more (e.g. left by deletions before this cleanup existed)."""
    try:
        _, files = default_storage.listdir(CV_DIR)
    except FileNotFoundError:
        return []
    used = set(Candidature.objects.exclude(cv='').exclude(cv__isnull=True).values_list('cv', flat=True))
    return [f'{CV_DIR}/{name}' for name in files if f'{CV_DIR}/{name}' not in used]


def delete_orphan_cv_files(dry_run=False) -> int:
    orphans = orphan_cv_files()
    if dry_run:
        return len(orphans)
    deleted = 0
    for path in orphans:
        try:
            default_storage.delete(path)
            deleted += 1
        except OSError as exc:  # one locked/unreadable file must not stop the cleanup of the others
            logger.warning('Retention: could not delete %s (%s)', path, type(exc).__name__)
    if deleted:
        logger.info('Retention: %s orphan CV file(s) deleted', deleted)
    return deleted
