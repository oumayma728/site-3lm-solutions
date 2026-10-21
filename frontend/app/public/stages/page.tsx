import Link from 'next/link';
import type { Metadata } from 'next';
import SiteNavbar from '@/components/site/SiteNavbar';
import SiteFooter from '@/components/site/SiteFooter';
import ProgramSwitcher from './ProgramSwitcher';
import { parcoursByLang } from './stagesData';
import { getLang } from '@/lib/i18n-server';
import type { Translations } from '@/lib/i18n';
import '@/components/site/tokens.css';
import '@/components/site/Home.css';
import './stages.css';
import {getOffres} from '@/lib/offres';
export const revalidate = 86400;

const fr = {
  metaTitle: 'Stages 2026',
  metaDescription:
    "Rejoignez 3LM Solutions pour un stage d'été ou de fin d'études : projets réels, mentorat dédié, technologies modernes.",
  badge: 'Stages 2026',
  h1: ['Apprenez en construisant, ', 'pas en observant', '.'],
  lead: 'Deux formats de stage, des projets réels dès le premier jour, et une équipe qui vous laisse vraiment contribuer.',
  journeyMarker: 'Votre parcours',
  journeyTitle: 'Ce à quoi ressemble un stage chez nous.',
  offerTitle: 'Ce qu’on vous offre',
  offer: [
    'Un mentor dédié, pas juste un tuteur sur le papier',
    'Des projets réels, jamais un exercice fictif',
    'Un environnement flexible et une équipe accessible',
    'Une possibilité d’évolution au sein de l’entreprise selon les opportunités',
  ],
  lookTitle: 'Ce qu’on recherche',
  look: [
    'De la curiosité et l’envie sincère d’apprendre',
    'Des bases solides en programmation',
    'La capacité à devenir autonome progressivement',
    'Un bon esprit d’équipe et une communication professionnelle',
  ],
  questionMarker: 'Une question sur le programme ?',
  questionTitle: 'Parlons de votre profil.',
  questionText: 'Pas encore sûr du format qui vous correspond ? Écrivez-nous, on vous oriente.',
  questionCta: 'Nous contacter →',
};
const T: Translations<typeof fr> = {
  fr,
  en: {
    metaTitle: 'Internships 2026',
    metaDescription:
      'Join 3LM Solutions for a summer or final-year internship: real projects, dedicated mentoring, modern technologies.',
    badge: 'Internships 2026',
    h1: ['Learn by building, ', 'not by watching', '.'],
    lead: 'Two internship formats, real projects from day one, and a team that genuinely lets you contribute.',
    journeyMarker: 'Your journey',
    journeyTitle: 'What an internship with us looks like.',
    offerTitle: 'What we offer',
    offer: [
      'A dedicated mentor, not just a supervisor on paper',
      'Real projects, never a made-up exercise',
      'A flexible environment and an approachable team',
      'A chance to grow within the company as opportunities arise',
    ],
    lookTitle: 'What we look for',
    look: [
      'Curiosity and a genuine desire to learn',
      'Solid programming fundamentals',
      'The ability to become progressively autonomous',
      'Good team spirit and professional communication',
    ],
    questionMarker: 'A question about the program?',
    questionTitle: 'Let’s talk about your profile.',
    questionText: 'Not sure which format suits you? Write to us and we’ll point you in the right direction.',
    questionCta: 'Contact us →',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const t = T[await getLang()];
  return { title: t.metaTitle, description: t.metaDescription };
}

export default async function StagesPage() {
  const lang = await getLang();
  const t = T[lang];
  const offresStages = await getOffres('stage');
  return (
    <div className="site-lm">
      <SiteNavbar />
      <main className="stages-page">
        <div className="stages-bg" aria-hidden="true" />

        <section className="stages-hero">
          <span className="hero-badge"><span className="dot" />{t.badge}</span>
          <h1>{t.h1[0]}<span className="gradient-text">{t.h1[1]}</span>{t.h1[2]}</h1>
          <p>{t.lead}</p>
        </section>

        <section className="stages-programmes">
          <ProgramSwitcher offres={offresStages} />
        </section>

        <section className="stages-parcours">
          <div className="section-marker"><span />{t.journeyMarker}</div>
          <div className="section-heading">
            <h2>{t.journeyTitle}</h2>
          </div>
          <div className="parcours-line">
            {parcoursByLang[lang].map((p) => (
              <div className="parcours-step" key={p.num}>
                <span className="parcours-num">{p.num}</span>
                <h3>{p.titre}</h3>
                <p>{p.texte}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="stages-fit">
          <div className="fit-col">
            <h3>{t.offerTitle}</h3>
            <ul>
              {t.offer.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
          <div className="fit-col fit-col-accent">
            <h3>{t.lookTitle}</h3>
            <ul>
              {t.look.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </section>

        <section className="home-contact-strip">
          <div>
            <div className="section-marker"><span />{t.questionMarker}</div>
            <h2>{t.questionTitle}</h2>
            <p>{t.questionText}</p>
          </div>
          <Link href="/public/contact" className="gradient-button">{t.questionCta}</Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
