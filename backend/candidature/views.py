
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
from django.conf import settings
from rest_framework.throttling import ScopedRateThrottle
import os


class CandidatureViewSet(viewsets.ModelViewSet):
    throttle_scope = 'candidature'
    queryset = Candidature.objects.all()
    serializer_class = CandidatureSerializer
    authentication_classes = [TokenAuthentication]

    def get_throttles(self):
        if self.action == 'create':
            return [ScopedRateThrottle()]
        return []
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
                os.path.basename(candidature.cv.name),
                candidature.cv.read()            )
        email.send()
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