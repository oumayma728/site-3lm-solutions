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
        shortDescription: 'Agents autonomes, assistants métiers et modèles conçus pour automatiser vos décisions.',
        longDescription:
            "Nous concevons des agents IA et des assistants métiers adaptés à vos processus réels : chatbots capables de comprendre votre catalogue, systèmes d'aide à la décision, automatisation de tâches répétitives. L'objectif n'est jamais l'IA pour l'IA, mais un gain de temps ou de fiabilité mesurable sur un processus existant.",
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
        shortDescription: 'Des données dispersées transformées en tableaux de bord fiables et exploitables au quotidien.',
        longDescription:
            "Nous structurons vos données pour qu'elles deviennent un outil de pilotage plutôt qu'un fichier de plus. Cela va de la centralisation de sources multiples jusqu'à la construction de tableaux de bord clairs, pensés pour vos équipes métiers plutôt que pour des data scientists.",
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
        shortDescription: "Objets connectés et capteurs intégrés à vos systèmes pour un suivi en temps réel.",
        longDescription:
            "Nous connectons capteurs et équipements terrain à vos systèmes d'information pour un suivi en temps réel : supervision d'équipements, remontée d'alertes, collecte de mesures. Nous accompagnons aussi bien le choix du matériel que l'intégration logicielle qui en exploite les données.",
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
        shortDescription: 'Infrastructures fiables, déploiements automatisés et supervision continue.',
        longDescription:
            "Nous mettons en place des infrastructures cloud fiables et des pipelines de déploiement automatisés, pour que vos équipes livrent plus vite et sans mauvaise surprise en production. Cela inclut la conteneurisation, l'automatisation CI/CD et la supervision continue de vos environnements.",
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
        shortDescription: 'Plateformes rapides, sécurisées et pensées pour scaler avec votre activité.',
        longDescription:
            "Nous développons des sites et plateformes web sur-mesure — vitrines, e-commerce ou applications métiers complexes — avec une attention particulière portée à la performance, la sécurité et la facilité de maintenance sur le long terme.",
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
        shortDescription: 'Applications iOS et Android natives ou cross-platform, connectées à vos systèmes.',
        longDescription:
            "Nous concevons des applications mobiles pensées pour vos utilisateurs réels, connectées à vos systèmes existants (ERP, CRM, API métiers). Selon vos contraintes de budget et de délai, nous orientons vers une approche cross-platform ou native.",
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
        shortDescription: 'Digitalisation de vos processus métiers dans un système central et cohérent.',
        longDescription:
            "Nous accompagnons le déploiement, la configuration ou le développement de modules ERP adaptés à vos processus réels — gestion commerciale, stocks, facturation — pour remplacer les fichiers Excel éparpillés par un système central fiable.",
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
        shortDescription: 'Présence digitale et contenu géré pour développer votre visibilité en ligne.',
        longDescription:
            "Nous gérons votre présence sur les réseaux sociaux avec une ligne éditoriale cohérente : création de contenu, planification de publications et suivi de performance, pour construire une audience engagée plutôt qu'une simple présence passive.",
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