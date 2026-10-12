import Link from 'next/link';
import SiteNavbar from '@/components/site/SiteNavbar';
import SiteFooter from '@/components/site/SiteFooter';
import '@/components/site/tokens.css';
import '@/components/site/Home.css';
import './Carriere.css';
import {getOffres} from '@/lib/offres';
export const revalidate = 86400;
export const metadata = {
    title: 'Carrières',
    description:
        "Découvrez les opportunités de carrière chez 3LM Solutions : intelligence artificielle, data & analytics, IoT, DevOps & cloud, développement web & mobile, ERP et community management.",
};

export default async function CarrierePage() {
    const offres = await getOffres('emploi');
    return (
        <div className="site-lm">
            <SiteNavbar />
            <main className="carriere-page">
                <div className="carriere-bg" aria-hidden="true" />
                <section className="carriere-hero">
                    <span className="hero-badge"><span className="dot" />Carrières</span>
                    <h1>Huit domaines, <span className="gradient-text">une seule équipe</span>.</h1>
                    <p>{offres.length} poste{offres.length > 1 ? 's' : ''} ouvert{offres.length > 1 ? 's' : ''} en ce moment.</p>
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
                                            Détails →
                                        </Link>
                                        <Link href={`/public/candidature?type=poste&ref=${o.slug}`} className="job-btn job-btn-fill">
                                            Postuler →
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="home-contact-strip">
                    <div>
                        <div className="section-marker"><span />Entrer en contact</div>
                        <h2>Votre prochain projet mérite une base solide.</h2>
                        <p>Expliquez-nous votre besoin en 15 minutes et repartez avec une approche claire, chiffrée et réaliste.</p>
                    </div>
                    <Link href="/public/rendez-vous" className="gradient-button">Programmer un appel →</Link>
                </section>
            </main>
            <SiteFooter />
        </div>
    );
}