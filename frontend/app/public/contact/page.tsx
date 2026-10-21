import Link from 'next/link';
import type { Metadata } from 'next';
import SiteNavbar from '@/components/site/SiteNavbar';
import SiteFooter from '@/components/site/SiteFooter';
import ContactForm from './ContactForm';
import { getLang } from '@/lib/i18n-server';
import type { Translations } from '@/lib/i18n';
import '@/components/site/tokens.css';
import '@/components/site/Home.css';
import './contact.css';

const fr = {
  metaDescription:
    "Contactez l'équipe 3LM Solutions par email, téléphone ou message — nous répondons rapidement à toute question sur nos services.",
  h1: ['Une question ? ', 'Parlons-en.'],
  lead: 'Une question rapide, un projet à cadrer ou juste envie d’échanger — écrivez-nous, notre équipe vous répond rapidement.',
  email: 'Email',
  phone: 'Téléphone',
  address: 'Adresse',
  place: 'Ariana, Tunisie',
  alt: 'Vous préférez fixer directement un créneau ?',
  altLink: 'Prenez rendez-vous →',
};
const T: Translations<typeof fr> = {
  fr,
  en: {
    metaDescription:
      'Contact the 3LM Solutions team by email, phone or message — we answer any question about our services quickly.',
    h1: ['A question? ', 'Let’s talk.'],
    lead: 'A quick question, a project to scope or just want to talk — write to us and our team will get back to you quickly.',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    place: 'Ariana, Tunisia',
    alt: 'Prefer to book a time slot directly?',
    altLink: 'Book a call →',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Contact', description: T[await getLang()].metaDescription };
}

const ICONS = {
  email: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  ),
  address: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  ),
};

export default async function ContactPage() {
  const t = T[await getLang()];
  const infoItems = [
    { label: t.email, value: 'contact@3lmsolutions.net', href: 'mailto:contact@3lmsolutions.net', icon: ICONS.email },
    { label: t.phone, value: '+216 56 566 533', href: 'tel:+21656566533', icon: ICONS.phone },
    { label: t.address, value: t.place, icon: ICONS.address },
  ];
  return (
    <div className="site-lm">
      <SiteNavbar />
      <main className="contact-page">
        <div className="contact-bg" aria-hidden="true" />
        <div className="contact-layout">
          <div className="contact-intro">
            <span className="hero-badge"><span className="dot" />Contact</span>
            <h1>{t.h1[0]}<span className="gradient-text">{t.h1[1]}</span></h1>
            <p>{t.lead}</p>

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
              {t.alt} <Link href="/public/rendez-vous">{t.altLink}</Link>
            </p>
          </div>

          <ContactForm />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
