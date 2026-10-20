"""Application des prix aux lignes d'un devis — partagé par la génération IA,
la modification manuelle des lignes et le recalcul des prix.

Règles :
- Mode 'estimation_ia' : une ligne qui porte une estimation complète (profil,
  jours par personne, personnes, complexité) est TOUJOURS chiffrée par
  services.pricing, et l'instantané du calcul est enregistré sur la ligne. Une
  ligne libre (sans estimation) garde le prix saisi, sans instantané.
- Mode 'cout_reel' : les lignes décrivent le périmètre, sans prix ; le montant
  vient du coût réel + marge.
- estimation_montant est toujours DÉDUIT (somme des lignes, ou coût + marge),
  jamais saisi : le total affiché ne peut pas contredire les lignes.
"""
from decimal import Decimal

from ..models import LigneDevis, MultiplicateurComplexite, TarifProfil
from .pricing import appliquer_marge_cout_reel, calculer_prix_ligne

INSTANTANE_VIDE = {'tjm': None, 'multiplicateur': None, 'jours_personne': None, 'prix': None}


def a_une_estimation(ligne: dict) -> bool:
    return all(ligne.get(champ) not in (None, '') for champ in ('profil', 'jours_par_personne', 'nombre_personnes', 'complexite'))


def chiffrer(ligne: dict, mode_tarification: str) -> dict:
    """Complète les champs de prix d'une ligne (dict de champs LigneDevis).
    Lève TarificationError si l'estimation est invalide."""
    ligne = dict(ligne)
    if mode_tarification == 'cout_reel':
        ligne.update(INSTANTANE_VIDE, prix_unitaire=Decimal('0'))
        if a_une_estimation(ligne):
            ligne['jours_personne'] = Decimal(str(ligne['jours_par_personne'])) * int(ligne['nombre_personnes'])
        return ligne

    if a_une_estimation(ligne):
        calcul = calculer_prix_ligne(ligne['profil'], ligne['jours_par_personne'], ligne['nombre_personnes'], ligne['complexite'])
        ligne.update(
            prix_unitaire=calcul.prix, tjm=calcul.tjm, multiplicateur=calcul.multiplicateur,
            jours_personne=calcul.jours_personne, prix=calcul.prix,
        )
    else:
        ligne.update(INSTANTANE_VIDE)
    return ligne


def remplacer_lignes(devis, lignes: list[dict]) -> None:
    """Remplace toutes les lignes (déjà chiffrées par chiffrer()). À appeler
    dans une transaction, APRÈS avoir chiffré toutes les lignes : une erreur de
    chiffrage ne doit jamais laisser un devis sans lignes."""
    devis.lignes.all().delete()
    LigneDevis.objects.bulk_create([LigneDevis(devis=devis, **ligne) for ligne in lignes])


def recalculer_estimation(devis) -> None:
    """estimation_montant = somme des lignes (mode IA) ou coût réel + marge."""
    if devis.mode_tarification == 'cout_reel':
        devis.estimation_montant = appliquer_marge_cout_reel(devis.cout_reel)
    else:
        devis.estimation_montant = sum((l.total for l in devis.lignes.all()), Decimal('0'))


def tarifs_modifies(devis) -> list[dict]:
    """Lignes d'un BROUILLON dont le TJM ou le multiplicateur a changé depuis
    leur chiffrage. Un devis validé est figé : il n'est jamais signalé."""
    if devis.est_fige or devis.mode_tarification == 'cout_reel':
        return []
    tjms = dict(TarifProfil.objects.values_list('profil', 'tjm'))
    multiplicateurs = dict(MultiplicateurComplexite.objects.values_list('complexite', 'multiplicateur'))
    ecarts = []
    for ligne in devis.lignes.all():
        if ligne.tjm is None:
            continue   # ligne libre ou antérieure à l'instantané
        tjm_actuel = tjms.get(ligne.profil)
        mult_actuel = multiplicateurs.get(ligne.complexite)
        if (tjm_actuel is not None and tjm_actuel != ligne.tjm) or (mult_actuel is not None and mult_actuel != ligne.multiplicateur):
            ecarts.append({
                'ligne': ligne.id, 'description': ligne.description,
                'tjm_au_chiffrage': ligne.tjm, 'tjm_actuel': tjm_actuel,
                'multiplicateur_au_chiffrage': ligne.multiplicateur, 'multiplicateur_actuel': mult_actuel,
            })
    return ecarts


def donnees_ligne(ligne: LigneDevis) -> dict:
    """Champs d'estimation d'une ligne existante (pour la rechiffrer)."""
    return {
        'description': ligne.description, 'prestation': ligne.prestation, 'quantite': ligne.quantite,
        'prix_unitaire': ligne.prix_unitaire, 'profil': ligne.profil, 'jours_par_personne': ligne.jours_par_personne,
        'nombre_personnes': ligne.nombre_personnes, 'complexite': ligne.complexite,
    }
