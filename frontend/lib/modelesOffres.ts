// Modèles de pré-remplissage du formulaire d'offre (admin › Offres).
//
// La plupart des offres sont génériques : on ne choisit que le type (stage d'été,
// stage PFE, emploi) et le département, le reste est une base formelle à relire.
// Tout reste modifiable dans le formulaire. Pour ajuster un texte, modifiez-le ici.

export type TypeOffre = 'emploi' | 'stage';
export type ProgrammeStage = 'ete' | 'pfe';

export const DEPARTEMENTS = ['Intelligence Artificielle', 'Développement Web', 'Développement Mobile'] as const;
export type Departement = (typeof DEPARTEMENTS)[number];

// Champs du formulaire, sous forme de texte (listes : un élément par ligne).
export interface ChampsOffre {
  titre: string;
  departement: string;
  location: string;
  contractType: string;
  experience: string;
  description: string;
  aboutRole: string;
  responsibilities: string;
  qualifications: string;
  benefits: string;
  skills: string;
}

const LOCALISATION = 'Ariana, Tunisie';

// --- Partie propre au département -----------------------------------------

interface ModeleDepartement {
  intitule: { stage: string; emploi: string };
  description: string;
  missions: string[];
  prerequis: string[];
  competences: string[];
}

const PAR_DEPARTEMENT: Record<Departement, ModeleDepartement> = {
  'Intelligence Artificielle': {
    intitule: { stage: 'Intelligence Artificielle', emploi: 'Ingénieur(e) en Intelligence Artificielle' },
    description:
      "Participez à la conception d’agents IA et d’assistants métiers : intégration de modèles de langage, exploitation de données internes et automatisation de processus.",
    missions: [
      'Analyser un besoin métier et proposer une approche IA adaptée',
      'Intégrer des modèles de langage (LLM) dans des outils existants via leurs API',
      'Concevoir des agents capables d’exploiter des données internes',
      'Évaluer la qualité des réponses et mesurer les améliorations apportées',
    ],
    prerequis: [
      'Bonnes bases en Python',
      'Intérêt pour les modèles de langage et le traitement automatique du langage',
    ],
    competences: ['Python', 'LLM APIs', 'Prompt engineering', 'SQL', 'Git'],
  },
  'Développement Web': {
    intitule: { stage: 'Développement Web', emploi: 'Développeur(se) Web Full-Stack' },
    description:
      "Participez au développement de sites et d’applications web : interfaces, API et mise en production, au sein de projets concrets.",
    missions: [
      'Développer des interfaces web responsives et accessibles',
      'Concevoir et consommer des API REST',
      'Participer aux tests et aux revues de code',
      'Contribuer à la mise en production et au suivi des applications',
    ],
    prerequis: [
      'Bases solides en JavaScript / TypeScript, HTML et CSS',
      'Notions de développement back-end (Python ou Node.js)',
    ],
    competences: ['React', 'Next.js', 'TypeScript', 'Django', 'PostgreSQL', 'Git'],
  },
  'Développement Mobile': {
    intitule: { stage: 'Développement Mobile', emploi: 'Développeur(se) Mobile' },
    description:
      "Participez à la conception et au développement d’applications mobiles connectées aux systèmes de nos clients.",
    missions: [
      'Développer les écrans et les parcours d’une application mobile',
      'Connecter l’application aux API et services existants',
      'Gérer les notifications, le stockage local et le mode hors ligne',
      'Tester l’application sur différents appareils et préparer sa publication',
    ],
    prerequis: [
      'Bases en JavaScript / TypeScript ou en Dart',
      'Intérêt pour l’expérience utilisateur sur mobile',
    ],
    competences: ['React Native', 'TypeScript', 'API REST', 'Firebase', 'Git'],
  },
};

// --- Partie formelle, propre au type d'offre ---------------------------------

interface ModeleFormel {
  prefixeTitre: string;   // ex. « Stage PFE — »
  contractType: string;
  experience: string;
  aPropos: string[];
  prerequis: string[];    // ajoutés après les prérequis du département
  avantages: string[];
  descriptionParDefaut: string;
}

const FORMEL: Record<'ete' | 'pfe' | 'emploi', ModeleFormel> = {
  pfe: {
    prefixeTitre: 'Stage PFE — ',
    contractType: 'Stage PFE (4 à 6 mois)',
    experience: 'Étudiant(e) en dernière année',
    aPropos: [
      'Ce stage de fin d’études s’inscrit dans un projet réel de 3LM Solutions. Le sujet est précisé avec vous à votre arrivée, selon votre profil et les besoins en cours.',
      'Vous êtes encadré(e) par un membre de l’équipe tout au long du stage, avec des points de suivi réguliers.',
    ],
    prerequis: [
      'Étudiant(e) en dernière année d’école d’ingénieurs, de master ou équivalent',
      'Autonomie, curiosité et sens de la communication',
      'Convention de stage délivrée par votre établissement',
    ],
    avantages: [
      'Un sujet concret, utilisé en conditions réelles',
      'Un encadrement régulier par l’équipe technique',
      'Une attestation de stage en fin de parcours',
      'Une possibilité d’évolution au sein de l’entreprise selon les opportunités',
    ],
    descriptionParDefaut: 'Stage de fin d’études sur un projet réel, encadré par l’équipe de 3LM Solutions.',
  },
  ete: {
    prefixeTitre: 'Stage d’été — ',
    contractType: 'Stage d’été (1 à 2 mois)',
    experience: 'Étudiant(e)',
    aPropos: [
      'Ce stage d’été vous permet de contribuer à un projet concret pendant 1 à 2 mois, au sein de l’équipe de 3LM Solutions.',
      'Vous êtes accompagné(e) par un membre de l’équipe, avec des objectifs clairs fixés dès le début du stage.',
    ],
    prerequis: [
      'Étudiant(e) en informatique ou dans un domaine proche',
      'Curiosité, envie d’apprendre et sens du travail en équipe',
      'Convention de stage délivrée par votre établissement',
    ],
    avantages: [
      'Une première expérience sur un projet réel',
      'Un accompagnement par l’équipe technique',
      'Une attestation de stage en fin de parcours',
    ],
    descriptionParDefaut: 'Stage d’été sur un projet concret, au sein de l’équipe de 3LM Solutions.',
  },
  emploi: {
    prefixeTitre: '',
    contractType: 'Temps plein',
    experience: '1 à 3 ans',
    aPropos: [
      'Vous rejoignez une équipe à taille humaine, en lien direct avec les clients et les projets.',
      'Vous participez à la conception, au développement et à l’évolution de solutions utilisées en production.',
    ],
    prerequis: [
      'Diplôme d’ingénieur, master ou équivalent',
      'Une première expérience sur des projets en production',
      'Autonomie, rigueur et sens du travail en équipe',
    ],
    avantages: [
      'Des projets variés, du cadrage à la mise en production',
      'Un contact direct avec l’équipe et les clients',
      'Un environnement de travail flexible',
    ],
    descriptionParDefaut: 'Poste au sein de l’équipe de 3LM Solutions.',
  },
};

const lignes = (liste: string[]) => liste.join('\n');

/** Valeurs pré-remplies pour un type d'offre, un programme (stage) et un
 *  département. Sans département connu (null ou « Autre »), seule la partie
 *  formelle est remplie : titre, description, missions et compétences restent à écrire. */
export function modeleOffre(type: TypeOffre, programme: ProgrammeStage, departement: string | null): ChampsOffre {
  const formel = FORMEL[type === 'stage' ? programme : 'emploi'];
  const dep = departement && departement in PAR_DEPARTEMENT ? PAR_DEPARTEMENT[departement as Departement] : null;

  return {
    titre: dep ? formel.prefixeTitre + (type === 'stage' ? dep.intitule.stage : dep.intitule.emploi) : '',
    departement: departement ?? '',
    location: LOCALISATION,
    contractType: formel.contractType,
    experience: formel.experience,
    description: dep ? dep.description : formel.descriptionParDefaut,
    aboutRole: lignes(formel.aPropos),
    responsibilities: dep ? lignes(dep.missions) : '',
    qualifications: lignes([...(dep ? dep.prerequis : []), ...formel.prerequis]),
    benefits: lignes(formel.avantages),
    skills: dep ? lignes(dep.competences) : '',
  };
}
