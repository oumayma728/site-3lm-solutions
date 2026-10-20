"""Calcul des prix des devis — le SEUL endroit où un montant est calculé.

Toutes les valeurs de barème (TJM, multiplicateurs, marges) viennent de la base
(TarifProfil, MultiplicateurComplexite, ParametresTarification) et se règlent
dans l'admin Django : aucune constante métier n'est codée ici, sauf le repli
DEFAULT_TJM pour une installation où aucun tarif n'existe encore.
"""
import logging
from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal

from ..models import (
    COMPLEXITE_CHOICES, PROFIL_CHOICES, MultiplicateurComplexite, ParametresTarification, TarifProfil,
)

logger = logging.getLogger(__name__)

PROFILS = {valeur for valeur, _ in PROFIL_CHOICES}
COMPLEXITES = {valeur for valeur, _ in COMPLEXITE_CHOICES}

# Repli utilisé UNIQUEMENT quand un profil n'a encore aucun TarifProfil en base
# (première installation, avant le premier employé). Un avertissement est
# journalisé à chaque utilisation : en production, il ne doit jamais servir.
DEFAULT_TJM = {
    'junior': Decimal('200'),
    'senior': Decimal('300'),
    'chef_de_projet': Decimal('400'),
}


class TarificationError(ValueError):
    """Donnée de chiffrage invalide (profil ou complexité inconnus, jours ≤ 0…).
    Le message est en français : il est affiché tel quel à l'utilisateur."""


@dataclass(frozen=True)
class PrixLigne:
    """Détail d'un calcul de ligne. Figé : c'est l'instantané enregistré sur la
    ligne (LigneDevis.tjm / multiplicateur / jours_personne / prix)."""
    tjm: Decimal
    multiplicateur: Decimal
    jours_personne: Decimal
    prix: Decimal


def arrondir_dizaine(montant) -> Decimal:
    """Arrondi à la dizaine de DT la plus proche, moitié vers le haut
    (1005 -> 1010, 1015 -> 1020) — la même règle partout."""
    return (Decimal(montant) / 10).quantize(Decimal('1'), rounding=ROUND_HALF_UP) * 10


def tjm_du_profil(profil: str) -> Decimal:
    if profil not in PROFILS:
        raise TarificationError(f"Profil inconnu : « {profil} ».")
    tarif = TarifProfil.objects.filter(profil=profil).first()
    if tarif is not None:
        return tarif.tjm
    logger.warning(
        "Aucun TarifProfil pour le profil '%s' : TJM de repli %s TND utilisé. "
        "Ajoutez un employé de ce profil ou créez le tarif dans l'admin.", profil, DEFAULT_TJM[profil],
    )
    return DEFAULT_TJM[profil]


def multiplicateur_de(complexite: str) -> Decimal:
    if complexite not in COMPLEXITES:
        raise TarificationError(f"Complexité inconnue : « {complexite} ».")
    ligne = MultiplicateurComplexite.objects.filter(complexite=complexite).first()
    if ligne is None:
        raise TarificationError(
            f"Aucun multiplicateur défini pour la complexité « {complexite} » (admin › Multiplicateurs de complexité)."
        )
    return ligne.multiplicateur


def calculer_prix_ligne(profil: str, jours_par_personne, nombre_personnes: int, complexite: str) -> PrixLigne:
    """Prix d'une ligne = jours_par_personne × nombre_personnes × TJM(profil) × multiplicateur(complexité),
    arrondi à la dizaine de DT. Lève TarificationError sur une donnée invalide
    plutôt que de deviner (un profil inconnu n'est jamais tarifé « junior »)."""
    try:
        jours = Decimal(str(jours_par_personne))
        personnes = int(nombre_personnes)
    except (ArithmeticError, TypeError, ValueError):
        raise TarificationError("Jours et nombre de personnes doivent être des nombres.")
    if jours <= 0:
        raise TarificationError("Le nombre de jours par personne doit être supérieur à 0.")
    if personnes < 1:
        raise TarificationError("Il faut au moins une personne sur chaque ligne.")

    tjm = tjm_du_profil(profil)
    multiplicateur = multiplicateur_de(complexite)
    jours_personne = jours * personnes
    prix = arrondir_dizaine(jours_personne * tjm * multiplicateur)
    return PrixLigne(tjm=tjm, multiplicateur=multiplicateur, jours_personne=jours_personne, prix=prix)


def appliquer_marge_cout_reel(cout_reel):
    """Mode 'cout_reel' : l'admin saisit ce qu'il a réellement payé, et le prix
    de vente garde une marge de taux_marge SUR LE PRIX :

        prix = coût / (1 − taux_marge)      ex. 7 000 / (1 − 0,30) = 10 000

    (et non coût × 1,30 = 9 100 : avec un coefficient, la marge réelle ne
    serait que de 23 %). Même arrondi à la dizaine que les lignes."""
    if cout_reel is None:
        return None
    cout = Decimal(str(cout_reel))
    if cout < 0:
        raise TarificationError("Le coût réel ne peut pas être négatif.")
    taux_marge = ParametresTarification.actuels().taux_marge
    if not (Decimal('0') <= taux_marge < Decimal('1')):
        raise TarificationError("Le taux de marge doit être compris entre 0 et 1 (exclu) : vérifiez les paramètres de tarification.")
    return arrondir_dizaine(cout / (1 - taux_marge))


# --- Recalcul du TJM à partir des salaires réels de l'équipe ---

def calculer_tjm(salaire_brut_mensuel, parametres: ParametresTarification, nb_profils_facturables: int) -> Decimal:
    """TJM d'une personne :
        (salaire_brut × (1 + taux_charges) × 12 + frais_generaux_annuels / nb_profils_facturables)
        / jours_facturables_an × (1 + marge)
    arrondi au DT (moitié vers le haut)."""
    cout_annuel = Decimal(salaire_brut_mensuel) * (1 + parametres.taux_charges) * 12
    if nb_profils_facturables > 0:
        cout_annuel += parametres.frais_generaux_annuels / nb_profils_facturables
    tjm = cout_annuel / parametres.jours_facturables_an * (1 + parametres.marge)
    return tjm.quantize(Decimal('1'), rounding=ROUND_HALF_UP)


def recalculer_tarifs_profils():
    """Recalcule le TJM de chaque profil (moyenne des TJM des employés ACTIFS
    de ce profil ayant un salaire). Le résultat est toujours enregistré comme
    tjm_plancher ; tjm n'est écrasé que si tjm_manuel est décoché, pour ne
    jamais effacer un ajustement volontaire. Appelée par un signal à chaque
    changement dans l'app 'equipe'."""
    from equipe.models import Employe  # import local — évite une dépendance circulaire au démarrage des apps

    parametres = ParametresTarification.actuels()
    facturables = Employe.objects.filter(actif=True, salaire__isnull=False)
    nb_profils_facturables = facturables.count()

    for profil_value, _ in Employe.PROFIL_CHOICES:
        salaires = [e.salaire for e in facturables if e.profil == profil_value]
        if not salaires:
            continue  # personne (avec salaire renseigné) dans ce profil — on garde le TJM existant

        tjms = [calculer_tjm(s, parametres, nb_profils_facturables) for s in salaires]
        moyenne = (sum(tjms) / len(tjms)).quantize(Decimal('1'), rounding=ROUND_HALF_UP)

        tarif, _ = TarifProfil.objects.get_or_create(profil=profil_value, defaults={'tjm': moyenne})
        tarif.tjm_plancher = moyenne
        if not tarif.tjm_manuel:
            tarif.tjm = moyenne
        tarif.save()
