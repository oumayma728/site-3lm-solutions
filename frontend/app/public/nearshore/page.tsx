import Link from 'next/link';
import type { Metadata } from 'next';
import SiteNavbar from '@/components/site/SiteNavbar';
import SiteFooter from '@/components/site/SiteFooter';
import ContactStrip from '@/components/site/ContactStrip';
import { getLang } from '@/lib/i18n-server';
import type { Translations } from '@/lib/i18n';
import '@/components/site/tokens.css';
import '@/components/site/Home.css';
import './nearshore.css';

const fr = {
  metaDescription:
    '3LM Solutions accompagne des entreprises européennes avec une équipe technique basée à Ariana, Tunisie, sur vos horaires de travail.',
  h1: ['Votre équipe tech.', 'À une heure de vous.'],
  lead: '3LM Solutions accompagne les entreprises européennes avec une équipe technique basée à Ariana, en Tunisie. Une collaboration de proximité, une communication fluide et des horaires de travail adaptés à vos besoins.',
  discuss: 'Discuter de mon projet →',
  floats: ['🇹🇳 Ariana', '🇪🇺 Vos bureaux', 'Même journée de travail'],
  stats: ['Fuseau horaire aligné', 'Équipe francophone et anglophone', 'Délai de réponse garanti'],
  statement: ['Une équipe technique ', 'basée en Tunisie', ', qui travaille ', 'comme si elle était chez vous', '.'],
  whyMarker: 'Pourquoi 3LM',
  bento: [
    ['Horaires alignés', 'Nous travaillons sur vos horaires de travail européens. Pas de décalage à gérer, pas d’attente jusqu’au lendemain pour une réponse — les échanges se font en temps réel, comme avec une équipe sur place.'],
    ['Équipe francophone et anglophone', 'Nous travaillons en français comme en anglais : une communication directe, sans barrière de langue ni intermédiaire.'],
    ['Coûts maîtrisés', 'Une expertise de qualité, pour un budget plus accessible qu’une équipe interne en Europe.'],
    ['Qualité constante', 'Méthodologie agile, livrables réguliers, suivi rigoureux — une équipe stable, sans rotation constante de profils.'],
  ] as [string, string][],
  compareMarker: 'Le comparatif',
  compareTitle: 'Pourquoi les entreprises nous choisissent plutôt qu’un recrutement local.',
  inHouse: 'Équipe interne en Europe',
  inHouseItems: [
    'Un processus de recrutement qui peut prendre plusieurs semaines',
    'Des coûts salariaux et des charges associés à l’embauche',
    'Du temps consacré à l’intégration et à la montée en compétences',
    'Une capacité d’évolution liée aux ressources internes disponibles',
  ],
  ours: 'Équipe 3LM Nearshore',
  oursItems: [
    'Un démarrage organisé selon le périmètre et les besoins du projet',
    'Un budget défini selon le modèle de collaboration retenu',
    'Un suivi structuré et une documentation du projet',
    'Des ressources ajustables selon l’évolution de vos besoins',
  ],
};
const T: Translations<typeof fr> = {
  fr,
  en: {
    metaDescription:
      '3LM Solutions supports European companies with a technical team based in Ariana, Tunisia, working your business hours.',
    h1: ['Your tech team.', 'One hour away.'],
    lead: '3LM Solutions supports European companies with a technical team based in Ariana, Tunisia. A close collaboration, smooth communication and working hours that fit your needs.',
    discuss: 'Discuss my project →',
    floats: ['🇹🇳 Ariana', '🇪🇺 Your offices', 'Same working day'],
    stats: ['Aligned time zone', 'French- and English-speaking team', 'Guaranteed response time'],
    statement: ['A technical team ', 'based in Tunisia', ', working ', 'as if it were in your office', '.'],
    whyMarker: 'Why 3LM',
    bento: [
      ['Aligned hours', 'We work on your European business hours. No time difference to manage, no waiting until the next day for an answer — conversations happen in real time, just like with an on-site team.'],
      ['French- and English-speaking team', 'We work in French and in English: direct communication, with no language barrier and no middleman.'],
      ['Controlled costs', 'Quality expertise at a more accessible budget than an in-house team in Europe.'],
      ['Consistent quality', 'Agile methodology, regular deliverables, rigorous follow-up — a stable team, without constant turnover.'],
    ],
    compareMarker: 'The comparison',
    compareTitle: 'Why companies choose us over hiring locally.',
    inHouse: 'In-house team in Europe',
    inHouseItems: [
      'A hiring process that can take several weeks',
      'Salary costs and employer charges that come with hiring',
      'Time spent on onboarding and training',
      'Capacity to grow limited by available internal resources',
    ],
    ours: '3LM Nearshore team',
    oursItems: [
      'A start organized around the scope and needs of the project',
      'A budget set by the collaboration model you choose',
      'Structured follow-up and project documentation',
      'Resources that scale with your needs',
    ],
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Nearshore IT Services', description: T[await getLang()].metaDescription };
}

const STAT_ICONS = [
  <svg key="s1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>,
  <svg key="s2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>,
  <svg key="s3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" /></svg>,
];
const STAT_NUMS = ['GMT+1', 'FR · EN', '<24h'];
const BENTO_CLASSES = ['bento-card bento-large', 'bento-card', 'bento-card', 'bento-card bento-wide'];

export default async function NearshorePage() {
  const lang = await getLang();
  const t = T[lang];
  return (
    <div className="site-lm">
      <SiteNavbar />
      <main className="nearshore-page">
        <div className="nearshore-bg" aria-hidden="true" />
        <section className="ns-hero">
          <div className="ns-hero-text">
            <span className="hero-badge"><span className="dot" />Nearshore</span>
            <h1>
              {t.h1[0]}<br />
              <span className="gradient-text">{t.h1[1]}</span>
            </h1>
            <p>{t.lead}</p>
            <div className="home-actions">
              <Link href="/public/rendez-vous" className="gradient-button">{t.discuss}</Link>
            </div>
          </div>
          <div className="ns-hero-visual" aria-hidden="true">
            <span className="ns-orb" />
            {t.floats.map((label, i) => (
              <div key={label} className={`ns-float-card ns-float-${i + 1}`}>{label}</div>
            ))}
          </div>
        </section>

        <div className="stats-strip">
          <div className="stats-strip-inner">
            {t.stats.map((label, i) => (
              <div className="stat-item" key={label}>
                <span className="stat-icon">{STAT_ICONS[i]}</span>
                <span><span className="stat-num">{STAT_NUMS[i]}</span><span className="stat-label">{label}</span></span>
              </div>
            ))}
          </div>
        </div>

        <section className="ns-statement">
          <p>
            {t.statement[0]}<span className="gradient-text">{t.statement[1]}</span>
            {t.statement[2]}<span className="gradient-text">{t.statement[3]}</span>{t.statement[4]}
          </p>
        </section>

        <section className="ns-bento">
          <div className="section-marker"><span />{t.whyMarker}</div>
          <div className="bento-grid">
            {t.bento.map(([title, text], i) => (
              <article className={BENTO_CLASSES[i]} key={title}>
                <span className="bento-tag">{String(i + 1).padStart(2, '0')}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="ns-compare">
          <div className="section-marker"><span />{t.compareMarker}</div>
          <div className="section-heading">
            <h2>{t.compareTitle}</h2>
          </div>
          <div className="ns-compare-grid">
            <div className="compare-card muted">
              <h3>{t.inHouse}</h3>
              <ul className="compare-list">
                {t.inHouseItems.map((item) => <li key={item}><Cross />{item}</li>)}
              </ul>
            </div>
            <div className="compare-card highlight">
              <h3>{t.ours}</h3>
              <ul className="compare-list">
                {t.oursItems.map((item) => <li key={item}><Check />{item}</li>)}
              </ul>
            </div>
          </div>
        </section>

        <ContactStrip lang={lang} />
      </main>
      <SiteFooter />
    </div>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function Cross() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
