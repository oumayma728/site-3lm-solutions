import Link from 'next/link';
import type { Metadata } from 'next';
import SiteNavbar from '@/components/site/SiteNavbar';
import SiteFooter from '@/components/site/SiteFooter';
import { getLang } from '@/lib/i18n-server';
import type { Translations } from '@/lib/i18n';
import { PrivacyEn, PrivacyFr, SOMMAIRE } from './PrivacyContent';
import '@/components/site/tokens.css';
import '@/components/site/Home.css';
import './confidentialite.css';

const fr = {
  metaTitle: 'Politique de confidentialité',
  metaDescription:
    'Comment 3LM Solutions collecte, utilise et protège vos données personnelles : candidatures, demandes de contact, rendez-vous et assistant IA.',
  badge: 'Données personnelles',
  h1: ['Politique de ', 'confidentialité'],
  lead: 'Ce que nous collectons, pourquoi, combien de temps nous le gardons et comment exercer vos droits — en clair.',
  updated: 'Dernière mise à jour : 21 octobre 2026',
  toc: 'Sommaire',
  back: '← Retour à l’accueil',
};
const T: Translations<typeof fr> = {
  fr,
  en: {
    metaTitle: 'Privacy policy',
    metaDescription:
      'How 3LM Solutions collects, uses and protects your personal data: job applications, contact requests, appointments and the AI assistant.',
    badge: 'Personal data',
    h1: ['Privacy ', 'policy'],
    lead: 'What we collect, why, how long we keep it and how to exercise your rights — in plain language.',
    updated: 'Last updated: October 21, 2026',
    toc: 'Contents',
    back: '← Back to home',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const t = T[await getLang()];
  return { title: t.metaTitle, description: t.metaDescription };
}

export default async function ConfidentialitePage() {
  const lang = await getLang();
  const t = T[lang];
  return (
    <div className="site-lm">
      <SiteNavbar />
      <main className="privacy-page">
        <div className="privacy-bg" aria-hidden="true" />

        <section className="privacy-hero">
          <span className="hero-badge"><span className="dot" />{t.badge}</span>
          <h1>{t.h1[0]}<span className="gradient-text">{t.h1[1]}</span></h1>
          <p>{t.lead}</p>
          <small>{t.updated}</small>
        </section>

        <div className="privacy-layout">
          <nav className="privacy-toc" aria-label={t.toc}>
            <strong>{t.toc}</strong>
            <ol>
              {SOMMAIRE[lang].map((s) => (
                <li key={s.id}><a href={`#${s.id}`}>{s.titre}</a></li>
              ))}
            </ol>
          </nav>

          <article className="privacy-content">
            {lang === 'en' ? <PrivacyEn /> : <PrivacyFr />}

            <p className="privacy-back">
              <Link href="/">{t.back}</Link>
            </p>
          </article>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
