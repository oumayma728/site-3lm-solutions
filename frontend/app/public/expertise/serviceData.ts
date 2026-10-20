export type Service = {
    slug: string;
    code: string;
    color: string;
    title: string;
    shortDescription: string;
    longDescription: string;
    capabilities: string[];
    tools: string[];
};

export const services: Service[] = [
    {
        slug: 'intelligence-artificielle',
        code: '01',
        color: '#8b5cf6',
        title: 'Intelligence Artificielle',
        shortDescription:
            'Des agents IA et assistants métiers pour automatiser vos tâches et faciliter vos décisions.',
        longDescription:
            "Nous concevons des agents IA et des assistants métiers adaptés à vos processus : assistants conversationnels, exploitation de données internes et automatisation de tâches répétitives. Chaque solution répond à un besoin concret, avec un objectif clair : gagner du temps, améliorer la fiabilité ou simplifier le travail de vos équipes.",
        capabilities: [
            'Chatbots et assistants conversationnels sur-mesure',
            'Agents autonomes connectés à vos données internes',
            "Automatisation de flux métiers (génération de devis, tri, classification)",
            'Intégration de modèles de langage (LLM) dans vos outils existants',
        ],
        tools: ['Python', 'LLM APIs (Claude, GPT, Gemini)', 'LangChain', 'Vector DBs'],
    },
    {
        slug: 'analyse-donnees',
        code: '02',
        color: '#22d3ee',
        title: 'Analyse des données',
        shortDescription:
            'Transformez vos données en indicateurs clairs pour mieux piloter votre activité.',
        longDescription:
            "Vos données doivent vous aider à piloter votre activité, pas simplement s'accumuler dans des fichiers. Nous centralisons les données issues de différentes sources, les structurons et les transformons en tableaux de bord et rapports adaptés à vos équipes métier. Vous disposez ainsi d'indicateurs plus lisibles pour suivre vos performances, identifier les tendances et prendre des décisions éclairées.",
        capabilities: [
            'Centralisation et nettoyage de données dispersées',
            'Tableaux de bord et reporting automatisé',
            'Pipelines de traitement de données récurrentes',
            "Indicateurs métiers sur-mesure (ventes, opérations, RH)",
        ],
        tools: ['Python', 'SQL', 'Power BI / Metabase', 'PostgreSQL'],
    },
    {
        slug: 'iot',
        code: '03',
        color: '#34d399',
        title: 'IoT',
        shortDescription:
            'Connectez vos équipements et capteurs pour suivre vos opérations et exploiter les données terrain.',
        longDescription:
            "Nous connectons vos capteurs et équipements à vos systèmes d'information pour collecter et exploiter les données du terrain. Selon vos besoins, nous mettons en place la remontée de mesures, les alertes, la supervision à distance et les tableaux de bord nécessaires au suivi de vos installations.",
        capabilities: [
            'Intégration de capteurs et équipements connectés',
            "Remontée de données en temps réel vers vos plateformes",
            "Alertes et supervision à distance",
            "Tableaux de bord de suivi terrain",
        ],
        tools: ['MQTT', 'Node.js', 'Python', 'Cloud IoT'],
    },
    {
        slug: 'devops-cloud',
        code: '04',
        color: '#fb923c',
        title: 'DevOps & Cloud',
        shortDescription:
            'Des infrastructures maîtrisées et des déploiements automatisés pour des applications plus fiables.',
        longDescription:
            "Nous concevons et configurons des environnements cloud adaptés à vos applications et à vos contraintes. Conteneurisation, pipelines CI/CD, supervision et sauvegardes : nous aidons vos équipes à automatiser les mises en production, à mieux surveiller leurs environnements et à faciliter la maintenance de leurs applications.",
        capabilities: [
            'Mise en place de pipelines CI/CD',
            'Conteneurisation et orchestration (Docker, Kubernetes)',
            "Hébergement cloud et gestion d'infrastructure",
            'Supervision, alerting et sauvegardes automatisées',
        ],
        tools: ['Docker', 'Kubernetes', 'GitHub Actions', 'AWS / DigitalOcean'],
    },
    {
        slug: 'developpement-web',
        code: '05',
        color: '#6d6bff',
        title: 'Développement Web',
        shortDescription:
            'Des sites et applications web sur mesure, conçus pour vos besoins métier et votre évolution.',
        longDescription:
            "Nous concevons et développons des sites web, des plateformes et des applications métier adaptés à vos objectifs. De la création d'un site vitrine à la réalisation d'une application complexe, nous accordons une attention particulière à l'expérience utilisateur, à la sécurité, aux performances et à la maintenabilité.",
        capabilities: [
            'Sites vitrines et institutionnels',
            'Plateformes e-commerce',
            'Applications web métiers sur-mesure',
            'Refonte et migration de sites existants',
        ],
        tools: ['Next.js', 'React', 'Django / DRF', 'PostgreSQL'],
    },
    {
        slug: 'developpement-mobile',
        code: '06',
        color: '#f472b6',
        title: 'Développement Mobile',
        shortDescription:
            'Des applications mobiles adaptées à vos utilisateurs et connectées à vos systèmes.',
        longDescription:
            "Nous concevons des applications mobiles pour répondre aux usages de vos clients et de vos équipes. Connectées à vos API et systèmes existants, elles peuvent intégrer les fonctionnalités nécessaires à votre activité. Nous vous accompagnons dans le choix d'une approche native ou cross-platform selon vos besoins, votre budget et vos contraintes techniques.",
        capabilities: [
            'Applications iOS et Android cross-platform',
            'Intégration avec vos API et systèmes existants',
            'Notifications, paiement et fonctionnalités temps réel',
            'Maintenance et évolutions post-lancement',
        ],
        tools: ['React Native', 'Flutter', 'Firebase', 'REST / GraphQL'],
    },
    {
        slug: 'solutions-erp',
        code: '07',
        color: '#fbbf24',
        title: 'Solutions ERP',
        shortDescription:
            'Centralisez vos processus métier et simplifiez la gestion de votre activité.',
        longDescription:
            "Nous vous accompagnons dans le déploiement, la configuration ou l'adaptation de solutions ERP à vos processus métier. Gestion commerciale, stocks, facturation ou circulation des données : l'objectif est de mieux structurer vos opérations, de limiter les ressaisies et de disposer d'informations cohérentes au sein d'un système centralisé.",
        capabilities: [
            "Déploiement et configuration d'ERP",
            'Développement de modules métiers sur-mesure',
            "Migration de données depuis d'anciens systèmes",
            "Formation des équipes à l'outil",
        ],
        tools: ['Odoo', 'PostgreSQL', 'Python', 'APIs métiers'],
    },
    {
        slug: 'community-management',
        code: '08',
        color: '#f87171',
        title: 'Community Management',
        shortDescription:
            'Une stratégie de contenu cohérente pour renforcer votre présence sur les réseaux sociaux.',
        longDescription:
            "Nous vous accompagnons dans la gestion de votre présence sur les réseaux sociaux, de la définition de votre ligne éditoriale à la planification des publications. Création de contenu, animation des comptes et suivi des indicateurs : chaque action vise à renforcer votre visibilité et à développer une relation durable avec votre audience.",
        capabilities: [
            'Stratégie de contenu et ligne éditoriale',
            'Création de visuels et publications',
            'Planification et publication multi-plateformes',
            'Suivi de performance et reporting mensuel',
        ],
        tools: ['Meta Business Suite', 'Canva', 'Analytics'],
    },
];

export function getServiceBySlug(slug: string): Service | undefined {
    return services.find((s) => s.slug === slug);
}
