import Link from 'next/link';
import type { Metadata } from 'next';
import SiteNavbar from '@/components/site/SiteNavbar';
import SiteFooter from '@/components/site/SiteFooter';
import ContactStrip from '@/components/site/ContactStrip';
import { getLang } from '@/lib/i18n-server';
import type { Translations } from '@/lib/i18n';
import '@/components/site/tokens.css';
import '@/components/site/Home.css';
import './Carriere.css';
import {getOffres} from '@/lib/offres';
export const revalidate = 86400;

const fr = {
    metaTitle: 'Carrières',
    metaDescription:
        'Découvrez les opportunités de carrière chez 3LM Solutions : intelligence artificielle, data & analytics, IoT, DevOps & cloud, développement web & mobile, ERP et community management.',
    badge: 'Carrières',
    h1: ['Huit domaines, ', 'une seule équipe', '.'],
    open: (n: number) => `${n} poste${n > 1 ? 's' : ''} ouvert${n > 1 ? 's' : ''} en ce moment.`,
    details: 'Détails →',
    apply: 'Postuler →',
};
const T: Translations<typeof fr> = {
    fr,
    en: {
        metaTitle: 'Careers',
        metaDescription:
            'Explore career opportunities at 3LM Solutions: artificial intelligence, data & analytics, IoT, DevOps & cloud, web & mobile development, ERP and community management.',
        badge: 'Careers',
        h1: ['Eight fields, ', 'one team', '.'],
        open: (n: number) => `${n} open position${n === 1 ? '' : 's'} right now.`,
        details: 'Details →',
        apply: 'Apply →',
    },
};

export async function generateMetadata(): Promise<Metadata> {
    const t = T[await getLang()];
    return { title: t.metaTitle, description: t.metaDescription };
}

export default async function CarrierePage() {
    const lang = await getLang();
    const t = T[lang];
    const offres = await getOffres('emploi');
    return (
        <div className="site-lm">
            <SiteNavbar />
            <main className="carriere-page">
                <div className="carriere-bg" aria-hidden="true" />
                <section className="carriere-hero">
                    <span className="hero-badge"><span className="dot" />{t.badge}</span>
                    <h1>{t.h1[0]}<span className="gradient-text">{t.h1[1]}</span>{t.h1[2]}</h1>
                    <p>{t.open(offres.length)}</p>
                </section>

                <section className="jobs-section">
                    <div className="jobs-list">
                        {offres.map((o) => (
                            <article
                                className="job-card"
                                key={o.slug}
                            >
                                <div className="job-card-bar" />
                                <div className="job-card-body">
                                    <div className="job-card-head">
                                        <h3>{o.titre}</h3>
                                        <span className="job-location">{o.location}</span>
                                    </div>
                                    <p className="job-desc">{o.description}</p>
                                    <div className="job-stack">
                                        {o.skills.map((s) => <span key={s}>{s}</span>)}
                                    </div>
                                    <div className="job-actions">
                                        <Link href={`/public/carrieres/${o.slug}`} className="job-btn job-btn-ghost">
                                            {t.details}
                                        </Link>
                                        <Link href={`/public/candidature?type=poste&ref=${o.slug}`} className="job-btn job-btn-fill">
                                            {t.apply}
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <ContactStrip lang={lang} />
            </main>
            <SiteFooter />
        </div>
    );
}
