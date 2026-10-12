import { Suspense } from 'react';
import SiteNavbar from '@/components/site/SiteNavbar';
import SiteFooter from '@/components/site/SiteFooter';
import CandidatureForm from './CandidatureForm';
import '@/components/site/tokens.css';
import '@/components/site/Home.css';
import './candidature.css';

export const metadata = {
    title: 'Candidature',
    description:
        "Postulez à une offre d'emploi ou de stage chez 3LM Solutions — envoyez votre CV et quelques lignes sur ce qui vous motive.",
};

export default function CandidaturePage() {
    return (
        <div className="site-lm">
            <SiteNavbar />
            <main className="candidature-page">
                <div className="candidature-bg" aria-hidden="true" />
                <section className="candidature-hero">
                    <span className="hero-badge"><span className="dot" />Candidature</span>
                    <h1>Prêt à nous rejoindre ? <span className="gradient-text">Faites le premier pas.</span></h1>
                    <p>Quelques informations, votre CV, et nous revenons vers vous rapidement.</p>
                </section>

                <Suspense fallback={null}>
                    <CandidatureForm />
                </Suspense>
            </main>
            <SiteFooter />
        </div>
    );
}
