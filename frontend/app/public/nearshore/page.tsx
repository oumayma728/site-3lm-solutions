import Link from 'next/link';
import SiteNavbar from '@/components/site/SiteNavbar';
import SiteFooter from '@/components/site/SiteFooter';
import '@/components/site/tokens.css';
import '@/components/site/Home.css';
import './nearshore.css';

export const metadata = {
  title: 'Nearshore IT Services',
  description:
    "3LM Solutions accompagne des entreprises européennes avec une équipe technique basée à Ariana, Tunisie, sur vos horaires de travail.",
};

export default function NearshorePage() {
  return (
    <div className="site-lm">
      <SiteNavbar />
      <main className="nearshore-page">
        <div className="nearshore-bg" aria-hidden="true" />
        <section className="ns-hero">
          <div className="ns-hero-text">
            <span className="hero-badge"><span className="dot" />Nearshore</span>
            <h1>
              Votre équipe tech.<br />
              <span className="gradient-text">À une heure de vous.</span>
            </h1>
            <p>
              3LM Solutions accompagne des entreprises européennes avec une équipe technique
              basée à Ariana, Tunisie — sur vos horaires, dans votre langue.
            </p>
            <div className="home-actions">
              <Link href="/public/rendez-vous" className="gradient-button">Discuter de mon projet →</Link>
            </div>
          </div>
          <div className="ns-hero-visual" aria-hidden="true">
            <span className="ns-orb" />
            <div className="ns-float-card ns-float-1">🇹🇳 Ariana</div>
            <div className="ns-float-card ns-float-2">🇪🇺 Vos bureaux</div>
            <div className="ns-float-card ns-float-3">Même journée de travail</div>
          </div>
        </section>

        <div className="stats-strip">
          <div className="stats-strip-inner">
            <div className="stat-item">
              <span className="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg></span>
              <span><span className="stat-num">GMT+1</span><span className="stat-label">Fuseau horaire aligné</span></span>
            </div>
            <div className="stat-item">
              <span className="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg></span>
              <span><span className="stat-num">FR</span><span className="stat-label">Équipe 100% francophone</span></span>
            </div>
            <div className="stat-item">
              <span className="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" /></svg></span>
              <span><span className="stat-num">&lt;24h</span><span className="stat-label">Délai de réponse garanti</span></span>
            </div>
          </div>
        </div>

        <section className="ns-statement">
          <p>
            Une équipe technique <span className="gradient-text">basée en Tunisie</span>,
            qui travaille <span className="gradient-text">comme si elle était chez vous</span>.
          </p>
        </section>

        <section className="ns-bento">
          <div className="section-marker"><span />Pourquoi 3LM</div>
          <div className="bento-grid">
            <article className="bento-card bento-large">
              <span className="bento-tag">01</span>
              <h3>Horaires alignés</h3>
              <p>Nous travaillons sur vos horaires de travail européens. Pas de décalage à gérer, pas d&rsquo;attente jusqu&rsquo;au lendemain pour une réponse — les échanges se font en temps réel, comme avec une équipe sur place.</p>
            </article>
            <article className="bento-card">
              <span className="bento-tag">02</span>
              <h3>Équipe francophone</h3>
              <p>Communication directe, sans barrière de langue ni intermédiaire.</p>
            </article>
            <article className="bento-card">
              <span className="bento-tag">03</span>
              <h3>Coûts maîtrisés</h3>
              <p>Une expertise de qualité, pour un budget plus accessible qu&rsquo;une équipe interne en Europe.</p>
            </article>
            <article className="bento-card bento-wide">
              <span className="bento-tag">04</span>
              <h3>Qualité constante</h3>
              <p>Méthodologie agile, livrables réguliers, suivi rigoureux — une équipe stable, sans rotation constante de profils.</p>
            </article>
          </div>
        </section>

        <section className="ns-compare">
          <div className="section-marker"><span />Le comparatif</div>
          <div className="section-heading">
            <h2>Pourquoi les entreprises nous choisissent plutôt qu&rsquo;un recrutement local.</h2>
          </div>
          <div className="ns-compare-grid">
            <div className="compare-card muted">
              <h3>Équipe interne en Europe</h3>
              <ul className="compare-list">
                <li><Cross />Recrutement long et incertain (souvent 2 à 3 mois)</li>
                <li><Cross />Charges sociales et coûts fixes élevés</li>
                <li><Cross />Risque de turnover et perte de savoir</li>
                <li><Cross />Montée en charge lente sur un nouveau besoin</li>
              </ul>
            </div>
            <div className="compare-card highlight">
              <h3>Équipe 3LM Nearshore</h3>
              <ul className="compare-list">
                <li><Check />Équipe opérationnelle en quelques semaines</li>
                <li><Check />Coût maîtrisé, sans charges cachées</li>
                <li><Check />Continuité et stabilité de l&rsquo;équipe projet</li>
                <li><Check />Scalable à la hausse comme à la baisse selon vos besoins</li>
              </ul>
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