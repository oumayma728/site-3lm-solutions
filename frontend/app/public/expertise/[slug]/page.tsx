import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteNavbar from '@/components/site/SiteNavbar';
import SiteFooter from '@/components/site/SiteFooter';
import '@/components/site/tokens.css';
import '@/components/site/Home.css';
import '../Expertise.css';
import './ExpertiseDetail.css';
import { services, getServiceBySlug } from '../serviceData';
import { serviceIcons } from '../serviceIcons';

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return {};
  return {
    title: service.title,
    description: service.shortDescription,
  };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  const others = services.filter((s) => s.slug !== service.slug).slice(0, 3);

  return (
    <div className="site-lm">
      <SiteNavbar />
      <main className="expertise-detail-page">
        <div className="expertise-bg" aria-hidden="true" />
        <section className="detail-hero" style={{ '--accent': service.color } as React.CSSProperties}>
          <Link href="/public/expertise" className="detail-back">← Toutes nos expertises</Link>
          <span className="card-icon">{serviceIcons[service.slug]}</span>
          <h1>{service.title}</h1>
          <p>{service.longDescription}</p>
          <div className="home-actions">
            <Link href="/public/rendez-vous" className="gradient-button">Discuter de mon projet →</Link>
          </div>
        </section>

        <section className="detail-body">
          <div className="detail-capabilities">
            <div className="section-marker"><span />Ce que nous livrons</div>
            <ul>
              {service.capabilities.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
          <div className="detail-tools">
            <div className="section-marker"><span />Technologies</div>
            <div className="tech-pills">
              {service.tools.map((t) => (
                <em key={t}>{t}</em>
              ))}
            </div>
          </div>
        </section>

        <section className="expertise-grid-section">
          <div className="section-marker"><span />Voir aussi</div>
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
                <span className="card-link">En savoir plus →</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="home-contact-strip">
          <div>
            <div className="section-marker"><span />Entrer en contact</div>
            <h2>Prêt à lancer votre projet {service.title.toLowerCase()} ?</h2>
            <p>Expliquez-nous votre besoin en 15 minutes et repartez avec une approche claire, chiffrée et réaliste.</p>
          </div>
          <Link href="/public/rendez-vous" className="gradient-button">Programmer un appel →</Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}