'use client';

import { useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { programmesByLang, accentFor, type Programme } from './stagesData';
import type { Offre } from '@/lib/offres';
import { useLang } from '@/components/site/LangProvider';
import type { Translations } from '@/lib/i18n';

const MAX_SKILLS = 4;

const fr = {
  duration: 'Durée',
  open: 'Offres ouvertes',
  emptyTitle: 'Aucune offre ouverte pour le moment',
  emptyText:
    'De nouveaux sujets arrivent régulièrement. Vous pouvez aussi nous envoyer une candidature spontanée, on vous recontacte si un projet correspond à votre profil.',
  write: 'Nous écrire →',
  view: 'Voir l’offre',
};
const T: Translations<typeof fr> = {
  fr,
  en: {
    duration: 'Duration',
    open: 'Open positions',
    emptyTitle: 'No open positions right now',
    emptyText:
      'New topics come up regularly. You can also send us an open application — we’ll get back to you if a project matches your profile.',
    write: 'Write to us →',
    view: 'View offer',
  },
};

export default function ProgramSwitcher({ offres }: { offres: Offre[] }) {
  const lang = useLang();
  const t = T[lang];
  const programmes = programmesByLang[lang];
  const [active, setActive] = useState<Programme>('ete');
  const info = programmes[active];
  const filtered = offres.filter((o) => o.programme === active);
  const countFor = (key: Programme) => offres.filter((o) => o.programme === key).length;

  return (
    <>
      <div className="prog-switcher">
        {(Object.keys(programmes) as Programme[]).map((key) => (
          <button
            key={key}
            type="button"
            className={active === key ? 'active' : ''}
            onClick={() => setActive(key)}
          >
            {programmes[key].label}
            <span className="prog-count">{countFor(key)}</span>
          </button>
        ))}
      </div>

      <div className="prog-card">
        <div className="prog-card-meta">
          <span><small>{t.duration}</small>{info.duree}</span>
          <span><small>{t.open}</small>{filtered.length}</span>
        </div>
        <p>{info.texte}</p>
      </div>

      {filtered.length === 0 ? (
        <div className="offres-empty">
          <h3>{t.emptyTitle}</h3>
          <p>{t.emptyText}</p>
          <Link href="/public/contact" className="card-link">{t.write}</Link>
        </div>
      ) : (
        <div className="offres-grid">
          {filtered.map((o) => {
            const extraSkills = o.skills.length - MAX_SKILLS;
            return (
              <article
                className="offre-card"
                key={o.slug}
                style={{ '--accent': accentFor(o.departement) } as CSSProperties}
              >
                <div className="offre-top">
                  <span className="offre-domaine">{o.departement}</span>
                  <span className="offre-duree">{info.duree}</span>
                </div>

                <h3>
                  {/* Stretched link: the whole card is clickable */}
                  <Link href={`/public/carrieres/${o.slug}`} className="offre-title-link">
                    {o.titre}
                  </Link>
                </h3>

                <p>{o.description}</p>

                {o.skills.length > 0 && (
                  <div className="offre-stack">
                    {o.skills.slice(0, MAX_SKILLS).map((s) => <span key={s}>{s}</span>)}
                    {extraSkills > 0 && <span className="offre-more">+{extraSkills}</span>}
                  </div>
                )}

                <div className="offre-footer">
                  <div className="offre-meta">
                    {o.location && (
                      <span>
                        <svg aria-hidden width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        {o.location}
                      </span>
                    )}
                    {o.experience && <span>{o.experience}</span>}
                  </div>
                  <span className="offre-cta" aria-hidden>
                    {t.view} <span className="offre-arrow">→</span>
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
