import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteNavbar from '@/components/site/SiteNavbar';
import SiteFooter from '@/components/site/SiteFooter';
import '@/components/site/tokens.css';
import '@/components/site/Home.css';
import '../Carriere.css';
import './OffreDetail.css';
import { getOffres , getOffreBySlug} from '@/lib/offres';
export function generateStaticParams() {
  return getOffres('emploi').then((offres) => offres.map((o) => ({ slug: o.slug })));
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

export default async function OffreDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const offre = await getOffreBySlug(slug);
  if (!offre) notFound();
 const tous = await getOffres(offre.type_offre);

  const autres = tous.filter((o) => o.slug !== slug).slice(0, 3);

  return (
    <div className="site-lm">
      <SiteNavbar />
      <main className="offre-detail-page" >
        <div className="carriere-bg" aria-hidden="true" />
        <section className="offre-hero">
          <Link href="/public/carrieres" className="detail-back">← Toutes nos offres</Link>
          <h1>{offre.titre}</h1>
          <div className="offre-meta-chips">
            <span>📍 {offre.location}</span>
            <span>💼 {offre.type_offre}</span>
            <span>⏱️ {offre.experience}</span>
          </div>
          <Link href={`/public/candidature?type=poste&ref=${offre.slug}`} className="gradient-button">Postuler maintenant →</Link>
        </section>

        <section className="offre-summary">
          <div className="offre-summary-item"><span>Département</span><strong>{offre.departement}</strong></div>
          <div className="offre-summary-item"><span>Localisation</span><strong>{offre.location}</strong></div>
          <div className="offre-summary-item"><span>Type</span><strong>{offre.type_offre}</strong></div>
          <div className="offre-summary-item"><span>Expérience</span><strong>{offre.experience}</strong></div>
        </section>

        <section className="offre-body">
          <div>
            <h2>À propos du poste</h2>
            {offre.about_role.map((p, i) => <p key={i}>{p}</p>)}
          </div>

          <div>
            <h2>Responsabilités principales</h2>
            <ul>
              {offre.responsibilities.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </div>

          <div>
            <h2>Qualifications requises</h2>
            <ul>
              {offre.qualifications.map((q) => <li key={q}>{q}</li>)}
            </ul>
          </div>

          <div>
            <h2>Ce que nous offrons</h2>
            <ul>
              {offre.benefits.map((b) => <li key={b}>{b}</li>)}
            </ul>
          </div>

          <div>
            <h2>Compétences recherchées</h2>
            <div className="offre-skills">
              {offre.skills.map((s) => <span key={s}>{s}</span>)}
            </div>
          </div>
        </section>

        {autres.length > 0 && (
          <section className="offre-others">
            <div className="section-marker"><span />Voir aussi</div>
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
            <h2>Une question sur ce poste ?</h2>
            <p>Contactez-nous, nous répondons rapidement à toute question sur nos offres.</p>
          </div>
          <Link href="/public/rendez-vous" className="gradient-button">Programmer un appel →</Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}