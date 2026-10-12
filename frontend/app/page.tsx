import Link from 'next/link';
import SiteNavbar from '@/components/site/SiteNavbar';
import SiteFooter from '@/components/site/SiteFooter';
import '@/components/site/tokens.css';
import '@/components/site/Home.css';

const stats = [
  ['30+', 'Clients accompagnés', <svg key="i1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>],
  ['85+', 'Projets logiciels livrés', <svg key="i2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 12h6M9 16h6M9 8h6M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" /></svg>],
  ['7+', 'Pays desservis', <svg key="i3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.8 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.8-3.8-9s1.3-6.4 3.8-9z" /></svg>],
] as const;

const expertiseTeaser = [
  'Intelligence Artificielle', 'Data & Analytics', 'DevOps & Cloud',
  'Développement Web & Mobile', 'Solutions ERP', 'Community Management',
];

export default function Home() {
  return (
    <div className="site-lm">
      <SiteNavbar />
      <main className="home-page">
        <section className="home-hero">
          <div className="hero-bg" aria-hidden="true" />
          <div className="home-hero-copy">
            <span className="hero-badge"><span className="dot" />Studio tech basé à Ariana, Tunisie</span>
            <h1>
              L&rsquo;équipe qui construit vos <span className="gradient-text">produits digitaux</span> et vos <span className="gradient-text">agents IA</span>.
            </h1>
            <p>
              3LM Solutions conçoit et déploie des plateformes web, applications mobiles, agents IA et
              infrastructures cloud pour des entreprises qui veulent avancer vite, sans sacrifier la fiabilité.
            </p>
            <div className="home-actions">
              <Link href="/public/rendez-vous" className="gradient-button">Réserver un appel découverte →</Link>
              <Link href="/public/expertise" className="light-button">Voir notre expertise</Link>
            </div>
          </div>
        </section>

        <div className="stats-strip">
          <div className="stats-strip-inner">
            {stats.map(([num, label, icon]) => (
              <div className="stat-item" key={label}>
                <span className="stat-icon">{icon}</span>
                <span>
                  <span className="stat-num">{num}</span>
                  <span className="stat-label">{label}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* <div className="tech-strip">
          <span>Technologies que nous maîtrisons au quotidien</span>
          <div className="tech-pills">
            {stack.map((tech) => <em key={tech}>{tech}</em>)}
          </div>
        </div> */}

        <section className="home-why" id="methodologie">
          <div className="why-layout">
            <div>
              <div className="section-marker"><span />Pourquoi 3LM</div>
              <h2>Une approche claire, professionnelle et orientée résultats.</h2>
              <p>Nous relions vision business, expérience utilisateur et exécution technique pour livrer des solutions utiles dès le premier jour.</p>
            </div>
            <div className="why-list">
              <article><b>01</b><div><h3>Conseil pragmatique</h3><p>Des recommandations adaptées à vos priorités, vos contraintes et votre budget.</p></div></article>
              <article><b>02</b><div><h3>Solutions sécurisées</h3><p>Une attention constante à la fiabilité, la confidentialité et la maintenance.</p></div></article>
              <article><b>03</b><div><h3>Exécution agile</h3><p>Des cycles courts, des livrables visibles et une communication transparente.</p></div></article>
              <article><b>04</b><div><h3>Accompagnement complet</h3><p>De l&rsquo;idée initiale au déploiement, puis au support et à l&rsquo;évolution.</p></div></article>
            </div>
          </div>
        </section>

        <section className="home-about">
          <div className="about-copy">
            <div className="section-marker"><span />À propos</div>
            <h2>Un partenaire technologique pour vos projets essentiels.</h2>
            <p>Chez 3LM Solutions, nous concevons des outils numériques sur mesure pour aider les entreprises à gagner en performance, automatiser leurs opérations et mieux exploiter leurs données.</p>
            <p>Notre équipe combine savoir-faire technique, sens du service et recherche de résultats mesurables — des solutions modernes, prêtes à accompagner votre croissance.</p>
          </div>
        </section>

        <section className="home-services">
          <div className="section-marker"><span />Expertise</div>
          <div className="section-heading">
            <h2>Des compétences digitales réunies dans une même équipe.</h2>
            <p>Chaque service est pensé pour réduire la complexité et donner à vos équipes des outils fiables au quotidien.</p>
          </div>
          <div className="expertise-teaser-pills">
            {expertiseTeaser.map((label) => <span key={label}>{label}</span>)}
          </div>
          <Link href="/public/expertise" className="gradient-button">Explorer notre expertise →</Link>
        </section>

        <section className="ns-spotlight">
          <div className="ns-spotlight-card">
            <div className="ns-spotlight-visual" aria-hidden="true">
              <span className="ns-spotlight-chip ns-spotlight-chip-1">🇹🇳 Ariana</span>
              <span className="ns-spotlight-chip ns-spotlight-chip-2">🇪🇺 Vos bureaux</span>
              <span className="ns-spotlight-chip ns-spotlight-chip-3">Même journée de travail</span>
            </div>
            <div className="ns-spotlight-copy">
              <div className="section-marker"><span />Nearshore</div>
              <h2>Une équipe tech basée en Tunisie, <span className="gradient-text">à une heure de vous</span>.</h2>
              <p>Même fuseau horaire, équipe francophone, coûts maîtrisés — découvrez comment nous devenons l&rsquo;extension naturelle de votre équipe.</p>
              <div className="ns-spotlight-facts">
                <span><strong>GMT+1</strong>Fuseau aligné</span>
                <span><strong>FR</strong>Équipe francophone</span>
                <span><strong>&lt;24h</strong>Délai de réponse</span>
              </div>
              <Link href="/public/nearshore" className="gradient-button">Découvrir le nearshore →</Link>
            </div>
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
