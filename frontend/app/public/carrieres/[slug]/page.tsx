import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { CSSProperties } from 'react';
import SiteNavbar from '@/components/site/SiteNavbar';
import SiteFooter from '@/components/site/SiteFooter';
import { getLang } from '@/lib/i18n-server';
import type { Translations } from '@/lib/i18n';
import '@/components/site/tokens.css';
import '@/components/site/Home.css';
import '../Carriere.css';
import './OffreDetail.css';
import { getOffres , getOffreBySlug} from '@/lib/offres';
import { programmesByLang, accentFor } from '../../stages/stagesData';

// Page labels only: the offer itself (title, missions…) is shown as written in the admin.
const fr = {
  internship: 'Stage',
  job: 'Emploi',
  department: 'Département',
  programme: 'Programme',
  type: 'Type',
  duration: 'Durée',
  location: 'Localisation',
  level: 'Niveau',
  experience: 'Expérience',
  missions: 'Vos missions',
  responsibilities: 'Responsabilités principales',
  profile: 'Profil recherché',
  qualifications: 'Qualifications requises',
  benefits: 'Ce que nous offrons',
  skills: 'Compétences recherchées',
  backStages: '← Tous nos stages',
  backJobs: '← Toutes nos offres',
  applyNow: 'Postuler maintenant →',
  apply: 'Postuler →',
  about: (isStage: boolean): string => (isStage ? 'À propos du stage' : 'À propos du poste'),
  fits: (isStage: boolean): string => (isStage ? 'Ce stage vous correspond ?' : 'Ce poste vous correspond ?'),
  fitsText: 'Envoyez-nous votre CV et quelques lignes sur votre motivation, on vous répond rapidement.',
  othersStages: 'Autres stages',
  othersJobs: 'Voir aussi',
  details: 'Détails →',
  contactMarker: 'Entrer en contact',
  question: (isStage: boolean): string => (isStage ? 'Une question sur ce stage ?' : 'Une question sur ce poste ?'),
  questionText: 'Contactez-nous, nous répondons rapidement à toute question sur nos offres.',
  call: 'Programmer un appel →',
};
const T: Translations<typeof fr> = {
  fr,
  en: {
    internship: 'Internship',
    job: 'Job',
    department: 'Department',
    programme: 'Program',
    type: 'Type',
    duration: 'Duration',
    location: 'Location',
    level: 'Level',
    experience: 'Experience',
    missions: 'Your missions',
    responsibilities: 'Key responsibilities',
    profile: 'Who we’re looking for',
    qualifications: 'Requirements',
    benefits: 'What we offer',
    skills: 'Skills',
    backStages: '← All our internships',
    backJobs: '← All our openings',
    applyNow: 'Apply now →',
    apply: 'Apply →',
    about: (isStage: boolean): string => (isStage ? 'About the internship' : 'About the role'),
    fits: (isStage: boolean): string => (isStage ? 'Is this internship for you?' : 'Is this role for you?'),
    fitsText: 'Send us your CV and a few lines about your motivation — we’ll get back to you quickly.',
    othersStages: 'Other internships',
    othersJobs: 'See also',
    details: 'Details →',
    contactMarker: 'Get in touch',
    question: (isStage: boolean): string => (isStage ? 'A question about this internship?' : 'A question about this role?'),
    questionText: 'Contact us — we answer any question about our openings quickly.',
    call: 'Schedule a call →',
  },
};

// Rendered on every request: the page reads the language cookie, and offers created after
// the build would otherwise be prerendered on first visit, where reading cookies is not
// allowed (production-only 500). No generateStaticParams for the same reason.
export const dynamic = 'force-dynamic';

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
  const lang = await getLang();
  const t = T[lang];
  const offre = await getOffreBySlug(slug);
  if (!offre) notFound();
 const tous = await getOffres(offre.type_offre);

  const autres = tous.filter((o) => o.slug !== slug).slice(0, 3);

  const isStage = offre.type_offre === 'stage';
  const programme = isStage && offre.programme ? programmesByLang[lang][offre.programme] : null;
  const typeLabel = programme?.label ?? (isStage ? t.internship : cap(offre.contract_type || t.job));

  // Only show the facts that are actually filled in
  const summary = [
    { label: t.department, value: cap(offre.departement) },
    { label: isStage ? t.programme : t.type, value: typeLabel },
    { label: t.duration, value: programme?.duree ?? '' },
    { label: t.location, value: cap(offre.location) },
    { label: isStage ? t.level : t.experience, value: offre.experience },
  ].filter((item) => item.value);

  const lists = [
    { title: isStage ? t.missions : t.responsibilities, items: offre.responsibilities },
    { title: isStage ? t.profile : t.qualifications, items: offre.qualifications },
    { title: t.benefits, items: offre.benefits },
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
            {isStage ? t.backStages : t.backJobs}
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
          <Link href={applyHref} className="gradient-button">{t.applyNow}</Link>
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
              <h2>{t.about(isStage)}</h2>
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
              <h2>{t.skills}</h2>
              <div className="offre-skills">
                {offre.skills.map((s) => <span key={s}>{s}</span>)}
              </div>
            </div>
          )}

          <div className="offre-apply-card">
            <div>
              <h2>{t.fits(isStage)}</h2>
              <p>{t.fitsText}</p>
            </div>
            <Link href={applyHref} className="gradient-button">{t.apply}</Link>
          </div>
        </section>

        {autres.length > 0 && (
          <section className="offre-others">
            <div className="section-marker"><span />{isStage ? t.othersStages : t.othersJobs}</div>
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
                      <Link href={`/public/carrieres/${o.slug}`} className="job-btn job-btn-ghost">{t.details}</Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="home-contact-strip">
          <div>
            <div className="section-marker"><span />{t.contactMarker}</div>
            <h2>{t.question(isStage)}</h2>
            <p>{t.questionText}</p>
          </div>
          <Link href="/public/rendez-vous" className="gradient-button">{t.call}</Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
