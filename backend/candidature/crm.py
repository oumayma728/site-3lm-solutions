"""Send an accepted candidature to the CRM (the internship management tool).

The CRM keeps one candidate per `source_id` (our candidature id): sending the same candidature
again updates it, never duplicates it, so a retry after a failure is always safe.
"""
import logging
import mimetypes
import os

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

TIMEOUT = 20  # seconds


def _payload(candidature):
    offre = candidature.offre
    data = {
        'source_id': candidature.id,
        'name': candidature.nom,
        'email': candidature.email,
        'phone': candidature.telephone,
        'school': candidature.ecole,
        'study_level': candidature.niveau_etude,
        'internship_type': candidature.type_stage,
        'start_date': candidature.disponible_du.isoformat() if candidature.disponible_du else None,
        'end_date': candidature.disponible_au.isoformat() if candidature.disponible_au else None,
        'linkedin_url': candidature.linkedin_url,
        'message': candidature.message,
        # The offer the person applied to ("Internship AI"): the CRM uses it as a hint for the matching
        'offer_title': offre.titre if offre else candidature.reference,
        'offer_id': offre.id if offre else None,
        'consent_date': candidature.consentement_date.isoformat() if candidature.consentement_date else None,
        'consent_version': candidature.consentement_version,
    }
    # The CRM rejects empty strings for typed fields: send only what we have
    return {k: v for k, v in data.items() if v not in (None, '')}


def envoyer_au_crm(candidature):
    """Return (ok, message). Never raises: the caller decides what to show the admin."""
    base = (settings.CRM_API_URL or '').strip().rstrip('/')
    key = (settings.CRM_API_KEY or '').strip()
    if not base or not key:
        return False, "Connexion au CRM non configurée (CRM_API_URL / CRM_API_KEY)."

    files = None
    cv_file = None
    if candidature.cv:
        try:
            cv_file = candidature.cv.open('rb')
        except (FileNotFoundError, OSError, ValueError):
            return False, "Le fichier CV est introuvable sur le serveur."
        nom = candidature.cv_nom_original or os.path.basename(candidature.cv.name)
        mime = mimetypes.guess_type(nom)[0] or 'application/octet-stream'
        files = {'cv': (nom, cv_file, mime)}

    try:
        resp = requests.post(
            f'{base}/candidates/', data=_payload(candidature), files=files,
            headers={'X-API-Key': key}, timeout=TIMEOUT,
        )
    except requests.RequestException as exc:
        # class name only: never log request details (they contain the API key)
        logger.warning('CRM unreachable for candidature %s: %s', candidature.pk, type(exc).__name__)
        return False, "Le CRM est injoignable. Réessayez dans un instant."
    finally:
        if cv_file:
            cv_file.close()

    if resp.status_code in (200, 201):
        return True, "Candidature envoyée au CRM." if resp.status_code == 201 else "Candidature mise à jour dans le CRM."
    if resp.status_code == 401:
        return False, "Le CRM a refusé la clé API (CRM_API_KEY différente de CANDIDATES_API_KEY)."
    if resp.status_code == 503:
        return False, "Le CRM n'est pas configuré pour recevoir des candidatures."
    detail = ''
    try:
        raw = resp.json().get('detail')
        detail = raw if isinstance(raw, str) else 'données refusées'
    except ValueError:
        pass
    logger.warning('CRM answered %s for candidature %s', resp.status_code, candidature.pk)
    return False, f"Le CRM a répondu {resp.status_code}" + (f" : {detail}" if detail else ".")
