from django.core.validators import MinValueValidator
from django.db import models
from django.contrib.auth.models import User
from django.db.models import Q, UniqueConstraint


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
        help_text="Coût réel total payé par l'admin (salaires, charges, déploiement, impôts...) — mode 'cout_reel' uniquement.",
    )

    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='brouillon')
    fichier_pdf = models.FileField(upload_to='devis_pdf/', null=True, blank=True)

    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Devis #{self.id} - {self.client.nom}"


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
    devis = models.ForeignKey(Devis, on_delete=models.CASCADE, related_name='lignes')
    prestation = models.ForeignKey(
        Prestation, on_delete=models.SET_NULL, null=True, blank=True, related_name='lignes_devis'
    )
    profil = models.CharField(max_length=20, choices=PROFIL_CHOICES, default='junior')
    jours_estimes = models.DecimalField(max_digits=6, decimal_places=1, null=True, blank=True)
    nombre_personnes = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    complexite = models.CharField(max_length=10, choices = COMPLEXITE_CHOICES, blank=True)
    
    description = models.CharField(max_length=255)
    quantite = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2)

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
    """Réglages globaux de tarification. Un seul enregistrement est censé
    exister (voir services.pricing qui lit le premier trouvé, ou 30% par
    défaut si aucune ligne n'a encore été créée)."""
    charge_patronale = models.DecimalField(
        max_digits=5, decimal_places=2, default=0.25)
    taux_utilisation = models.DecimalField(
        max_digits=5, decimal_places=2, default=0.75)
    # Utilisée par le mode de tarification 'cout_reel' du devis (voir
    # services.pricing.appliquer_marge_cout_reel) : le prix final facturé au
    # client = coût réel payé x (1 + marge_beneficiaire). 30% par défaut.
    marge_beneficiaire = models.DecimalField(
        max_digits=5, decimal_places=2, default=0.30)
    updated_at = models.DateTimeField(auto_now=True)
class TarifProfil(models.Model):
    """Taux journalier moyen (TJM) par profil, utilisé pour calculer le prix
    des lignes de devis. Recalculé automatiquement à partir des salaires réels
    de l'équipe (app 'equipe') à chaque ajout/modification/suppression d'un
    employé — sauf si 'tjm_manuel' est coché, auquel cas la valeur reste
    figée jusqu'à modification manuelle explicite."""
    PROFIL_CHOICES = [
        ('junior', 'Junior'),
        ('chef_de_projet', 'Chef de projet'),
        ('senior', 'Senior'),
    ]
    profil = models.CharField(max_length=20, choices=PROFIL_CHOICES, unique=True)
    tjm = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(0)],
        help_text="Taux journalier moyen, en TND",
    )
    tjm_manuel = models.BooleanField(
        default=False,
        help_text="Cochez pour figer le TJM et ne plus le recalculer automatiquement à partir des salaires.",
    )


    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return f"{self.get_profil_display()} — {self.tjm} TND/jour"
