import re
from decimal import Decimal, ROUND_HALF_UP

# Taux de conversion FIXES et approximatifs, à partir du TND (devise de calcul
# de tous les montants stockés — voir Devis.devise). Ce ne sont PAS des taux de
# marché en temps réel : ce projet n'appelle aucune API de change. À ajuster
# ici manuellement si les taux réels dérivent trop.
TAUX_DEPUIS_TND = {
    'TND': Decimal('1'),
    'EUR': Decimal('0.30'),
    'USD': Decimal('0.32'),
}

SYMBOLES = {'TND': 'DT', 'EUR': '€', 'USD': '$'}

# Ordre important : on cherche EUR/USD avant TND pour qu'un texte mentionnant
# "1500 dollars, budget serré en dinars" retienne la devise la plus probable
# (la première monnaie explicitement citée), pas le mot "dinars" générique
# ajouté par un template.
_PATTERNS = [
    ('EUR', re.compile(r'€|\beuros?\b|\bEUR\b', re.IGNORECASE)),
    ('USD', re.compile(r'\$|\bdollars?\b|\bUSD\b', re.IGNORECASE)),
    ('TND', re.compile(r'\bdinars?\b|\bTND\b|\bDT\b', re.IGNORECASE)),
]


def detecter_devise(texte: str) -> str:
    """Devine la devise mentionnée dans un texte libre (besoins du client).
    Renvoie 'TND' par défaut si aucune devise n'est explicitement mentionnée."""
    for devise, pattern in _PATTERNS:
        if pattern.search(texte or ''):
            return devise
    return 'TND'


def convertir(montant, devise_cible: str) -> Decimal:
    """Convertit un montant exprimé en TND vers la devise cible, à partir des
    taux fixes ci-dessus. Retourne le montant tel quel (arrondi) si la devise
    cible est inconnue ou déjà TND."""
    if montant is None:
        return Decimal('0')
    taux = TAUX_DEPUIS_TND.get(devise_cible, Decimal('1'))
    return (Decimal(str(montant)) * taux).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
