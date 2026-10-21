import Link from 'next/link';
import type { Metadata } from 'next';
import SiteNavbar from '@/components/site/SiteNavbar';
import SiteFooter from '@/components/site/SiteFooter';
import ContactStrip from '@/components/site/ContactStrip';
import { getLang } from '@/lib/i18n-server';
import type { Translations } from '@/lib/i18n';
import '@/components/site/tokens.css';
import '@/components/site/Home.css';
import './Expertise.css';
import { getServices } from './serviceData';
import { serviceIcons } from './serviceIcons';

const fr = {
  metaTitle: 'Expertise',
  metaDescription:
    'Le détail des expertises de 3LM Solutions : intelligence artificielle, data & analytics, IoT, DevOps & cloud, développement web & mobile, ERP et community management.',
  h1: ['Huit domaines, ', 'une seule équipe', '.'],
  lead: 'Du développement logiciel à l’intelligence artificielle, nous concevons des solutions adaptées à vos enjeux métier. Explorez nos expertises et découvrez comment nous pouvons concrètement vous aider.',
  more: 'En savoir plus →',
};
const T: Translations<typeof fr> = {
  fr,
  en: {
    metaTitle: 'Expertise',
    metaDescription:
      '3LM Solutions’ areas of expertise in detail: artificial intelligence, data & analytics, IoT, DevOps & cloud, web & mobile development, ERP and community management.',
    h1: ['Eight fields, ', 'one team', '.'],
    lead: 'From software development to artificial intelligence, we design solutions that fit your business challenges. Explore our expertise and see how we can help you in practice.',
    more: 'Learn more →',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const t = T[await getLang()];
  return { title: t.metaTitle, description: t.metaDescription };
}

export default async function ExpertisePage() {
  const lang = await getLang();
  const t = T[lang];
  return (
    <div className="site-lm">
      <SiteNavbar />
      <main className="expertise-page">
        <div className="expertise-bg" aria-hidden="true" />
        <section className="expertise-hero">
          <span className="hero-badge"><span className="dot" />Expertise</span>
          <h1>{t.h1[0]}<span className="gradient-text">{t.h1[1]}</span>{t.h1[2]}</h1>
          <p>{t.lead}</p>
        </section>

        <section className="expertise-grid-section">
          <div className="expertise-grid">
            {getServices(lang).map((s) => (
              <Link
                href={`/public/expertise/${s.slug}`}
                className="discipline-card"
                key={s.slug}
                style={{ '--accent': s.color } as React.CSSProperties}
              >
                <span className="card-icon">{serviceIcons[s.slug]}</span>
                <h3>{s.title}</h3>
                <p>{s.shortDescription}</p>
                <span className="card-link">{t.more}</span>
              </Link>
            ))}
          </div>
        </section>

        <ContactStrip lang={lang} />
      </main>
      <SiteFooter />
    </div>
  );
}
