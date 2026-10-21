'use client';

// Client component: it is also rendered by client pages (rendez-vous), so it reads the
// language from the context instead of the request cookies.
import Link from 'next/link';
import { useLang } from './LangProvider';
import type { Translations } from '@/lib/i18n';
import './Footer.css';

const fr = {
  tagline: 'Votre partenaire informatique fiable, rapide et efficace. Solutions informatiques professionnelles pour particuliers et entreprises.',
  services: 'Services',
  links: 'Liens',
  contact: 'Contact',
  serviceLinks: [
    ['intelligence-artificielle', 'Intelligence Artificielle'],
    ['analyse-donnees', 'Analyses des données'],
    ['iot', 'IoT'],
    ['devops-cloud', 'DevOps'],
    ['developpement-web', 'Développement Web'],
    ['developpement-mobile', 'Développement Mobile'],
    ['solutions-erp', 'ERP'],
    ['community-management', 'Community management'],
  ] as [string, string][],
  home: 'Accueil',
  appointment: 'Prendre rendez-vous',
  contactUs: 'Contactez-nous',
  privacy: 'Politique de confidentialité',
  place: 'Ariana, Tunisie',
};
const T: Translations<typeof fr> = {
  fr,
  en: {
    tagline: 'Your reliable, fast and efficient IT partner. Professional IT solutions for individuals and businesses.',
    services: 'Services',
    links: 'Links',
    contact: 'Contact',
    serviceLinks: [
      ['intelligence-artificielle', 'Artificial Intelligence'],
      ['analyse-donnees', 'Data Analytics'],
      ['iot', 'IoT'],
      ['devops-cloud', 'DevOps'],
      ['developpement-web', 'Web Development'],
      ['developpement-mobile', 'Mobile Development'],
      ['solutions-erp', 'ERP'],
      ['community-management', 'Community management'],
    ],
    home: 'Home',
    appointment: 'Book a call',
    contactUs: 'Contact us',
    privacy: 'Privacy policy',
    place: 'Ariana, Tunisia',
  },
};

export default function SiteFooter() {
  const t = T[useLang()];
  return (
    <footer id="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-brand">
            <span className="footer-brand-name">3LM <span>Solutions</span></span>
            <p>{t.tagline}</p>
            <div className="socials">
              <a href="https://www.linkedin.com/company/3lm-solutions/posts/?feedView=all" className="social" aria-label="LinkedIn">in</a>
            </div>
          </div>
          <div className="footer-col">
            <h4>{t.services}</h4>
            <ul>
              {t.serviceLinks.map(([slug, label]) => (
                <li key={slug}><Link href={`/public/expertise/${slug}`}>{label}</Link></li>
              ))}
            </ul>
          </div>
          <div className="footer-col">
            <h4>{t.links}</h4>
            <ul>
              <li><Link href="/">{t.home}</Link></li>
              <li><Link href="/public/rendez-vous">{t.appointment}</Link></li>
              <li><a href="#footer">{t.contactUs}</a></li>
              <li><Link href="/public/confidentialite">{t.privacy}</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>{t.contact}</h4>
            <div className="footer-contact-item">📍 {t.place}</div>
            <div className="footer-contact-item">📞 <a href="tel:+21656566533">+216 56 566 533</a></div>
            <div className="footer-contact-item">✉️ <a href="mailto:contact@3lmsolutions.net">contact@3lmsolutions.net</a></div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>Copyright © 3LM Solutions</span>
          <span>{t.place}</span>
        </div>
      </div>
    </footer>
  );
}
