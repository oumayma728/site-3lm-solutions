from decimal import Decimal

from ..models import TarifProfil, ParametresTarification

COMPLEXITE_MULTIPLIER = {
    'simple': Decimal('1.0'),
    'moyenne': Decimal('1.15'),
    'complexe': Decimal('1.35'),
}

# Repli si un profil n'a pas (encore) de tarif défini dans TarifProfil —
# évite un crash pendant la mise en place initiale, à ajuster via /admin/.
DEFAULT_TJM = {
    'junior': Decimal('200'), 
    'senior': Decimal('300'),
    'chef_de_projet': Decimal('400'),
}


def calculer_prix_ligne(profil: str, jours_estimes, nombre_personnes: int, complexite: str) -> Decimal:
    """La SEULE fonction qui calcule un prix de ligne de devis — qu'elle vienne
    d'une estimation IA ou d'une saisie manuelle par l'admin. Toute modification
    du barème (TJM, multiplicateurs) se fait ici, une seule fois, plutôt que
    dupliquée entre plusieurs endroits du code."""
    try:
        tjm = TarifProfil.objects.get(profil=profil).tjm
    except TarifProfil.DoesNotExist:
        tjm = DEFAULT_TJM.get(profil, DEFAULT_TJM['junior'])  # fallback si profil inconnu

    jours_personne = Decimal(str(jours_estimes)) * nombre_personnes
    multiplicateur = COMPLEXITE_MULTIPLIER.get(complexite, Decimal('1.0'))
    prix = jours_personne * tjm * multiplicateur

    # Arrondi à la dizaine de TND la plus proche, pour un prix "propre" sur le devis.
    return (prix / 10).quantize(Decimal('1')) * 10


# Repli si aucun ParametresTarification n'existe encore en base (première
# utilisation du mode 'cout_reel' avant que l'admin n'ait rien configuré).
MARGE_COUT_REEL_DEFAUT = Decimal('0.30')


def appliquer_marge_cout_reel(cout_reel) -> Decimal:
    """Mode de tarification 'cout_reel' (voir Devis.mode_tarification) :
    contrairement à calculer_prix_ligne (mode IA, basé sur un TJM par profil),
    ici il n'y a AUCUN calcul de prix par ligne — l'admin saisit directement
    le montant total qu'il a réellement payé (salaires, charges patronales,
    déploiement, impôts...), et cette fonction ajoute juste la marge
    bénéficiaire configurée par-dessus pour obtenir le prix final facturé."""
    if cout_reel is None:
        return None

    # .first() car un seul enregistrement de paramètres est censé exister —
    # si aucun n'a encore été créé (première utilisation), on retombe sur 30%.
    parametres = ParametresTarification.objects.first()
    marge = parametres.marge_beneficiaire if parametres else MARGE_COUT_REEL_DEFAUT

    prix_final = Decimal(str(cout_reel)) * (1 + marge)
    return prix_final.quantize(Decimal('0.01'))


# --- Recalcul du TJM à partir des salaires réels de l'équipe ---

JOURS_OUVRES_PAR_MOIS = 21
MARGE_DEFAUT = Decimal('0.6')  # 60% par défaut — à ajuster une fois le chiffre réel décidé avec votre boss


def recalculer_tarifs_profils():
    """Recalcule le TJM de chaque profil à partir de la moyenne des salaires
    des employés ACTIFS de ce niveau. Ignore les profils marqués 'tjm_manuel'
    (override manuel), pour ne jamais écraser un ajustement volontaire.
    Appelée automatiquement par un signal à chaque changement dans 'equipe'."""
    from equipe.models import Employe  # import local — évite une dépendance circulaire au démarrage des apps

    for profil_value, _ in Employe.PROFIL_CHOICES:
        tarif, _ = TarifProfil.objects.get_or_create(
            profil=profil_value,
            defaults={'tjm': DEFAULT_TJM.get(profil_value, DEFAULT_TJM['junior'])},
        )
        if tarif.tjm_manuel:
            continue  # override manuel — on ne touche pas à cette valeur

        employes = Employe.objects.filter(profil=profil_value, actif=True, salaire__isnull=False)
        salaires = [e.salaire for e in employes]
        if not salaires:
            continue  # personne (avec salaire renseigné) dans ce profil — on garde le TJM existant

        tjms = [(s / JOURS_OUVRES_PAR_MOIS) * (1 + MARGE_DEFAUT) for s in salaires]
        moyenne = sum(tjms) / len(tjms)
        tarif.tjm = moyenne.quantize(Decimal('1'))
        tarif.save()