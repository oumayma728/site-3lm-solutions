import { Suspense } from 'react';
import type { Metadata } from 'next';
import SiteNavbar from '@/components/site/SiteNavbar';
import SiteFooter from '@/components/site/SiteFooter';
import CandidatureForm from './CandidatureForm';
import { getLang } from '@/lib/i18n-server';
import type { Translations } from '@/lib/i18n';
import '@/components/site/tokens.css';
import '@/components/site/Home.css';
import './candidature.css';

const fr = {
    metaTitle: 'Candidature',
    metaDescription:
        "Postulez à une offre d'emploi ou de stage chez 3LM Solutions — envoyez votre CV et quelques lignes sur ce qui vous motive.",
    badge: 'Candidature',
    h1: ['Prêt à nous rejoindre ? ', 'Faites le premier pas.'],
    lead: 'Quelques informations, votre CV, et nous revenons vers vous rapidement.',
};
const T: Translations<typeof fr> = {
    fr,
    en: {
        metaTitle: 'Apply',
        metaDescription:
            'Apply for a job or internship at 3LM Solutions — send your CV and a few lines about what motivates you.',
        badge: 'Application',
        h1: ['Ready to join us? ', 'Take the first step.'],
        lead: 'A few details, your CV, and we’ll get back to you quickly.',
    },
};

export async function generateMetadata(): Promise<Metadata> {
    const t = T[await getLang()];
    return { title: t.metaTitle, description: t.metaDescription };
}

export default async function CandidaturePage() {
    const t = T[await getLang()];
    return (
        <div className="site-lm">
            <SiteNavbar />
            <main className="candidature-page">
                <div className="candidature-bg" aria-hidden="true" />
                <section className="candidature-hero">
                    <span className="hero-badge"><span className="dot" />{t.badge}</span>
                    <h1>{t.h1[0]}<span className="gradient-text">{t.h1[1]}</span></h1>
                    <p>{t.lead}</p>
                </section>

                <Suspense fallback={null}>
                    <CandidatureForm />
                </Suspense>
            </main>
            <SiteFooter />
        </div>
    );
}
