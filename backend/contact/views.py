from django.shortcuts import render

# Create your views here.

from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, permissions
from rest_framework.authentication import TokenAuthentication
from .models import Contact
from .serializers import ContactSerializer
from django.core.mail import EmailMessage
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    authentication_classes = [TokenAuthentication]


    def perform_create(self, serializer):
        contact = serializer.save()

        message = f"""
        Nouvelle demande de contact reçue.

        Nom : {contact.nom}
        Email : {contact.email}
        Sujet : {contact.sujet}

        Message :
        {contact.message}
        """

        email = EmailMessage(
        subject=f"Nouveau contact - {contact.sujet}",
                body=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[settings.DEFAULT_FROM_EMAIL],
                reply_to=[contact.email],
                )

        # The message is already saved (visible in the admin): a mail server problem must not
        # turn it into an error for the visitor.
        try:
            email.send()
        except Exception:
            logger.exception("Notification e-mail failed for contact %s", contact.pk)




    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        return Contact.objects.all()