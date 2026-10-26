import Link from 'next/link';
import type { Metadata } from 'next';
import SiteNavbar from '@/components/site/SiteNavbar';
import SiteFooter from '@/components/site/SiteFooter';
import { getLang } from '@/lib/i18n-server';
import type { Translations } from '@/lib/i18n';
import '@/components/site/tokens.css';
import '@/components/site/Home.css';

// const stats = [
//   ['30+', 'Clients accompagnés', <svg key="i1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>],
//   ['85+', 'Projets logiciels livrés', <svg key="i2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 12h6M9 16h6M9 8h6M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" /></svg>],
//   ['7+', 'Pays desservis', <svg key="i3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.8 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.8-3.8-9s1.3-6.4 3.8-9z" /></svg>],
// ] as const;

const fr = {
  metaTitle: '3LM Solutions — Studio tech Ariana, Tunisie',
  metaDescription:
    'Studio tech basé à Ariana, Tunisie. Nous concevons et déployons des plateformes web, applications mobiles, agents IA et infrastructures cloud pour des entreprises qui veulent avancer vite, sans sacrifier la fiabilité.',
  badge: 'Studio tech basé à Ariana, Tunisie',
  h1: ['L’équipe qui construit vos ', 'produits digitaux', ' et vos ', 'agents IA', '.'],
  lead:
    '3LM Solutions conçoit et déploie des plateformes web, applications mobiles, agents IA et infrastructures cloud pour des entreprises qui veulent avancer vite, sans sacrifier la fiabilité.',
  ctaCall: 'Réserver un appel découverte →',
  ctaExpertise: 'Voir notre expertise',
  whyMarker: 'Pourquoi 3LM',
  whyTitle: 'Une approche claire, professionnelle et orientée résultats.',
  whyText: 'Nous relions vision business, expérience utilisateur et exécution technique pour livrer des solutions utiles dès le premier jour.',
  why: [
    ['Conseil pragmatique', 'des choix techniques adaptés à vos objectifs et à votre budget.'],
    ['Fiabilité et sécurité', 'des solutions conçues pour protéger vos données et faciliter la maintenance.'],
    ['Avancement visible', 'des livrables réguliers et des priorités définies ensemble.'],
    ['Suivi dans la durée', 'de la conception à la mise en production et aux évolutions.'],
  ] as [string, string][],
  aboutMarker: 'À propos',
  aboutTitle: 'Un partenaire technologique pour vos projets essentiels.',
  about: [
    'Chez 3LM Solutions, nous concevons et développons des solutions numériques sur mesure pour répondre aux enjeux concrets des entreprises : digitaliser leurs processus, automatiser leurs opérations et tirer le meilleur parti de leurs données.',
    'De la conception au déploiement, nous associons expertise technique et compréhension de vos besoins métier pour créer des solutions fiables, évolutives et adaptées à vos objectifs.',
  ],
  servicesTitle: 'Des compétences digitales réunies dans une même équipe.',
  servicesText: 'Chaque service est pensé pour réduire la complexité et donner à vos équipes des outils fiables au quotidien.',
  teaser: ['Intelligence Artificielle', 'Data & Analytics', 'DevOps & Cloud', 'Développement Web & Mobile', 'Solutions ERP', 'Community Management'],
  servicesCta: 'Explorer notre expertise →',
  nsChips: ['🇹🇳 Ariana', '🇪🇺 Vos bureaux', 'Même journée de travail'],
  nsTitle: 'Votre équipe tech nearshore, basée en Tunisie.',
  nsText: 'Renforcez vos équipes avec des talents tech francophones et anglophones, un fuseau horaire aligné sur l’Europe et des coûts maîtrisés. Une collaboration fluide, au plus près de vos projets.',
  nsFacts: [['GMT+1', 'Fuseau aligné'], ['FR · EN', 'Équipe bilingue'], ['<24h', 'Délai de réponse']] as [string, string][],
  nsCta: 'Découvrir le nearshore →',
  contactMarker: 'Entrer en contact',
  contactTitle: 'Votre prochain projet mérite une base solide.',
  contactText: 'Expliquez-nous votre besoin en 15 minutes et repartez avec une approche claire, chiffrée et réaliste.',
  contactCta: 'Programmer un appel →',
};

const T: Translations<typeof fr> = {
  fr,
  en: {
    metaTitle: '3LM Solutions — Tech studio in Ariana, Tunisia',
    metaDescription:
      'Tech studio based in Ariana, Tunisia. We design and ship web platforms, mobile apps, AI agents and cloud infrastructure for companies that want to move fast without sacrificing reliability.',
    badge: 'Tech studio based in Ariana, Tunisia',
    h1: ['The team that builds your ', 'digital products', ' and your ', 'AI agents', '.'],
    lead:
      '3LM Solutions designs and ships web platforms, mobile apps, AI agents and cloud infrastructure for companies that want to move fast without sacrificing reliability.',
    ctaCall: 'Book a discovery call →',
    ctaExpertise: 'See our expertise',
    whyMarker: 'Why 3LM',
    whyTitle: 'A clear, professional, results-driven approach.',
    whyText: 'We connect business vision, user experience and technical execution to deliver solutions that are useful from day one.',
    why: [
      ['Pragmatic advice', 'technical choices that fit your goals and your budget.'],
      ['Reliability and security', 'solutions built to protect your data and stay easy to maintain.'],
      ['Visible progress', 'regular deliverables and priorities set together.'],
      ['Long-term support', 'from design to production and every update after.'],
    ],
    aboutMarker: 'About us',
    aboutTitle: 'A technology partner for your key projects.',
    about: [
      'At 3LM Solutions, we design and build custom digital solutions for the real challenges businesses face: digitizing their processes, automating their operations and getting the most out of their data.',
      'From design to deployment, we combine technical expertise with an understanding of your business to build solutions that are reliable, scalable and aligned with your goals.',
    ],
    servicesTitle: 'Digital skills brought together in one team.',
    servicesText: 'Every service is designed to reduce complexity and give your teams reliable tools for everyday work.',
    teaser: ['Artificial Intelligence', 'Data & Analytics', 'DevOps & Cloud', 'Web & Mobile Development', 'ERP Solutions', 'Community Management'],
    servicesCta: 'Explore our expertise →',
    nsChips: ['🇹🇳 Ariana', '🇪🇺 Your offices', 'Same working day'],
    nsTitle: 'Your nearshore tech team, based in Tunisia.',
    nsText: 'Strengthen your teams with French- and English-speaking tech talent, a time zone close to Europe’s and controlled costs. A smooth collaboration, close to your projects.',
    nsFacts: [['GMT+1', 'Aligned time zone'], ['FR · EN', 'Bilingual team'], ['<24h', 'Response time']],
    nsCta: 'Discover nearshore →',
    contactMarker: 'Get in touch',
    contactTitle: 'Your next project deserves a solid foundation.',
    contactText: 'Tell us about your needs in 15 minutes and leave with a clear, costed and realistic approach.',
    contactCta: 'Schedule a call →',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const t = T[await getLang()];
  return { title: t.metaTitle, description: t.metaDescription };
}

export default async function Home() {
  const t = T[await getLang()];
  return (
    <div className="site-lm">
      <SiteNavbar />
      <main className="home-page">
        <section className="home-hero">
          <div className="hero-bg" aria-hidden="true" />
          <div className="home-hero-copy">
            <span className="hero-badge"><span className="dot" />{t.badge}</span>
            <h1>
              {t.h1[0]}<span className="gradient-text">{t.h1[1]}</span>{t.h1[2]}<span className="gradient-text">{t.h1[3]}</span>{t.h1[4]}
            </h1>
            <p>{t.lead}</p>
            <div className="home-actions">
              <Link href="/public/rendez-vous" className="gradient-button">{t.ctaCall}</Link>
              <Link href="/public/expertise" className="light-button">{t.ctaExpertise}</Link>
            </div>
          </div>
        </section>

        <section className="home-why" id="methodologie">
          <div className="why-layout">
            <div>
              <div className="section-marker"><span />{t.whyMarker}</div>
              <h2>{t.whyTitle}</h2>
              <p>{t.whyText}</p>
            </div>
            <div className="why-list">
              {t.why.map(([title, text], i) => (
                <article key={title}><b>{String(i + 1).padStart(2, '0')}</b><div><h3>{title}</h3><p>{text}</p></div></article>
              ))}
            </div>
          </div>
        </section>

        <section className="home-about">
          <div className="about-copy">
            <div className="section-marker"><span />{t.aboutMarker}</div>
            <h2>{t.aboutTitle}</h2>
            {t.about.map((p) => <p key={p}>{p}</p>)}
          </div>
        </section>

        <section className="home-services">
          <div className="section-marker"><span />Expertise</div>
          <div className="section-heading">
            <h2>{t.servicesTitle}</h2>
            <p>{t.servicesText}</p>
          </div>
          <div className="expertise-teaser-pills">
            {t.teaser.map((label) => <span key={label}>{label}</span>)}
          </div>
          <Link href="/public/expertise" className="gradient-button">{t.servicesCta}</Link>
        </section>

        <section className="ns-spotlight">
          <div className="ns-spotlight-card">
            <div className="ns-spotlight-visual" aria-hidden="true">
              {t.nsChips.map((chip, i) => (
                <span key={chip} className={`ns-spotlight-chip ns-spotlight-chip-${i + 1}`}>{chip}</span>
              ))}
            </div>
            <div className="ns-spotlight-copy">
              <div className="section-marker"><span />Nearshore</div>
              <h2>{t.nsTitle}</h2>
              <p>{t.nsText}</p>
              <div className="ns-spotlight-facts">
                {t.nsFacts.map(([value, label]) => (
                  <span key={label}><strong>{value}</strong>{label}</span>
                ))}
              </div>
              <Link href="/public/nearshore" className="gradient-button">{t.nsCta}</Link>
            </div>
          </div>
        </section>

        <section className="home-contact-strip">
          <div>
            <div className="section-marker"><span />{t.contactMarker}</div>
            <h2>{t.contactTitle}</h2>
            <p>{t.contactText}</p>
          </div>
          <Link href="/public/rendez-vous" className="gradient-button">{t.contactCta}</Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
