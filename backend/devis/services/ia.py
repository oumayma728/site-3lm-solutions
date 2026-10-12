import json
import os
import random
import re

import anthropic

BUDGET_PATTERN = re.compile(
    r"budget[^\d]{0,15}(\d[\d\s]{1,7})\s*(€|eur|euros?|\$|usd|dollars?|dt|tnd|dinars?)?",
    re.IGNORECASE,
)


def _extraire_budget(besoins_client: str):
    """Cherche un montant (et sa devise) mentionné après le mot 'budget' dans
    le texte du manager. Retourne (montant, devise) ou (None, None). devise
    est 'EUR', 'USD' ou 'TND' (par défaut si rien n'est précisé après le
    nombre). Informationnel uniquement — n'influence plus le calcul du prix,
    utilisé pour afficher une comparaison au manager, pas pour ajuster l'IA."""
    match = BUDGET_PATTERN.search(besoins_client)
    if not match:
        return None, None
    montant_str = match.group(1).replace(" ", "")
    devise_brute = (match.group(2) or '').lower()
    if '€' in devise_brute or 'eur' in devise_brute:
        devise = 'EUR'
    elif '$' in devise_brute or 'usd' in devise_brute or 'dollar' in devise_brute:
        devise = 'USD'
    else:
        devise = 'TND'
    try:
        return float(montant_str), devise
    except ValueError:
        return None, None


def _generer_mock(besoins_client: str, client_nom: str = "") -> dict:
    """Simule une réponse IA réaliste. Renvoie des ESTIMATIONS (profil, jours,
    personnes, complexité) — JAMAIS de prix. Le prix est calculé séparément,
    ailleurs (services.pricing.calculer_prix_ligne, appelé depuis views.py) —
    ce fichier ne doit rien importer de 'pricing', ni ici ni dans le mode réel."""
    descriptions = [
        "Analyse des besoins et cadrage du projet",
        "Développement / mise en œuvre",
        "Tests, configuration et déploiement",
    ]
    profils = ['junior', 'senior', 'chef_de_projet']
    complexites = ['simple', 'complexe', 'moyenne']

    lignes = []
    for description, profil, complexite in zip(descriptions, profils, complexites):
        lignes.append({
            "description": description,
            "profil_requis": profil,
            "nombre_personnes": 1,
            "jours_estimes": round(random.uniform(1.0, 10.0), 1),
            "complexite": complexite,
        })

    budget_montant, budget_devise = _extraire_budget(besoins_client)

    return {
        "synthese": (
            f"Le client {client_nom or 'concerné'} souhaite une prestation détaillée "
            f"selon les besoins exprimés : {besoins_client[:150]}... "
            "Cette synthèse est générée en mode simulation (pas d'appel à l'IA réelle)."
        ),
        "lignes": lignes,
        "budget_detecte": budget_montant,
        "budget_devise": budget_devise,
    }


def _resume_equipe() -> str:
    """Résume la composition actuelle de l'équipe (par profil, sans salaires)
    pour aider l'IA à proposer un nombre_personnes et un profil_requis réalistes
    — jamais utilisé pour le prix, uniquement pour ancrer l'estimation dans les
    ressources réellement disponibles."""
    from equipe.models import Employe

    employes = Employe.objects.filter(actif=True)
    if not employes.exists():
        return "Aucune information sur l'équipe n'est disponible pour le moment."

    par_profil: dict[str, list[str]] = {}
    for e in employes:
        par_profil.setdefault(e.profil, []).append(e.poste)

    labels = {'junior': 'Junior', 'senior': 'Senior', 'chef_de_projet': 'Chef de projet'}
    lignes = []
    for profil, postes in par_profil.items():
        nom_profil = labels.get(profil, profil)
        postes_uniques = ', '.join(sorted(set(postes)))
        lignes.append(f"- {nom_profil} : {len(postes)} personne(s) — postes occupés : {postes_uniques}")
    return "\n".join(lignes)


def generer_devis_ia(besoins_client: str, client_nom: str = "") -> dict:
    """Retourne une synthèse + des ESTIMATIONS par ligne (profil requis, jours-
    personne, nombre de personnes, complexité). Ne calcule AUCUN prix — c'est le
    rôle de services.pricing.calculer_prix_ligne, appelé séparément depuis
    views.py pour chaque ligne, une fois les estimations obtenues ici."""
    use_mock = os.getenv("USE_MOCK_IA", "false").lower() == "true"

    if use_mock:
        return _generer_mock(besoins_client, client_nom)

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError(
            "Clé Anthropic non configurée. Définissez ANTHROPIC_API_KEY dans backend/.env"
        )

    client = anthropic.Anthropic(api_key=api_key)

    equipe_resume = _resume_equipe()

    prompt = f"""Tu es un assistant expert en cadrage de projets pour une entreprise de développement web/logiciel basée en Tunisie.
Analyse les besoins du client et produis une ESTIMATION structurée en JSON STRICT (aucun texte avant/après, pas de balises markdown).

Client : {client_nom or "Non précisé"}
Besoins exprimés :
{besoins_client}

Composition actuelle de notre équipe (pour ancrer tes estimations dans nos ressources réelles) :
{equipe_resume}

Format JSON attendu exactement :
{{
  "synthese": "Résumé clair et professionnel du projet (3-5 phrases)",
  "lignes": [
    {{
      "description": "Nom de la tâche ou du lot de travail",
      "profil_requis": "junior",
      "nombre_personnes": 1,
      "jours_estimes": 5.5,
      "complexite": "moyenne"
    }}
  ]
}}

Règles :
- N'indique JAMAIS de prix ou de montant — uniquement des estimations de temps, de profil et de complexité. Le prix est calculé séparément, automatiquement, à partir de ces informations.
- "profil_requis" doit être EXACTEMENT l'une de ces valeurs : "junior", "senior", "chef_de_projet" — choisis selon la difficulté technique et le niveau de responsabilité de la tâche, pas selon sa durée.
- "nombre_personnes" est le nombre de personnes nécessaires EN PARALLÈLE sur cette tâche (1 dans la grande majorité des cas ; plus seulement si la tâche se parallélise vraiment).
- "jours_estimes" est le nombre de jours-personne nécessaires pour CHAQUE personne assignée (pas le total cumulé de l'équipe).
- "complexite" doit être EXACTEMENT l'une de ces valeurs : "simple", "moyenne", "complexe" — reflète la difficulté technique indépendamment du temps (une tâche longue peut être simple, une tâche courte peut être complexe).
- Au minimum 2 lignes, maximum 5 — au-delà, le devis devient illisible pour un client et donne une impression de sur-découpage artificiel.
- Chaque ligne doit représenter un LIVRABLE ou un LOT DE TRAVAIL cohérent, tel qu'un client le comprendrait — jamais une tâche interne granulaire. Exemple : pour une formation de 3 jours, ne crée PAS une ligne par jour ("Jour 1", "Jour 2", "Jour 3") — regroupe l'animation en UNE seule ligne "Animation de la formation (3 jours)". Ne sépare pas non plus la coordination logistique, la préparation administrative ou les tâches de gestion interne en lignes distinctes — intègre-les dans le lot de travail auquel elles se rattachent.
- "nombre_personnes" et "profil_requis" doivent rester réalistes par rapport à la composition d'équipe indiquée ci-dessus — ne propose pas plus de personnes en parallèle sur un profil donné que ce que l'équipe compte réellement à ce niveau.
- Rédige en français professionnel."""

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}],
    )

    texte = response.content[0].text.strip()

    if texte.startswith("```"):
        texte = texte.strip("`")
        if texte.startswith("json"):
            texte = texte[4:]
        texte = texte.strip()

    result = json.loads(texte)
    budget_montant, budget_devise = _extraire_budget(besoins_client)
    result['budget_detecte'] = budget_montant
    result['budget_devise'] = budget_devise
    return result