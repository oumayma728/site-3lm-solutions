import Link from 'next/link';
import SiteNavbar from '@/components/site/SiteNavbar';
import SiteFooter from '@/components/site/SiteFooter';
import '@/components/site/tokens.css';
import '@/components/site/Home.css';
import './Expertise.css';
import { services } from './serviceData';
import { serviceIcons } from './serviceIcons';

export const metadata = {
  title: 'Expertise',
  description:
    "Le détail des expertises de 3LM Solutions : intelligence artificielle, data & analytics, IoT, DevOps & cloud, développement web & mobile, ERP et community management.",
};

export default function ExpertisePage() {
  return (
    <div className="site-lm">
      <SiteNavbar />
      <main className="expertise-page">
        <div className="expertise-bg" aria-hidden="true" />
        <section className="expertise-hero">
          <span className="hero-badge"><span className="dot" />Expertise</span>
          <h1>Huit domaines, <span className="gradient-text">une seule équipe</span>.</h1>
          <p>Du développement logiciel à l’intelligence artificielle, nous concevons des solutions adaptées à vos enjeux métier. Explorez nos expertises et découvrez comment nous pouvons concrètement vous aider.</p>
        </section>

        <section className="expertise-grid-section">
          <div className="expertise-grid">
            {services.map((s) => (
              <Link
                href={`/public/expertise/${s.slug}`}
                className="discipline-card"
                key={s.slug}
                style={{ '--accent': s.color } as React.CSSProperties}
              >
                <span className="card-icon">{serviceIcons[s.slug]}</span>
                <h3>{s.title}</h3>
                <p>{s.shortDescription}</p>
                <span className="card-link">En savoir plus →</span>
              </Link>
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
