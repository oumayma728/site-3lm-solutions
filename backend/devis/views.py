from datetime import timedelta

from django.db import models, transaction
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.http import HttpResponse
from .models import VALIDITE_DEVIS_JOURS, Client, Devis, Prestation, RendezVous
from .serializers import (
    ClientSerializer, DevisSerializer, PrestationSerializer,
    RendezVousSerializer, RendezVousPublicSerializer,
)
from .services.chiffrage import chiffrer, donnees_ligne, recalculer_estimation, remplacer_lignes
from .services.ia import DevisIAError, generer_devis_ia
from .services.pricing import TarificationError
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

    @staticmethod
    def _refus_fige(devis):
        return Response(
            {'error': "Ce devis est validé : il ne peut plus être modifié. Créez un nouveau devis pour toute modification."},
            status=status.HTTP_409_CONFLICT,
        ) if devis.est_fige else None

    @action(detail=True, methods=['post'])
    def generer_ia(self, request, pk=None):
        """Génère synthèse, hypothèses, questions et lignes via l'IA, puis calcule
        le prix de chaque ligne (services.pricing) — l'IA n'indique jamais de prix.

        Tout est vérifié et chiffré AVANT de toucher au devis : en cas d'erreur
        (IA invalide, tarif manquant), les lignes existantes restent intactes."""
        devis = self.get_object()
        if refus := self._refus_fige(devis):
            return refus

        try:
            result = generer_devis_ia(devis.besoins_client, devis.client.nom, request.data.get('instructions', ''))
        except DevisIAError as exc:
            return Response({'error': exc.message, 'details': exc.details}, status=exc.status_code)

        try:
            lignes = [chiffrer({
                'description': ligne['description'],
                'quantite': 1,
                'profil': ligne['profil_requis'],
                'jours_par_personne': ligne['jours_par_personne'],
                'nombre_personnes': ligne['nombre_personnes'],
                'complexite': ligne['complexite'],
            }, devis.mode_tarification) for ligne in result['lignes']]
        except TarificationError as exc:
            return Response({'error': f"Chiffrage impossible : {exc}"}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        with transaction.atomic():
            deja_genere = bool(devis.synthese_ia) or devis.lignes.exists()
            remplacer_lignes(devis, lignes)
            devis.synthese_ia = result['synthese']
            devis.hypotheses = result['hypotheses']
            devis.questions_ouvertes = result['questions_ouvertes']
            devis.budget_mentionne = result['budget_mentionne']   # affichage uniquement
            devis.ia_reponse_brute = result['reponse_brute']
            devis.ia_modele = result['modele']
            devis.ia_version_prompt = result['version_prompt']
            if deja_genere:
                devis.version += 1
            recalculer_estimation(devis)
            devis.save()

        devis.refresh_from_db()
        return Response(DevisSerializer(devis).data)

    @action(detail=True, methods=['post'])
    def recalculer_prix(self, request, pk=None):
        """Rechiffre les lignes d'un brouillon avec les tarifs (TJM, multiplicateurs)
        actuels — à utiliser quand le devis est signalé « tarifs modifiés »."""
        devis = self.get_object()
        if refus := self._refus_fige(devis):
            return refus
        try:
            lignes = [chiffrer(donnees_ligne(l), devis.mode_tarification) for l in devis.lignes.all()]
        except TarificationError as exc:
            return Response({'error': f"Chiffrage impossible : {exc}"}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        with transaction.atomic():
            remplacer_lignes(devis, lignes)
            devis.version += 1
            recalculer_estimation(devis)
            devis.save()
        devis.refresh_from_db()
        return Response(DevisSerializer(devis).data)

    @action(detail=True, methods=['get'])
    def apercu(self, request, pk=None):
        """GET /api/devis/{id}/apercu/ — le PDF exact qui sera envoyé, à relire AVANT
        de valider (un brouillon porte la mention « Aperçu »)."""
        devis = self.get_object()
        response = HttpResponse(generer_pdf_devis(devis), content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="apercu_{devis.numero or devis.id}.pdf"'
        return response

    def _envoyer(self, devis):
        """Envoie le devis par email ; 207 si l'envoi échoue (le devis reste validé)."""
        try:
            envoyer_devis_par_email(devis)
        except Exception as exc:
            return Response(
                {
                    'status': 'devis validé mais email non envoyé',
                    'error': str(exc),
                    'devis': DevisSerializer(devis).data,
                },
                status=status.HTTP_207_MULTI_STATUS,
            )
        devis.statut = 'envoye'
        devis.save(update_fields=['statut', 'date_modification'])
        if devis.client.statut != 'perdu':
            devis.client.statut = 'client'
            devis.client.save(update_fields=['statut'])
        return Response({'status': 'devis validé et envoyé au client', 'devis': DevisSerializer(devis).data})

    @action(detail=True, methods=['post'])
    def valider(self, request, pk=None):
        """Valide le devis — il est alors FIGÉ : lignes, prix et montant ne
        changeront plus, même si les TJM évoluent — puis l'envoie au client."""
        devis = self.get_object()
        if devis.est_fige:
            return Response({'error': "Ce devis est déjà validé. Utilisez « Renvoyer l'email » si l'envoi a échoué."},
                            status=status.HTTP_409_CONFLICT)
        if not devis.lignes.exists():
            return Response({'error': "Impossible de valider un devis sans lignes."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            devis = Devis.objects.select_for_update().get(pk=devis.pk)   # pas de double validation simultanée
            if devis.est_fige:
                return Response({'error': "Ce devis est déjà validé."}, status=status.HTTP_409_CONFLICT)
            try:
                recalculer_estimation(devis)   # le montant figé correspond exactement aux lignes
            except TarificationError as exc:
                return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

            lignes = list(devis.lignes.all())
            if devis.mode_tarification == 'cout_reel':
                if not devis.estimation_montant or devis.estimation_montant <= 0:
                    return Response({'error': "Renseignez le coût réel avant de valider."},
                                    status=status.HTTP_400_BAD_REQUEST)
            else:
                a_zero = [l.description for l in lignes if l.prix_unitaire <= 0]
                if a_zero:
                    return Response({'error': "Prix à 0 sur : " + ", ".join(a_zero)},
                                    status=status.HTTP_400_BAD_REQUEST)

            maintenant = timezone.now()
            devis.statut = 'valide'
            devis.date_validation = maintenant
            devis.date_validite = timezone.localdate(maintenant) + timedelta(days=VALIDITE_DEVIS_JOURS)
            devis.save()

        return self._envoyer(devis)

    @action(detail=True, methods=['post'])
    def renvoyer(self, request, pk=None):
        """Renvoie l'email d'un devis validé dont l'envoi avait échoué (le contenu ne change pas)."""
        devis = self.get_object()
        if devis.statut != 'valide':
            return Response({'error': "Seul un devis validé mais non envoyé peut être renvoyé."},
                            status=status.HTTP_400_BAD_REQUEST)
        return self._envoyer(devis)

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
        response['Content-Disposition'] = f'attachment; filename="devis_{devis.numero or devis.id}.pdf"'
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