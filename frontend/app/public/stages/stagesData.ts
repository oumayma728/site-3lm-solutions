export type Programme = 'ete' | 'pfe';

export type Offre = {
  slug: string;
  titre: string;
  programme: Programme;
  domaine: string;
  color: string;
  description: string;
  longDescription: string;
  missions: string[];
  prerequis: string[];
  avantages: string[];
  stack: string[];
};

export const programmes: Record<Programme, { label: string; periode: string; duree: string; texte: string }> = {
  ete: {
    label: 'Stage d’été',
    periode: 'Juin — Août 2026',
    duree: '~2 mois',
    texte:
      "Une immersion courte et concrète pendant les vacances universitaires. Vous rejoignez une équipe sur un besoin réel et livrez quelque chose de concret avant la rentrée.",
  },
  pfe: {
    label: 'Stage de fin d’études (PFE)',
    periode: 'Février — Juillet 2026',
    duree: '5 à 6 mois',
    texte:
      "Un projet complet, de la conception à la mise en production, avec un mentor dédié tout au long du parcours — et une possibilité réelle d’embauche à la clé.",
  },
};

export const parcours = [
  { num: '01', titre: 'Candidature', texte: 'Envoyez votre CV accompagné de quelques lignes présentant votre parcours, vos compétences et vos motivations.' },
  { num: '02', titre: 'Entretien', texte: 'Un échange direct avec l’équipe technique, sur votre parcours et vos envies.' },
  { num: '03', titre: 'Intégration', texte: 'Un mentor dédié, un environnement de travail réel dès le premier jour.' },
  { num: '04', titre: 'Projet concret', texte: 'Vous contribuez à un vrai produit utilisé par de vrais clients — pas un exercice.' },
];

export const offres: Offre[] = [
  {
    slug: 'ia-assistant-devis',
    titre: 'Amélioration de l’assistant IA de génération de devis',
    programme: 'pfe',
    domaine: 'Intelligence Artificielle',
    color: '#8b5cf6',
    description: 'Travaillez sur notre propre outil interne : affiner la génération de devis assistée par IA et explorer de nouveaux cas d’usage d’agents.',
    longDescription:
      "Ce stage porte sur notre propre produit interne — l'assistant de devis piloté par IA que vous utilisez pour voir ce site fonctionner. Vous partirez de l'existant (génération de synthèse, chiffrage automatique) pour l'améliorer : meilleure précision des estimations, gestion de cas plus complexes, et exploration de nouveaux agents capables d'automatiser d'autres étapes du parcours commercial.",
    missions: [
      'Analyser les limites actuelles du moteur de génération de devis',
      'Améliorer la précision des estimations et la pertinence des synthèses',
      'Concevoir un ou plusieurs agents pour automatiser une nouvelle étape métier',
      'Mettre en place des tests pour mesurer objectivement les progrès',
    ],
    prerequis: [
      'Bases solides en Python',
      'Curiosité pour les LLM et les architectures d’agents',
      'À l’aise avec la lecture de code existant, pas seulement l’écriture',
    ],
    avantages: [
      'Accès direct à un produit réel en production, pas une maquette',
      'Mentorat par l’équipe qui a conçu l’outil',
      'Vos contributions seront réellement déployées',
    ],
    stack: ['Python', 'LLM APIs', 'Django'],
  },
  {
    slug: 'data-dashboard-commercial',
    titre: 'Tableau de bord de pilotage commercial',
    programme: 'ete',
    domaine: 'Analyse des données',
    color: '#22d3ee',
    description: 'Concevez un dashboard qui centralise les indicateurs commerciaux clés pour l’équipe — de la donnée brute à la visualisation.',
    longDescription:
      "L'équipe commerciale jongle aujourd'hui entre plusieurs sources pour suivre son activité. Votre mission : construire un tableau de bord unique qui centralise les indicateurs qui comptent réellement — pipeline, taux de conversion, délais de réponse — pensé pour être lu en quelques secondes, pas déchiffré.",
    missions: [
      'Identifier avec l’équipe commerciale les indicateurs vraiment utiles',
      'Construire les requêtes et le pipeline de données nécessaires',
      'Concevoir des visualisations claires et actionnables',
      'Livrer un dashboard utilisable en autonomie par l’équipe',
    ],
    prerequis: [
      'Bases en SQL et manipulation de données',
      'Sens de la clarté visuelle — savoir simplifier plutôt qu’empiler',
      'Aucune expérience préalable en BI n’est exigée',
    ],
    avantages: [
      'Contact direct avec l’équipe commerciale, pas seulement les données',
      'Un livrable concret utilisé au quotidien dès la fin du stage',
      'Formation aux outils de visualisation si besoin',
    ],
    stack: ['Python', 'SQL', 'Power BI'],
  },
  {
    slug: 'iot-supervision-equipements',
    titre: 'Prototype de supervision d’équipements connectés',
    programme: 'pfe',
    domaine: 'IoT',
    color: '#34d399',
    description: 'Développez un prototype de remontée de données terrain en temps réel, de la collecte capteur jusqu’à l’alerte.',
    longDescription:
      "Un client a besoin de suivre l'état d'équipements répartis sur plusieurs sites, en temps réel, avec des alertes automatiques en cas d'anomalie. Vous concevrez un prototype complet, de la remontée des données capteurs jusqu'au tableau de bord de supervision, en passant par la logique d'alerte.",
    missions: [
      'Définir l’architecture de collecte et transmission des données capteurs',
      'Implémenter la remontée de données en temps réel',
      'Construire la logique de détection d’anomalies et d’alerting',
      'Livrer un tableau de bord de supervision fonctionnel',
    ],
    prerequis: [
      'Notions de réseaux et protocoles de communication (MQTT ou équivalent)',
      'Bases en développement backend (Node.js ou Python)',
      'Intérêt pour le matériel et les systèmes embarqués',
    ],
    avantages: [
      'Un projet qui touche au matériel autant qu’au logiciel',
      'Encadrement par un ingénieur IoT expérimenté',
      'Possibilité de poursuivre le projet au-delà du stage',
    ],
    stack: ['MQTT', 'Node.js', 'Cloud IoT'],
  },
  {
    slug: 'devops-pipeline-cicd',
    titre: 'Pipeline CI/CD pour déploiement automatisé',
    programme: 'ete',
    domaine: 'DevOps & Cloud',
    color: '#fb923c',
    description: 'Mettez en place un pipeline complet de build, test et déploiement automatisé pour l’un de nos projets internes.',
    longDescription:
      "Aujourd'hui, une partie de nos déploiements se fait encore manuellement. Votre mission : automatiser tout le cycle — build, tests, déploiement — pour l'un de nos projets internes, afin de réduire les erreurs humaines et accélérer les mises en production.",
    missions: [
      'Auditer le processus de déploiement actuel et ses points de friction',
      'Concevoir un pipeline CI/CD de bout en bout',
      'Automatiser les tests et les contrôles de qualité avant déploiement',
      'Documenter le processus pour le reste de l’équipe',
    ],
    prerequis: [
      'Bases en Git et en ligne de commande',
      'Notions de conteneurisation (Docker)',
      'Envie de comprendre comment un projet arrive réellement en production',
    ],
    avantages: [
      'Impact direct et mesurable sur la vitesse de livraison de l’équipe',
      'Exposition à des outils utilisés en production, pas en tutoriel',
      'Autonomie rapide sur un périmètre bien défini',
    ],
    stack: ['Docker', 'GitHub Actions', 'Kubernetes'],
  },
  {
    slug: 'web-refonte-module',
    titre: 'Refonte d’un module du site 3LM Solutions',
    programme: 'ete',
    domaine: 'Développement Web',
    color: '#6d6bff',
    description: 'Reprenez un module existant de ce site pour l’améliorer — performance, accessibilité, expérience utilisateur.',
    longDescription:
      "Ce site que vous êtes en train de consulter est un vrai projet en constante évolution. Vous reprendrez l'un de ses modules existants pour l'améliorer concrètement — que ce soit la performance, l'accessibilité ou l'expérience utilisateur — avec vos changements déployés en production.",
    missions: [
      'Auditer le module existant et identifier les points d’amélioration',
      'Proposer et implémenter des améliorations concrètes',
      'Veiller à la performance et à l’accessibilité du résultat',
      'Voir vos changements déployés sur le site réel',
    ],
    prerequis: [
      'Bases en React et JavaScript/TypeScript',
      'Sens du détail sur l’expérience utilisateur',
      'Curiosité pour lire et comprendre du code existant',
    ],
    avantages: [
      'Vos contributions visibles publiquement sur un vrai site',
      'Travail direct avec l’équipe qui maintient la plateforme',
      'Une bonne porte d’entrée vers le développement web professionnel',
    ],
    stack: ['Next.js', 'React', 'TypeScript'],
  },
  {
    slug: 'mobile-suivi-client',
    titre: 'Application mobile de suivi client',
    programme: 'pfe',
    domaine: 'Développement Mobile',
    color: '#f472b6',
    description: 'Concevez de zéro une application mobile permettant à nos clients de suivre l’avancement de leurs projets.',
    longDescription:
      "Nos clients demandent aujourd'hui un moyen simple de suivre l'avancement de leurs projets sans passer par un email ou un appel. Vous concevrez cette application mobile de zéro : de la maquette à une version fonctionnelle connectée à nos systèmes existants.",
    missions: [
      'Cadrer les besoins réels avec l’équipe produit',
      'Concevoir les maquettes et le parcours utilisateur',
      'Développer une application connectée à nos APIs existantes',
      'Tester avec un premier groupe de clients pilotes',
    ],
    prerequis: [
      'Bases en React Native ou développement mobile équivalent',
      'Intérêt pour la conception d’expérience utilisateur',
      'Capacité à travailler à partir d’un besoin flou et à le clarifier',
    ],
    avantages: [
      'Un produit conçu de zéro, du cadrage jusqu’au déploiement',
      'Contact direct avec de vrais clients pilotes',
      'Fort potentiel de poursuite en embauche vu le périmètre du projet',
    ],
    stack: ['React Native', 'Firebase', 'REST'],
  },
  {
    slug: 'erp-module-stocks',
    titre: 'Module de gestion des stocks sur mesure',
    programme: 'pfe',
    domaine: 'Solutions ERP',
    color: '#fbbf24',
    description: 'Développez un module ERP adapté à un besoin métier réel, de la modélisation des données à l’interface utilisateur.',
    longDescription:
      "Un client gère encore ses stocks sur des fichiers Excel dispersés. Vous concevrez un module ERP sur mesure pour centraliser cette gestion — de la modélisation des données métier jusqu'à une interface simple que ses équipes utiliseront au quotidien.",
    missions: [
      'Comprendre en profondeur le processus métier actuel du client',
      'Modéliser les données et l’architecture du module',
      'Développer une interface claire pour les équipes terrain',
      'Accompagner la migration depuis les fichiers existants',
    ],
    prerequis: [
      'Bases en Python et en bases de données relationnelles',
      'Capacité à traduire un besoin métier en solution technique',
      'Rigueur — un module ERP mal pensé coûte cher à corriger',
    ],
    avantages: [
      'Exposition directe à un vrai cas métier client, pas un exercice scolaire',
      'Vision complète d’un projet ERP, du cadrage au déploiement',
      'Encadrement par un consultant ERP expérimenté',
    ],
    stack: ['Odoo', 'PostgreSQL', 'Python'],
  },
  {
    slug: 'community-automatisation',
    titre: 'Stratégie de contenu et automatisation social media',
    programme: 'ete',
    domaine: 'Community Management',
    color: '#f87171',
    description: 'Concevez une ligne éditoriale et un système simple pour planifier et suivre la performance des publications.',
    longDescription:
      "3LM Solutions veut renforcer sa présence sur les réseaux sociaux, mais sans y consacrer un temps disproportionné. Vous concevrez une ligne éditoriale claire et un système simple de planification, puis suivrez les premiers résultats pour ajuster l'approche.",
    missions: [
      'Définir une ligne éditoriale alignée avec l’image de l’entreprise',
      'Créer un calendrier de publication et des visuels associés',
      'Mettre en place un suivi simple de performance',
      'Ajuster la stratégie selon les premiers résultats',
    ],
    prerequis: [
      'Bonne plume et sens de la communication',
      'Notions de design (Canva ou équivalent)',
      'Intérêt pour les dynamiques des réseaux sociaux B2B',
    ],
    avantages: [
      'Liberté créative réelle sur la ligne éditoriale',
      'Résultats visibles rapidement sur les canaux de l’entreprise',
      'Bonne première expérience de gestion de marque en autonomie',
    ],
    stack: ['Meta Business Suite', 'Canva', 'Analytics'],
  },
];

export function getOffreBySlug(slug: string): Offre | undefined {
  return offres.find((o) => o.slug === slug);
}
