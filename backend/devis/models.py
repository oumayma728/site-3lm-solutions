from decimal import Decimal

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.contrib.auth.models import User
from django.db.models import Q, UniqueConstraint

# Choix partagés entre les lignes de devis, les tarifs et les multiplicateurs —
# une seule définition, pour que l'IA, le calcul de prix et l'admin parlent
# exactement des mêmes valeurs.
PROFIL_CHOICES = [
    ('junior', 'Junior'),
    ('senior', 'Senior'),
    ('chef_de_projet', 'Chef de projet'),
]
COMPLEXITE_CHOICES = [
    ('simple', 'Simple'),
    ('moyenne', 'Moyenne'),
    ('complexe', 'Complexe'),
]

STATUTS_FIGES = ('valide', 'envoye')   # un devis validé n'est plus modifiable

VALIDITE_DEVIS_JOURS = 30


class Client(models.Model):
    STATUT_CHOICES = [
        ('nouveau', 'Nouveau prospect'),
        ('contacte', 'Contacté'),
        ('qualifie', 'Qualifié (devis en cours)'),
        ('client', 'Client (devis envoyé)'),
        ('perdu', 'Perdu'),
    ]

    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100, blank=True)
    entreprise = models.CharField(max_length=200, blank=True)
    email = models.EmailField()
    telephone = models.CharField(max_length=20)
    message = models.TextField(blank=True, help_text="Message initial laissé via le formulaire public")
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='nouveau')
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nom} - {self.entreprise}"


class Devis(models.Model):
    STATUT_CHOICES = [
        ('brouillon', 'Brouillon'),
        ('en_attente', 'En attente de validation'),
        ('valide', 'Validé'),
        ('envoye', 'Envoyé au client'),
        ('refuse', 'Refusé'),
    ]
    DEVISE_CHOICES = [
        ('TND', 'Dinar tunisien (DT)'),
        ('EUR', 'Euro (€)'),
        ('USD', 'Dollar américain ($)'),
    ]
    # Deux façons de chiffrer un devis, choisies par l'admin (à la création,
    # modifiable ensuite) :
    # - 'estimation_ia' (comportement historique) : l'IA estime profil/jours/
    #   complexité par ligne, et le prix de chaque ligne est calculé à partir
    #   du TJM du profil (voir services.pricing.calculer_prix_ligne).
    # - 'cout_reel' : l'IA estime toujours l'équipe/complexité (aucun prix par
    #   ligne), et c'est l'admin qui saisit le coût réel total qu'il a payé
    #   (salaires, charges, déploiement, impôts...) dans le champ cout_reel
    #   ci-dessous. Le prix final devient alors cout_reel + marge bénéficiaire
    #   (voir services.pricing.appliquer_marge_cout_reel).
    MODE_TARIFICATION_CHOICES = [
        ('estimation_ia', 'Estimation IA (TJM par profil)'),
        ('cout_reel', 'Coût réel + marge'),
    ]

    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='devis')
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    besoins_client = models.TextField(help_text="Notes brutes prises pendant l'appel")
    synthese_ia = models.TextField(blank=True, help_text="Résumé généré par l'IA")
    # Les montants (lignes + estimation_montant) sont TOUJOURS stockés en TND —
    # c'est la devise de calcul (TarifProfil.tjm est en TND). 'devise' ne sert
    # qu'à l'affichage/export : la conversion se fait à la volée, voir
    # services.currency.convertir. Ça évite toute dérive d'arrondi liée à des
    # conversions répétées d'un montant déjà converti.
    estimation_montant = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    devise = models.CharField(
        max_length=3, choices=DEVISE_CHOICES, default='TND',
        help_text="Devise d'affichage — détectée automatiquement depuis les besoins du client, modifiable manuellement.",
    )
    # Quel mode de calcul ce devis utilise — voir MODE_TARIFICATION_CHOICES.
    mode_tarification = models.CharField(
        max_length=20, choices=MODE_TARIFICATION_CHOICES, default='estimation_ia',
    )
    # Saisi à la main par l'admin, UNIQUEMENT utilisé quand mode_tarification
    # = 'cout_reel'. C'est le montant réellement payé (pas un calcul) — la
    # marge est appliquée par-dessus pour obtenir estimation_montant.
    cout_reel = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(Decimal('0'))],
        help_text="Coût réel total payé par l'admin (salaires, charges, déploiement, impôts...) — mode 'cout_reel' uniquement.",
    )

    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='brouillon')
    fichier_pdf = models.FileField(upload_to='devis_pdf/', null=True, blank=True)

    # --- Analyse IA (remplie à la génération, voir services.ia) ---
    # Ce que l'IA a supposé faute d'information, et ce qu'il faut demander au
    # client : affichés au manager AVANT les lignes, pour qu'il les vérifie.
    hypotheses = models.JSONField(default=list, blank=True)
    questions_ouvertes = models.JSONField(default=list, blank=True)
    # Budget cité par le client ({"montant", "devise"} ou null). Affichage
    # uniquement : il n'intervient JAMAIS dans le calcul du prix.
    budget_mentionne = models.JSONField(null=True, blank=True)
    # Traçabilité : réponse brute de l'IA, modèle et version du prompt utilisés.
    ia_reponse_brute = models.JSONField(null=True, blank=True)
    ia_modele = models.CharField(max_length=100, blank=True)
    ia_version_prompt = models.CharField(max_length=40, blank=True)

    # --- Identification et validité ---
    numero = models.CharField(max_length=20, unique=True, null=True, blank=True,
                              help_text="Numéro affiché au client, ex. DEV-2026-00042 (attribué à la création).")
    # +1 à chaque nouvelle génération IA ou modification des lignes : la
    # version envoyée au client est celle qui était à jour au moment de "Valider".
    version = models.PositiveIntegerField(default=1)
    date_validation = models.DateTimeField(null=True, blank=True)
    date_validite = models.DateField(null=True, blank=True,
                                     help_text=f"Date limite de l'offre ({VALIDITE_DEVIS_JOURS} jours après validation).")

    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    @property
    def est_fige(self) -> bool:
        """Un devis validé/envoyé est figé : ses lignes, prix et montants ne
        bougent plus, même si les tarifs (TJM) changent ensuite."""
        return self.statut in STATUTS_FIGES

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if not self.numero:
            # Basé sur l'id : unique et sans course entre deux créations simultanées.
            self.numero = f"DEV-{self.date_creation:%Y}-{self.pk:05d}"
            super().save(update_fields=['numero'])

    def __str__(self):
        return f"Devis {self.numero or self.id} - {self.client.nom}"


class Prestation(models.Model):
    CATEGORIE_CHOICES = [
        ('developpement', 'Développement'),
        ('design', 'Design / UI-UX'),
        ('infrastructure', 'Infrastructure / DevOps'),
        ('formation', 'Formation / Accompagnement'),
        ('maintenance', 'Maintenance / Support'),
        ('autre', 'Autre'),
    ]

    nom = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    categorie = models.CharField(max_length=20, choices=CATEGORIE_CHOICES, default='autre')
    prix_reference = models.DecimalField(max_digits=10, decimal_places=2, help_text="Prix de référence en TND")
    actif = models.BooleanField(default=True, help_text="Décoche pour retirer du catalogue sans supprimer l'historique")

    def __str__(self):
        return f"{self.nom} ({self.prix_reference} TND)"

    class Meta:
        verbose_name_plural = "Prestations"


class LigneDevis(models.Model):
    PROFIL_CHOICES = PROFIL_CHOICES
    COMPLEXITE_CHOICES = COMPLEXITE_CHOICES

    devis = models.ForeignKey(Devis, on_delete=models.CASCADE, related_name='lignes')
    prestation = models.ForeignKey(
        Prestation, on_delete=models.SET_NULL, null=True, blank=True, related_name='lignes_devis'
    )
    profil = models.CharField(max_length=20, choices=PROFIL_CHOICES, default='junior')
    # Jours de travail de CHAQUE personne affectée (pas le total de l'équipe).
    jours_par_personne = models.DecimalField(
        max_digits=6, decimal_places=1, null=True, blank=True,
        validators=[MinValueValidator(Decimal('0.1'))],
    )
    nombre_personnes = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    complexite = models.CharField(max_length=10, choices = COMPLEXITE_CHOICES, blank=True)

    description = models.CharField(max_length=255)
    quantite = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0'))])

    # --- Instantané du calcul (services.pricing.PrixLigne), pris au moment du
    # chiffrage. Il explique le prix et permet de repérer un brouillon dont le
    # TJM a changé depuis. Vides pour une ligne saisie à la main sans estimation.
    tjm = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    multiplicateur = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    jours_personne = models.DecimalField(max_digits=8, decimal_places=1, null=True, blank=True)
    prix = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    @property
    def total(self):
        return self.quantite * self.prix_unitaire

    def __str__(self):
        return f"{self.description} x{self.quantite}"


class RendezVous(models.Model):
    TYPE_CHOICES = [
        ('appel', 'Appel téléphonique'),
        ('visio', 'Visioconférence'),
        ('sur_site', 'Sur site'),
    ]
    STATUT_CHOICES = [
        ('demande', 'Demandé'),
        ('confirme', 'Confirmé'),
        ('annule', 'Annulé'),
        ('termine', 'Terminé'),
    ]

    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='rendez_vous')
    devis = models.ForeignKey(
        Devis, on_delete=models.SET_NULL, null=True, blank=True, related_name='rendez_vous',
        help_text="Devis concerné par ce rendez-vous (facultatif)",
    )
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    SOURCE_CHOICES = [
        ('interne', 'Proposé par le manager'),
        ('public', 'Demandé par le visiteur (formulaire en ligne)'),
    ]

    date_rdv = models.DateField()
    heure_rdv = models.TimeField()
    type_rdv = models.CharField(max_length=20, choices=TYPE_CHOICES, default='appel')
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='demande')
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='interne')
    notes = models.TextField(blank=True, help_text="Objet de l'appel / sujet à aborder")

    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date_rdv', '-heure_rdv']
        verbose_name = "Rendez-vous"
        verbose_name_plural = "Rendez-vous (Ligne directe)"
        constraints = [
            UniqueConstraint(
                fields=['date_rdv', 'heure_rdv'],
                condition=Q(statut__in=['demande', 'confirme']),
                name='creneau_unique_actif',
            ),
        ]

    def __str__(self):
        return f"RDV #{self.id} - {self.client.nom} ({self.date_rdv} {self.heure_rdv})"
class ParametresTarification(models.Model):
    """Réglages globaux de tarification — un seul enregistrement (voir
    ParametresTarification.actuels()). Modifiables dans l'admin Django.

    TJM d'un profil (services.pricing.recalculer_tarifs_profils) :
        (salaire_brut × (1 + taux_charges) × 12 + frais_generaux_annuels / nb_profils_facturables)
        / jours_facturables_an × (1 + marge)

    Mode 'cout_reel' (services.pricing.appliquer_marge_cout_reel) :
        prix = coût / (1 − taux_marge)   — taux_marge est une marge SUR LE PRIX
        (30 % => 30 % du prix de vente est de la marge), pas un coefficient
        ajouté au coût.
    """
    taux_charges = models.DecimalField(
        max_digits=5, decimal_places=4, default=Decimal('0.1857'),
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('1'))],
        help_text="Charges patronales en fraction du salaire brut (0.1857 = 18,57 %).",
    )
    jours_facturables_an = models.PositiveIntegerField(
        default=165, validators=[MinValueValidator(1), MaxValueValidator(366)],
        help_text="Jours réellement facturables par personne et par an (hors congés, formation, avant-vente…).",
    )
    frais_generaux_annuels = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal('0'), validators=[MinValueValidator(Decimal('0'))],
        help_text="Frais fixes annuels (loyer, logiciels, comptable…), en TND, répartis entre les profils facturables.",
    )
    marge = models.DecimalField(
        max_digits=5, decimal_places=4, default=Decimal('0.60'),
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('5'))],
        help_text="Marge appliquée au coût pour obtenir le TJM (0.60 = +60 %).",
    )
    taux_marge = models.DecimalField(
        max_digits=5, decimal_places=4, default=Decimal('0.30'),
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('0.95'))],
        help_text="Mode 'coût réel' : part du prix de vente qui est de la marge (0.30 = 30 % du prix). "
                  "Saisir une fraction, pas un pourcentage.",
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Paramètres de tarification"
        verbose_name_plural = "Paramètres de tarification"

    @classmethod
    def actuels(cls) -> 'ParametresTarification':
        """L'unique jeu de paramètres, créé avec les valeurs par défaut s'il n'existe pas encore."""
        parametres = cls.objects.order_by('pk').first()
        return parametres or cls.objects.create()

    def __str__(self):
        return "Paramètres de tarification"


class TarifProfil(models.Model):
    """Taux journalier moyen (TJM) par profil, utilisé pour calculer le prix
    des lignes de devis. Recalculé automatiquement à partir des salaires réels
    de l'équipe (app 'equipe') à chaque ajout/modification/suppression d'un
    employé — sauf si 'tjm_manuel' est coché, auquel cas la valeur reste
    figée jusqu'à modification manuelle explicite."""
    PROFIL_CHOICES = PROFIL_CHOICES
    profil = models.CharField(max_length=20, choices=PROFIL_CHOICES, unique=True)
    tjm = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(0)],
        help_text="Taux journalier moyen, en TND",
    )
    # Le TJM calculé à partir des salaires et des paramètres : toujours mis à
    # jour, même quand tjm est saisi à la main. Un TJM manuel en dessous de ce
    # plancher fait perdre de l'argent (alerte dans l'admin).
    tjm_plancher = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="TJM calculé à partir des salaires (recalculé automatiquement).",
    )
    tjm_manuel = models.BooleanField(
        default=False,
        help_text="Cochez pour figer le TJM et ne plus le recalculer automatiquement à partir des salaires.",
    )
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def sous_plancher(self) -> bool:
        return self.tjm_plancher is not None and self.tjm < self.tjm_plancher

    def __str__(self):
        return f"{self.get_profil_display()} — {self.tjm} TND/jour"


class MultiplicateurComplexite(models.Model):
    """Coefficient appliqué au prix d'une ligne selon sa complexité
    (anciennement codé en dur dans services.pricing). Modifiable dans l'admin."""
    complexite = models.CharField(max_length=10, choices=COMPLEXITE_CHOICES, unique=True)
    multiplicateur = models.DecimalField(
        max_digits=5, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.1')), MaxValueValidator(Decimal('10'))],
    )

    class Meta:
        verbose_name = "Multiplicateur de complexité"
        verbose_name_plural = "Multiplicateurs de complexité"

    def __str__(self):
        return f"{self.get_complexite_display()} × {self.multiplicateur}"
