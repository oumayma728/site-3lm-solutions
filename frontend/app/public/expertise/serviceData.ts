import type { Lang } from '@/lib/i18n';

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

type ServiceText = Pick<Service, 'title' | 'shortDescription' | 'longDescription' | 'capabilities'>;
type ServiceSource = Pick<Service, 'slug' | 'code' | 'color' | 'tools'> & Record<Lang, ServiceText>;

const SERVICES: ServiceSource[] = [
    {
        slug: 'intelligence-artificielle',
        code: '01',
        color: '#8b5cf6',
        tools: ['Python', 'LLM APIs (Claude, GPT, Gemini)', 'LangChain', 'Vector DBs'],
        fr: {
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
        },
        en: {
            title: 'Artificial Intelligence',
            shortDescription:
                'AI agents and business assistants that automate your tasks and support your decisions.',
            longDescription:
                'We design AI agents and business assistants tailored to your processes: conversational assistants, use of your internal data and automation of repetitive tasks. Each solution answers a concrete need with a clear goal: save time, improve reliability or make your teams’ work simpler.',
            capabilities: [
                'Custom chatbots and conversational assistants',
                'Autonomous agents connected to your internal data',
                'Business workflow automation (quote generation, sorting, classification)',
                'Integration of large language models (LLMs) into your existing tools',
            ],
        },
    },
    {
        slug: 'analyse-donnees',
        code: '02',
        color: '#22d3ee',
        tools: ['Python', 'SQL', 'Power BI / Metabase', 'PostgreSQL'],
        fr: {
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
        },
        en: {
            title: 'Data Analytics',
            shortDescription:
                'Turn your data into clear indicators to run your business better.',
            longDescription:
                'Your data should help you run your business, not just pile up in files. We bring together data from different sources, structure it and turn it into dashboards and reports built for your business teams. You get clearer indicators to track performance, spot trends and make informed decisions.',
            capabilities: [
                'Consolidation and cleaning of scattered data',
                'Dashboards and automated reporting',
                'Pipelines for recurring data processing',
                'Custom business indicators (sales, operations, HR)',
            ],
        },
    },
    {
        slug: 'iot',
        code: '03',
        color: '#34d399',
        tools: ['MQTT', 'Node.js', 'Python', 'Cloud IoT'],
        fr: {
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
        },
        en: {
            title: 'IoT',
            shortDescription:
                'Connect your equipment and sensors to monitor your operations and use field data.',
            longDescription:
                'We connect your sensors and equipment to your information systems to collect and use field data. Depending on your needs, we set up data collection, alerts, remote monitoring and the dashboards you need to keep track of your installations.',
            capabilities: [
                'Integration of sensors and connected equipment',
                'Real-time data feeds to your platforms',
                'Alerts and remote monitoring',
                'Field monitoring dashboards',
            ],
        },
    },
    {
        slug: 'devops-cloud',
        code: '04',
        color: '#fb923c',
        tools: ['Docker', 'Kubernetes', 'GitHub Actions', 'AWS / DigitalOcean'],
        fr: {
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
        },
        en: {
            title: 'DevOps & Cloud',
            shortDescription:
                'Well-managed infrastructure and automated deployments for more reliable applications.',
            longDescription:
                'We design and configure cloud environments suited to your applications and constraints. Containers, CI/CD pipelines, monitoring and backups: we help your teams automate releases, keep a closer eye on their environments and make their applications easier to maintain.',
            capabilities: [
                'CI/CD pipeline setup',
                'Containerization and orchestration (Docker, Kubernetes)',
                'Cloud hosting and infrastructure management',
                'Monitoring, alerting and automated backups',
            ],
        },
    },
    {
        slug: 'developpement-web',
        code: '05',
        color: '#6d6bff',
        tools: ['Next.js', 'React', 'Django / DRF', 'PostgreSQL'],
        fr: {
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
        },
        en: {
            title: 'Web Development',
            shortDescription:
                'Custom websites and web applications, built for your business needs and your growth.',
            longDescription:
                'We design and build websites, platforms and business applications aligned with your goals. From a showcase site to a complex application, we pay close attention to user experience, security, performance and maintainability.',
            capabilities: [
                'Showcase and corporate websites',
                'E-commerce platforms',
                'Custom business web applications',
                'Redesign and migration of existing sites',
            ],
        },
    },
    {
        slug: 'developpement-mobile',
        code: '06',
        color: '#f472b6',
        tools: ['React Native', 'Flutter', 'Firebase', 'REST / GraphQL'],
        fr: {
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
        },
        en: {
            title: 'Mobile Development',
            shortDescription:
                'Mobile apps designed for your users and connected to your systems.',
            longDescription:
                'We design mobile apps around how your customers and teams actually work. Connected to your APIs and existing systems, they can include whatever features your business needs. We help you choose between a native or cross-platform approach based on your needs, budget and technical constraints.',
            capabilities: [
                'Cross-platform iOS and Android apps',
                'Integration with your APIs and existing systems',
                'Notifications, payments and real-time features',
                'Maintenance and post-launch updates',
            ],
        },
    },
    {
        slug: 'solutions-erp',
        code: '07',
        color: '#fbbf24',
        tools: ['Odoo', 'PostgreSQL', 'Python', 'APIs métiers'],
        fr: {
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
        },
        en: {
            title: 'ERP Solutions',
            shortDescription:
                'Centralize your business processes and simplify how you run your company.',
            longDescription:
                'We help you deploy, configure or adapt ERP solutions to your business processes. Sales, inventory, invoicing or data flows: the goal is to structure your operations better, avoid re-entering data and have consistent information in one central system.',
            capabilities: [
                'ERP deployment and configuration',
                'Custom business module development',
                'Data migration from legacy systems',
                'Team training on the tool',
            ],
        },
    },
    {
        slug: 'community-management',
        code: '08',
        color: '#f87171',
        tools: ['Meta Business Suite', 'Canva', 'Analytics'],
        fr: {
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
        },
        en: {
            title: 'Community Management',
            shortDescription:
                'A consistent content strategy to strengthen your presence on social media.',
            longDescription:
                'We help you manage your social media presence, from defining your editorial line to scheduling posts. Content creation, account management and performance tracking: every action aims to increase your visibility and build a lasting relationship with your audience.',
            capabilities: [
                'Content strategy and editorial line',
                'Visuals and post creation',
                'Multi-platform scheduling and publishing',
                'Performance tracking and monthly reporting',
            ],
        },
    },
];

function localize(s: ServiceSource, lang: Lang): Service {
    return { slug: s.slug, code: s.code, color: s.color, tools: s.tools, ...s[lang] };
}

export function getServices(lang: Lang): Service[] {
    return SERVICES.map((s) => localize(s, lang));
}

export function getServiceBySlug(slug: string, lang: Lang): Service | undefined {
    const s = SERVICES.find((x) => x.slug === slug);
    return s && localize(s, lang);
}

// Slugs do not depend on the language (used to prebuild the pages' routes)
export const serviceSlugs = SERVICES.map((s) => s.slug);
