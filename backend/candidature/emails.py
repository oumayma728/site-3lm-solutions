"""E-mails sent to the candidate about their application.

The refusal text is the same as the CRM's (app/services/mailer.py, rejection_email), so a candidate
receives the same message whichever tool the decision is made in. Never include internal notes.
"""
import logging

from django.conf import settings
from django.core.mail import EmailMessage

logger = logging.getLogger(__name__)


def _poste(candidature):
    titre = candidature.offre.titre if candidature.offre else candidature.reference
    return f" pour « {titre} »" if titre else ""


def email_examen(candidature):
    """Sent once, the first time the CRM receives the candidature."""
    sujet = "Votre candidature chez 3LM Solutions est en cours d'examen"
    texte = f"""Bonjour {candidature.nom},

Merci pour votre candidature{_poste(candidature)}.

Votre profil a retenu notre attention : votre candidature est maintenant en cours d'examen par notre équipe. Nous reviendrons vers vous par e-mail dès qu'une décision aura été prise.

Vos données sont traitées conformément à notre politique de confidentialité.

L'équipe 3LM Solutions"""
    return sujet, texte


def email_refus(candidature):
    sujet = "Votre candidature chez 3LM Solutions"
    texte = f"""Bonjour {candidature.nom},

Nous vous remercions de l'intérêt que vous portez à 3LM Solutions et du temps consacré à votre candidature{_poste(candidature)}.

Après étude attentive de votre profil, nous ne sommes malheureusement pas en mesure de donner suite à votre candidature pour le moment.

Cette décision ne remet pas en cause la qualité de votre parcours. Vos données sont traitées conformément à notre politique de confidentialité.

Nous vous souhaitons plein succès dans vos recherches.

L'équipe 3LM Solutions"""
    return sujet, texte


def envoyer(candidature, contenu) -> bool:
    """Send (subject, text) to the candidate. Never raises: a mail problem must not undo the decision."""
    sujet, texte = contenu
    try:
        EmailMessage(
            subject=sujet, body=texte,
            from_email=settings.DEFAULT_FROM_EMAIL, to=[candidature.email],
            reply_to=[settings.DEFAULT_FROM_EMAIL],
        ).send()
        return True
    except Exception:
        logger.exception("E-mail to candidate failed for candidature %s", candidature.pk)
        return False
