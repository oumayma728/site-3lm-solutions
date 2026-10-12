import Link from 'next/link';
import './Footer.css';

export default function SiteFooter() {
  return (
    <footer id="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-brand">
            <span className="footer-brand-name">3LM <span>Solutions</span></span>
            <p>Votre partenaire informatique fiable, rapide et efficace. Solutions informatiques professionnelles pour particuliers et entreprises.</p>
            <div className="socials">
              <a href="https://www.linkedin.com/company/3lm-solutions/posts/?feedView=all" className="social">in</a>
            </div>
          </div>
          <div className="footer-col">
            <h4>Services</h4>
            <ul>
              <li><Link href="/public/expertise/intelligence-artificielle">Intelligence Artificielle</Link></li>
              <li><Link href="/public/expertise/analyse-donnees">Analyses des données</Link></li>
              <li><Link href="/public/expertise/iot">IoT</Link></li>
              <li><Link href="/public/expertise/devops-cloud">DevOps</Link></li>
              <li><Link href="/public/expertise/developpement-web">Développement Web</Link></li>
              <li><Link href="/public/expertise/developpement-mobile">Développement Mobile</Link></li>
              <li><Link href="/public/expertise/solutions-erp">ERP</Link></li>
              <li><Link href="/public/expertise/community-management">Community management</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Liens</h4>
            <ul>
              <li><Link href="/">Accueil</Link></li>
              <li><Link href="/public/rendez-vous">Prendre rendez-vous</Link></li>
              <li><Link href="/public/login">Espace équipe</Link></li>
              <li><a href="#footer">Contactez-nous</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Contact</h4>
            <div className="footer-contact-item">📍 Ariana, Tunisie</div>
            <div className="footer-contact-item">📞 <a href="tel:+21656566533">+216 56 566 533</a></div>
            <div className="footer-contact-item">✉️ <a href="mailto:3lmsolutions@gmail.com">contact@3lmsolutions.net</a></div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>Copyright © 3LM Solutions</span>
          <span>Ariana, Tunisie</span>
        </div>
      </div>
    </footer>
  );
}
