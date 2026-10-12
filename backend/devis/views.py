from decimal import Decimal

from django.db import models
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.http import HttpResponse
from .models import Client, Devis, LigneDevis, Prestation, RendezVous
from .serializers import (
    ClientSerializer, DevisSerializer, LigneDevisSerializer, PrestationSerializer,
    RendezVousSerializer, RendezVousPublicSerializer,
)
from .services.ia import generer_devis_ia
from .services.pricing import calculer_prix_ligne
from .services.pdf import generer_pdf_devis
from .services.email import (
    envoyer_devis_par_email, envoyer_confirmation_rdv, envoyer_proposition_rdv, envoyer_demande_rdv_public,
)
from django.conf import settings
from django.core.mail import EmailMessage

class ClientViewSet(viewsets.ModelViewSet):
    """Gestion des prospects/clients — fiches créées via le formulaire public, un appel, ou un devis."""
    queryset=Client.objects.all().order_by('-date_creation')
    serializer_class = ClientSerializer

    def get_queryset(self):
        qs = Client.objects.all().order_by('-date_creation')
        params = self.request.query_params
        search = params.get('search')
        statut = params.get('statut')
        if search:
            qs = qs.filter(
                models.Q(nom__icontains=search)
                | models.Q(prenom__icontains=search)
                | models.Q(email__icontains=search)
                | models.Q(entreprise__icontains=search)
                | models.Q(telephone__icontains=search)
            )
        if statut:
            qs = qs.filter(statut=statut)
        return qs


class PrestationViewSet(viewsets.ModelViewSet):
    queryset = Prestation.objects.filter(actif=True).order_by('categorie', 'nom')
    serializer_class = PrestationSerializer


class DevisViewSet(viewsets.ModelViewSet):
    serializer_class = DevisSerializer

    def get_queryset(self):
        qs = Devis.objects.all().order_by('-date_creation')
        client_id = self.request.query_params.get('client')
        if client_id:
            qs = qs.filter(client_id=client_id)
        return qs

    def perform_create(self, serializer):
        devis = serializer.save(manager=self.request.user if self.request.user.is_authenticated else None)
        # Le prospect entre en phase de qualification dès qu'un devis est ouvert pour lui.
        if devis.client.statut == 'nouveau':
            devis.client.statut = 'qualifie'
            devis.client.save(update_fields=['statut'])

    @action(detail=True, methods=['post'])
    def generer_ia(self, request, pk=None):
        """Génère synthèse et lignes via l'IA, puis calcule le prix de chaque
        ligne à partir du profil/jours/complexité — l'IA n'indique jamais de
        prix directement, voir services.pricing.calculer_prix_ligne."""
        devis = self.get_object()
        instructions = request.data.get('instructions', '')

        besoins = devis.besoins_client
        if instructions:
            besoins = f"{besoins}\n\nInstructions supplémentaires :\n{instructions}"

        try:
            result = generer_devis_ia(besoins, devis.client.nom)
        except ValueError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as exc:
            return Response(
                {'error': f"Erreur lors de la génération IA : {exc}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        devis.synthese_ia = result.get('synthese', '')

        # Mode 'cout_reel' : l'IA donne toujours l'équipe/jours/complexité
        # par ligne (utile pour voir la charge de travail), mais AUCUN prix
        # par ligne n'est calculé ici — il n'y a pas de TJM à appliquer, le
        # prix final viendra du coût réel saisi par l'admin (voir
        # DevisSerializer.update et services.pricing.appliquer_marge_cout_reel).
        # En mode 'estimation_ia' (par défaut), on garde le calcul habituel.
        mode_cout_reel = devis.mode_tarification == 'cout_reel'

        devis.lignes.all().delete()
        for ligne in result.get('lignes', []):
            profil = ligne.get('profil_requis', 'junior')
            jours_estimes = ligne.get('jours_estimes', 1)
            nombre_personnes = ligne.get('nombre_personnes', 1)
            complexite = ligne.get('complexite', 'moyenne')

            # Decimal('0') en mode 'cout_reel' : prix_unitaire est un champ
            # obligatoire sur LigneDevis, mais n'a pas de sens dans ce mode —
            # le front masque cette colonne quand mode_tarification = 'cout_reel'.
            prix_unitaire = (
                Decimal('0') if mode_cout_reel
                else calculer_prix_ligne(profil, jours_estimes, nombre_personnes, complexite)
            )

            LigneDevis.objects.create(
                devis=devis,
                description=ligne['description'],
                quantite=1,
                profil=profil,
                jours_estimes=jours_estimes,
                nombre_personnes=nombre_personnes,
                complexite=complexite,
                prix_unitaire=prix_unitaire,
            )

        # estimation_montant = somme des lignes, jamais une valeur séparée
        # que l'IA aurait pu faire diverger du détail réel — SAUF en mode
        # 'cout_reel', où ce champ est piloté par le coût réel + marge
        # (saisi séparément par l'admin) et pas par les lignes, qui sont
        # toutes à 0 dans ce mode.
        if not mode_cout_reel:
            devis.estimation_montant = sum(l.total for l in devis.lignes.all())
        devis.save()

        devis.refresh_from_db()
        return Response(DevisSerializer(devis).data)

    @action(detail=True, methods=['post'])
    def valider(self, request, pk=None):
        """Valide le devis, génère le PDF et l'envoie automatiquement au client."""
        devis = self.get_object()

        if not devis.lignes.exists():
            return Response(
                {'error': "Impossible de valider un devis sans lignes."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        lignes = devis.lignes.all()
        if devis.mode_tarification == 'cout_reel':
            if not devis.estimation_montant or devis.estimation_montant <= 0:
                return Response({'error': "Renseignez le coût réel avant de valider."},
                                status=status.HTTP_400_BAD_REQUEST)
        else:
            a_zero = [l.description for l in lignes if l.prix_unitaire <= 0]
            if a_zero:
                return Response({'error': "Prix à 0 sur : " + ", ".join(a_zero)},
                                status=status.HTTP_400_BAD_REQUEST)
        devis.statut = 'valide'
        devis.save()

        try:
            envoyer_devis_par_email(devis)
            devis.statut = 'envoye'
            devis.save()
            if devis.client.statut != 'perdu':
                devis.client.statut = 'client'
                devis.client.save(update_fields=['statut'])
        except Exception as exc:
            # Le devis reste "validé" même si l'envoi échoue — le manager peut réessayer
            return Response(
                {
                    'status': 'devis validé mais email non envoyé',
                    'error': str(exc),
                    'devis': DevisSerializer(devis).data,
                },
                status=status.HTTP_207_MULTI_STATUS,
            )

        return Response({'status': 'devis validé et envoyé au client', 'devis': DevisSerializer(devis).data})

    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        """Endpoint : GET /api/devis/{id}/pdf/ — télécharge le devis en PDF (uniquement si validé)."""
        devis = self.get_object()

        if devis.statut not in ('valide', 'envoye'):
            return Response(
                {'error': "Le devis doit être validé avant de pouvoir être téléchargé en PDF."},
                status=status.HTTP_403_FORBIDDEN,
            )

        pdf_bytes = generer_pdf_devis(devis)
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="devis_{devis.id}.pdf"'
        return response


class RendezVousViewSet(viewsets.ModelViewSet):
    """Module « Ligne directe » : prise de rendez-vous, rattachée ou non à un devis."""

    serializer_class = RendezVousSerializer

    def get_queryset(self):
        qs = RendezVous.objects.all().select_related('client', 'devis')
        params = self.request.query_params
        devis_id = params.get('devis')
        client_id = params.get('client')
        statut = params.get('statut')
        if devis_id:
            qs = qs.filter(devis_id=devis_id)
        if client_id:
            qs = qs.filter(client_id=client_id)
        if statut:
            qs = qs.filter(statut=statut)
        return qs

    def get_permissions(self):
        if self.action in ('public', 'creneaux'):
            return [AllowAny()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(manager=self.request.user if self.request.user.is_authenticated else None)

    def create(self, request, *args, **kwargs):
        """Crée le rendez-vous puis prévient le client par email de la proposition de créneau."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)

        data = dict(serializer.data)
        try:
            envoyer_proposition_rdv(serializer.instance)
        except Exception as exc:
            data['email_warning'] = f"Rendez-vous créé mais email de proposition non envoyé : {exc}"

        return Response(data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=False, methods=['post'])
    def public(self, request):
        """POST /api/rendezvous/public/ — formulaire public du site (aucune authentification requise).

        Crée (ou retrouve) le prospect et son rendez-vous, puis lui envoie un accusé de réception.
        """
        serializer = RendezVousPublicSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        rendez_vous = serializer.save()

        email_envoye = True
        try:
            envoyer_demande_rdv_public(rendez_vous)
        except Exception:
            email_envoye = False

        data = RendezVousSerializer(rendez_vous).data
        data['email_envoye'] = email_envoye
        return Response(data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def creneaux(self, request):
        """GET /api/rendezvous/creneaux/?date=YYYY-MM-DD — créneaux déjà pris pour une date donnée."""
        date_str = request.query_params.get('date')
        if not date_str:
            return Response({'error': "Paramètre 'date' requis."}, status=status.HTTP_400_BAD_REQUEST)
        pris = RendezVous.objects.filter(
            date_rdv=date_str, statut__in=['demande', 'confirme'],
        ).values_list('heure_rdv', flat=True)
        return Response({'date': date_str, 'creneaux_pris': [h.strftime('%H:%M') for h in pris]})

    @action(detail=True, methods=['post'])
    def confirmer(self, request, pk=None):
        """Confirme le rendez-vous et tente d'envoyer un email de confirmation au client."""
        rdv = self.get_object()
        if rdv.statut != 'demande':
            return Response(
                {'error': "Seul un rendez-vous 'demandé' peut être confirmé."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        rdv.statut = 'confirme'
        rdv.save()

        try:
            envoyer_confirmation_rdv(rdv)
        except Exception as exc:
            return Response(
                {
                    'status': 'rendez-vous confirmé mais email non envoyé',
                    'error': str(exc),
                    'rendez_vous': RendezVousSerializer(rdv).data,
                },
                status=status.HTTP_207_MULTI_STATUS,
            )

        return Response({'status': 'rendez-vous confirmé et email envoyé au client', 'rendez_vous': RendezVousSerializer(rdv).data})

    @action(detail=True, methods=['post'])
    def annuler(self, request, pk=None):
        rdv = self.get_object()
        if rdv.statut not in ('demande', 'confirme'):
            return Response(
                {'error': "Seul un rendez-vous 'demandé' ou 'confirmé' peut être annulé."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        rdv.statut = 'annule'
        rdv.save()
        return Response(RendezVousSerializer(rdv).data)

    @action(detail=True, methods=['post'])
    def terminer(self, request, pk=None):
        rdv = self.get_object()
        if rdv.statut != 'confirme':
            return Response(
                {'error': "Seul un rendez-vous 'confirmé' peut être marqué comme terminé."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        rdv.statut = 'termine'
        rdv.save()
        return Response(RendezVousSerializer(rdv).data)