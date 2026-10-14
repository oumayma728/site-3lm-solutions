
from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, permissions
from rest_framework.authentication import TokenAuthentication
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
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        return Candidature.objects.all()