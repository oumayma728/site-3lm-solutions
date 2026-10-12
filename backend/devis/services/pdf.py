from decimal import Decimal
from pathlib import Path

from django.template.loader import render_to_string
from django.conf import settings
from weasyprint import HTML

from .currency import convertir, SYMBOLES

# TVA tunisienne (19%) : ne s'applique qu'aux devis facturés en TND — une
# facture en EUR/USD est une facture d'export, hors champ de la TVA tunisienne,
# donc 0% dans ce cas. C'est un calcul d'AFFICHAGE uniquement (comme la
# conversion de devise) : estimation_montant reste le montant HT stocké, la
# TVA est ajoutée par-dessus seulement au moment de générer le PDF.
TAUX_TVA = Decimal('0.19')

LOGO_PATH = Path(settings.BASE_DIR) / 'devis' / 'static' / 'devis' / 'logo_3lm.png'
SIGNATURE_PATH = Path(settings.BASE_DIR) / 'devis' / 'static' / 'devis' / 'signature.jpeg'
CACHET_PATH = Path(settings.BASE_DIR) / 'devis' / 'static' / 'devis' / 'cachet.jpeg'

COMPANY_INFO = {
    'nom': '3LM Solutions',
    'adresse': 'Ariana',
    'email': '3lmsolutions@gmail.com',
    'telephone': '',
}

STATUT_STYLE = {
    'brouillon': {'label': 'Brouillon', 'couleur': '#64748B', 'fond': '#F1F5F9'},
    'en_attente': {'label': 'En attente de validation', 'couleur': '#D97706', 'fond': '#FEF3C7'},
    'valide': {'label': 'Validé', 'couleur': '#059669', 'fond': '#D1FAE5'},
    'envoye': {'label': 'Envoyé au client', 'couleur': '#2563EB', 'fond': '#DBEAFE'},
    'refuse': {'label': 'Refusé', 'couleur': '#DC2626', 'fond': '#FEE2E2'},
}


def generer_pdf_devis(devis) -> bytes:
    style = STATUT_STYLE.get(devis.statut, STATUT_STYLE['brouillon'])

    # Les montants stockés (ligne.prix_unitaire, ligne.total, devis.estimation_montant)
    # sont TOUJOURS en TND — devis.devise ne sert qu'à l'affichage (voir le
    # commentaire sur Devis.devise dans models.py). Le PDF doit donc convertir
    # ces montants lui-même avant de les injecter dans le template, exactement
    # comme le fait l'aperçu web (lib/devis.ts formatMontant côté front) — sinon
    # le PDF téléchargé afficherait toujours du TND même si l'admin a choisi
    # EUR/USD dans l'aperçu.
    devise = devis.devise
    symbole = SYMBOLES.get(devise, 'DT')

    # On pré-calcule une liste de lignes "prêtes à afficher" (montants déjà
    # convertis) plutôt que de faire la conversion dans le template Django,
    # qui n'a pas accès à des fonctions Python arbitraires comme convertir().
    lignes_affichage = [
        {
            'description': ligne.description,
            'prestation': ligne.prestation,
            'quantite': ligne.quantite,
            'prix_unitaire': convertir(ligne.prix_unitaire, devise),
            'total': convertir(ligne.total, devise),
        }
        for ligne in devis.lignes.all()
    ]
    estimation_affichage = convertir(devis.estimation_montant, devise) if devis.estimation_montant is not None else None

    # TVA 19% uniquement en TND (voir commentaire sur TAUX_TVA ci-dessus) —
    # calculée sur le montant déjà converti (estimation_affichage), pas sur
    # le montant TND brut, pour que sous-total + tva = total affiché à l'écran.
    tva_taux = TAUX_TVA if devise == 'TND' else Decimal('0.00')
    tva_montant = None
    total_ttc = estimation_affichage
    if estimation_affichage is not None:
        tva_montant = (estimation_affichage * tva_taux).quantize(Decimal('0.01'))
        total_ttc = estimation_affichage + tva_montant

    html = render_to_string('devis/devis_pdf.html', {
        'devis': devis,
        'lignes_affichage': lignes_affichage,
        'estimation_affichage': estimation_affichage,
        'tva_taux_pourcent': int(tva_taux * 100),  # ex: 19, pas 0.19 — pour l'affichage "TVA (19%)"
        'tva_montant': tva_montant,
        'total_ttc': total_ttc,
        'devise_symbole': symbole,
        'logo_path': LOGO_PATH.as_uri(),
        'signature_path': SIGNATURE_PATH.as_uri(),
        'cachet_path': CACHET_PATH.as_uri(),
        'company': COMPANY_INFO,
        'statut_label': style['label'],
        'statut_couleur': style['couleur'],
        'statut_fond': style['fond'],
    })

    return HTML(string=html, base_url=str(settings.BASE_DIR)).write_pdf()
