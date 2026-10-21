import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteNavbar from '@/components/site/SiteNavbar';
import SiteFooter from '@/components/site/SiteFooter';
import ContactStrip from '@/components/site/ContactStrip';
import { getLang } from '@/lib/i18n-server';
import type { Translations } from '@/lib/i18n';
import '@/components/site/tokens.css';
import '@/components/site/Home.css';
import '../Expertise.css';
import './ExpertiseDetail.css';
import { getServices, getServiceBySlug, serviceSlugs } from '../serviceData';
import { serviceIcons } from '../serviceIcons';

const fr = {
  back: '← Toutes nos expertises',
  discuss: 'Discuter de mon projet →',
  deliver: 'Ce que nous livrons',
  tech: 'Technologies',
  seeAlso: 'Voir aussi',
  more: 'En savoir plus →',
  ready: (title: string) => `Prêt à lancer votre projet ${title.toLowerCase()} ?`,
};
const T: Translations<typeof fr> = {
  fr,
  en: {
    back: '← All our expertise',
    discuss: 'Discuss my project →',
    deliver: 'What we deliver',
    tech: 'Technologies',
    seeAlso: 'See also',
    more: 'Learn more →',
    ready: (title: string) => `Ready to start your ${title} project?`,
  },
};

export function generateStaticParams() {
  return serviceSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getServiceBySlug(slug, await getLang());
  if (!service) return {};
  return {
    title: service.title,
    description: service.shortDescription,
  };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lang = await getLang();
  const t = T[lang];
  const service = getServiceBySlug(slug, lang);
  if (!service) notFound();

  const others = getServices(lang).filter((s) => s.slug !== service.slug).slice(0, 3);

  return (
    <div className="site-lm">
      <SiteNavbar />
      <main className="expertise-detail-page">
        <div className="expertise-bg" aria-hidden="true" />
        <section className="detail-hero" style={{ '--accent': service.color } as React.CSSProperties}>
          <Link href="/public/expertise" className="detail-back">{t.back}</Link>
          <span className="card-icon">{serviceIcons[service.slug]}</span>
          <h1>{service.title}</h1>
          <p>{service.longDescription}</p>
          <div className="home-actions">
            <Link href="/public/rendez-vous" className="gradient-button">{t.discuss}</Link>
          </div>
        </section>

        <section className="detail-body">
          <div className="detail-capabilities">
            <div className="section-marker"><span />{t.deliver}</div>
            <ul>
              {service.capabilities.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
          <div className="detail-tools">
            <div className="section-marker"><span />{t.tech}</div>
            <div className="tech-pills">
              {service.tools.map((tool) => (
                <em key={tool}>{tool}</em>
              ))}
            </div>
          </div>
        </section>

        <section className="expertise-grid-section">
          <div className="section-marker"><span />{t.seeAlso}</div>
          <div className="expertise-grid detail-others">
            {others.map((s) => (
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

        <ContactStrip lang={lang} title={t.ready(service.title)} />
      </main>
      <SiteFooter />
    </div>
  );
}
