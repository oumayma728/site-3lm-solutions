import Link from 'next/link';
import SiteNavbar from '@/components/site/SiteNavbar';
import SiteFooter from '@/components/site/SiteFooter';
import ContactForm from './ContactForm';
import '@/components/site/tokens.css';
import '@/components/site/Home.css';
import './contact.css';

export const metadata = {
  title: 'Contact',
  description:
    "Contactez l'équipe 3LM Solutions par email, téléphone ou message — nous répondons rapidement à toute question sur nos services.",
};

const infoItems = [
  {
    label: 'Email',
    value: 'contact@3lmsolutions.net',
    href: 'mailto:contact@3lmsolutions.net',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    label: 'Téléphone',
    value: '+216 56 566 533',
    href: 'tel:+21656566533',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z" />
      </svg>
    ),
  },
  {
    label: 'Adresse',
    value: 'Ariana, Tunisie',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
];

export default function ContactPage() {
  return (
    <div className="site-lm">
      <SiteNavbar />
      <main className="contact-page">
        <div className="contact-bg" aria-hidden="true" />
        <div className="contact-layout">
          <div className="contact-intro">
            <span className="hero-badge"><span className="dot" />Contact</span>
            <h1>Une question ? <span className="gradient-text">Parlons-en.</span></h1>
            <p>
              Une question rapide, un projet à cadrer ou juste envie d&rsquo;échanger — écrivez-nous,
              notre équipe vous répond rapidement.
            </p>

            <ul className="contact-info-list">
              {infoItems.map((item) => (
                <li key={item.label}>
                  <span className="contact-info-icon">{item.icon}</span>
                  <span>
                    <small>{item.label}</small>
                    {item.href ? (
                      <a href={item.href}>{item.value}</a>
                    ) : (
                      <span className="value">{item.value}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>

            <p className="contact-alt">
              Vous préférez fixer directement un créneau ? <Link href="/public/rendez-vous">Prenez rendez-vous →</Link>
            </p>
          </div>

          <ContactForm />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
