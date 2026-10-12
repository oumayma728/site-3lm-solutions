import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { CSSProperties } from 'react';
import SiteNavbar from '@/components/site/SiteNavbar';
import SiteFooter from '@/components/site/SiteFooter';
import '@/components/site/tokens.css';
import '@/components/site/Home.css';
import '../Carriere.css';
import './OffreDetail.css';
import { getOffres , getOffreBySlug} from '@/lib/offres';
import { programmes, accentFor } from '../../stages/stagesData';

export async function generateStaticParams() {
  const [emplois, stages] = await Promise.all([getOffres('emploi'), getOffres('stage')]);
  return [...emplois, ...stages].map((o) => ({ slug: o.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const offre =await  getOffreBySlug(slug);
  if (!offre) return {};
  return {
    title: offre.titre,
    description: offre.description,
  };
}

// "tunisie" -> "Tunisie"
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export default async function OffreDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const offre = await getOffreBySlug(slug);
  if (!offre) notFound();
 const tous = await getOffres(offre.type_offre);

  const autres = tous.filter((o) => o.slug !== slug).slice(0, 3);

  const isStage = offre.type_offre === 'stage';
  const programme = isStage && offre.programme ? programmes[offre.programme] : null;
  const typeLabel = programme?.label ?? (isStage ? 'Stage' : cap(offre.contract_type || 'Emploi'));
  const noun = isStage ? 'stage' : 'poste';

  // Only show the facts that are actually filled in
  const summary = [
    { label: 'Département', value: cap(offre.departement) },
    { label: isStage ? 'Programme' : 'Type', value: typeLabel },
    { label: 'Durée', value: programme?.duree ?? '' },
    { label: 'Localisation', value: cap(offre.location) },
    { label: isStage ? 'Niveau' : 'Expérience', value: offre.experience },
  ].filter((item) => item.value);

  const lists = [
    { title: isStage ? 'Vos missions' : 'Responsabilités principales', items: offre.responsibilities },
    { title: isStage ? 'Profil recherché' : 'Qualifications requises', items: offre.qualifications },
    { title: 'Ce que nous offrons', items: offre.benefits },
  ].filter((section) => section.items.length > 0);

  const applyHref = `/public/candidature?type=${isStage ? 'stage' : 'poste'}&ref=${offre.slug}`;
  const backHref = isStage ? '/public/stages' : '/public/carrieres';

  return (
    <div className="site-lm">
      <SiteNavbar />
      <main
        className="offre-detail-page"
        style={{ '--job-accent': accentFor(offre.departement) } as CSSProperties}
      >
        <div className="carriere-bg" aria-hidden="true" />
        <section className="offre-hero">
          <Link href={backHref} className="detail-back">
            ← {isStage ? 'Tous nos stages' : 'Toutes nos offres'}
          </Link>
          {offre.departement && <span className="offre-hero-domaine">{offre.departement}</span>}
          <h1>{offre.titre}</h1>
          {offre.description && <p className="offre-hero-lead">{offre.description}</p>}
          <div className="offre-meta-chips">
            {offre.location && <span>📍 {cap(offre.location)}</span>}
            <span>💼 {typeLabel}</span>
            {programme && <span>📅 {programme.duree}</span>}
            {!isStage && offre.experience && <span>⏱️ {offre.experience}</span>}
          </div>
          <Link href={applyHref} className="gradient-button">Postuler maintenant →</Link>
        </section>

        {summary.length > 0 && (
          <div className="offre-summary-wrap">
            <section
              className="offre-summary"
              style={{ '--cols': summary.length } as CSSProperties}
            >
              {summary.map((item) => (
                <div className="offre-summary-item" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </section>
          </div>
        )}

        <section className="offre-body">
          {offre.about_role.length > 0 && (
            <div>
              <h2>À propos du {noun}</h2>
              {offre.about_role.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          )}

          {lists.map((section) => (
            <div key={section.title}>
              <h2>{section.title}</h2>
              <ul>
                {section.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          ))}

          {offre.skills.length > 0 && (
            <div>
              <h2>Compétences recherchées</h2>
              <div className="offre-skills">
                {offre.skills.map((s) => <span key={s}>{s}</span>)}
              </div>
            </div>
          )}

          <div className="offre-apply-card">
            <div>
              <h2>Ce {noun} vous correspond ?</h2>
              <p>Envoyez-nous votre CV et quelques lignes sur votre motivation, on vous répond rapidement.</p>
            </div>
            <Link href={applyHref} className="gradient-button">Postuler →</Link>
          </div>
        </section>

        {autres.length > 0 && (
          <section className="offre-others">
            <div className="section-marker"><span />{isStage ? 'Autres stages' : 'Voir aussi'}</div>
            <div className="jobs-list">
              {autres.map((o) => (
                <article className="job-card" key={o.slug}>
                  <div className="job-card-bar" />
                  <div className="job-card-body">
                    <div className="job-card-head">
                      <h3>{o.titre}</h3>
                      <span className="job-location">{o.location}</span>
                    </div>
                    <p className="job-desc">{o.description}</p>
                    <div className="job-actions">
                      <Link href={`/public/carrieres/${o.slug}`} className="job-btn job-btn-ghost">Détails →</Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="home-contact-strip">
          <div>
            <div className="section-marker"><span />Entrer en contact</div>
            <h2>Une question sur ce {noun} ?</h2>
            <p>Contactez-nous, nous répondons rapidement à toute question sur nos offres.</p>
          </div>
          <Link href="/public/rendez-vous" className="gradient-button">Programmer un appel →</Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
