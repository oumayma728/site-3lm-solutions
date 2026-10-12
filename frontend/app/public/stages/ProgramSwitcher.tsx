'use client';

import { useState } from 'react';
import Link from 'next/link';
import { programmes, type Programme } from './stagesData';
import type { Offre } from '@/lib/offres';

export default function ProgramSwitcher({ offres }: { offres: Offre[] }) {
  const [active, setActive] = useState<Programme>('ete');
  const info = programmes[active];
  const filtered = offres.filter((o) => o.programme === active);

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
          </button>
        ))}
      </div>

      <div className="prog-card">
        <div className="prog-card-meta">
          <span><small>Période</small>{info.periode}</span>
          <span><small>Durée</small>{info.duree}</span>
        </div>
        <p>{info.texte}</p>
      </div>

      <div className="offres-grid">
        {filtered.map((o) => (
          <article className="offre-card" key={o.slug}>
            <span className="offre-domaine">{o.departement}</span>
            <h3>{o.titre}</h3>
            <p>{o.description}</p>
            <div className="offre-stack">
              {o.skills.map((s) => <span key={s}>{s}</span>)}
            </div>
            <Link href={`/public/carrieres/${o.slug}`} className="card-link">Voir le détail →</Link>
          </article>
        ))}
      </div>
    </>
  );
}
