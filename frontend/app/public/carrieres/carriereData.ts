export type Offre = {
    slug: string;
    titre: string;
    department: string;
    location: string;
    type: string;
    experience: string;
    accent: string;
    description: string;
    aboutRole: string[];
    responsibilities: string[];
    qualifications: string[];
    benefits: string[];
    skills: string[];
};

// PLACEHOLDER DATA — replace with real open positions before publishing.
export const offres: Offre[] = [
    {
        slug: 'developpeur-web-fullstack',
        titre: 'Développeur Web Full-Stack',
        department: 'Développement',
        location: 'Ariana, Tunisie',
        type: 'Temps plein',
        experience: 'Confirmé',
        accent: '#6d6bff',
        description: 'Rejoignez notre équipe pour construire des plateformes web sur-mesure pour nos clients.',
        aboutRole: [
            "Vous rejoindrez l'équipe technique pour développer et maintenir des applications web pour nos clients, du cahier des charges au déploiement.",
            "Vous travaillerez en binôme avec un chef de projet sur des sujets variés : plateformes métiers, e-commerce, applications internes.",
        ],
        responsibilities: [
            'Développer des fonctionnalités front-end et back-end sur des projets clients',
            'Participer aux revues de code et à la définition des architectures',
            'Collaborer avec les équipes design et produit',
            'Assurer la maintenance et le support post-déploiement',
        ],
        qualifications: [
            "Expérience confirmée en développement web (React/Next.js et un framework back-end)",
            'À l\u2019aise avec les bases de données relationnelles',
            'Autonomie et rigueur dans la gestion des priorités',
        ],
        benefits: [
            'Environnement de travail flexible',
            "Projets variés, pas de routine",
            "Accompagnement et montée en compétence continue",
        ],
        skills: ['React', 'Next.js', 'TypeScript', 'Django', 'PostgreSQL'],
    },
    {
        slug: 'ingenieur-devops',
        titre: 'Ingénieur DevOps',
        department: 'Infrastructure',
        location: 'Ariana, Tunisie',
        type: 'Temps plein',
        experience: 'Confirmé',
        accent: '#22d3ee',
        description: "Prenez en charge nos infrastructures cloud et nos pipelines de déploiement.",
        aboutRole: [
            "Vous serez responsable de la fiabilité, la sécurité et l'automatisation de nos infrastructures et celles de nos clients.",
        ],
        responsibilities: [
            'Concevoir et maintenir des pipelines CI/CD',
            "Gérer l'hébergement cloud et la conteneurisation des applications",
            'Mettre en place la supervision et les alertes',
        ],
        qualifications: [
            'Expérience avec Docker et Kubernetes',
            'Maîtrise d\u2019un fournisseur cloud (AWS, GCP ou DigitalOcean)',
            'Bonnes pratiques de sécurité infrastructure',
        ],
        benefits: [
            'Environnement de travail flexible',
            'Projets variés, pas de routine',
        ],
        skills: ['Docker', 'Kubernetes', 'GitHub Actions', 'AWS'],
    },
];

export function getOffreBySlug(slug: string): Offre | undefined {
    return offres.find((o) => o.slug === slug);
}