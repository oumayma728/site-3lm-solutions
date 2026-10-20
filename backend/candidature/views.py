
from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, permissions
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .crm import envoyer_au_crm
from .models import Candidature
from .serializers import CandidatureSerializer
from django.core.mail import EmailMessage
from django.http import FileResponse, Http404
from django.conf import settings
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.exceptions import Throttled
from django.core.cache import cache
import logging
import os
import time

logger = logging.getLogger(__name__)

FENETRE_PAR_OFFRE = 24 * 3600  # seconds


class CandidatureViewSet(viewsets.ModelViewSet):
    throttle_scope = 'candidature'
    queryset = Candidature.objects.all()
    serializer_class = CandidatureSerializer
    authentication_classes = [TokenAuthentication]

    def get_throttles(self):
        if self.action == 'create':
            return [ScopedRateThrottle()]
        return []

    def _cle_par_offre(self, request):
        # Same client IP logic as the DRF throttles (honours NUM_PROXIES behind the host's proxy)
        ip = ScopedRateThrottle().get_ident(request)
        offre = str(request.data.get('offre') or 'spontanee')[:20]
        return f'candidature_offre:{offre}:{ip}'

    def create(self, request, *args, **kwargs):
        """Per-offer limit. Only SUCCESSFUL applications count, so a candidate who fixes a form
        error is never locked out. Stored as (count, window end): cache.incr() would reset the timeout."""
        cle = self._cle_par_offre(request)
        now = time.time()
        count, fin = cache.get(cle) or (0, now + FENETRE_PAR_OFFRE)
        if count >= settings.CANDIDATURES_PAR_OFFRE_MAX:
            raise Throttled(
                wait=max(1, int(fin - now)),
                detail="Vous avez déjà postulé à cette offre récemment. Vous pourrez réessayer dans 24 heures.",
            )
        response = super().create(request, *args, **kwargs)
        cache.set(cle, (count + 1, fin), timeout=max(1, int(fin - now)))
        return response

    def perform_create(self, serializer):
        candidature = serializer.save()

        message = f"""
        Nouvelle candidature reçue.

        Nom : {candidature.nom}
        Email : {candidature.email}
        Téléphone : {candidature.telephone}
        Référence : {candidature.reference}
        Message :
        {candidature.message}
        """

        email = EmailMessage(
            subject=f"Nouvelle candidature - {candidature.nom}",
            body=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[settings.DEFAULT_FROM_EMAIL],
            reply_to=[candidature.email],
        )

        if candidature.cv:
            email.attach(
                candidature.cv_nom_original or os.path.basename(candidature.cv.name),
                candidature.cv.read()            )
        # The application is already saved: a mail server problem must not turn it into an error
        # for the candidate (a retry would then be refused as "already applied"). It stays in the admin.
        try:
            email.send()
        except Exception:
            logger.exception("Notification e-mail failed for candidature %s", candidature.pk)

    @action(detail=True, methods=['get'])
    def cv(self, request, pk=None):
        """Download the CV. Staff only (see get_permissions): /media/ is never served publicly."""
        candidature = self.get_object()
        if not candidature.cv:
            raise Http404("Aucun CV pour cette candidature.")
        try:
            fichier = candidature.cv.open('rb')
        except (FileNotFoundError, OSError):
            raise Http404("Le fichier CV est introuvable sur le serveur.")
        return FileResponse(
            fichier,
            as_attachment=True,
            filename=candidature.cv_nom_original or os.path.basename(candidature.cv.name),
        )

    @action(detail=True, methods=['post'])
    def accepter(self, request, pk=None):
        """First acceptance: pre-select the candidature and send it to the CRM for analysis.

        The pre-selection is kept even if the CRM is down; the error is stored and the admin can
        press the button again (the CRM updates the same candidate, it never duplicates it).
        """
        candidature = self.get_object()
        ok, message = envoyer_au_crm(candidature)
        candidature.statut = 'preselectionnee'
        candidature.crm_tentatives += 1
        candidature.crm_erreur = '' if ok else message[:300]
        if ok:
            candidature.crm_envoye_le = timezone.now()
        candidature.save(update_fields=['statut', 'crm_tentatives', 'crm_erreur', 'crm_envoye_le', 'updated_at'])
        return Response({
            'candidature': self.get_serializer(candidature).data,
            'crm_ok': ok,
            'message': message,
        })

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        return Candidature.objects.all()