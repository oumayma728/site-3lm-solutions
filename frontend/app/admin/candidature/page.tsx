
'use client';

import { useEffect, useState } from 'react';
import {
  getAllCandidaturesAdmin,
  type candidature,
} from '@/lib/candidature';

import PageHeader from '@/components/PageHeader';
import { useToast } from '@/components/ToastProvider';

export default function CandidaturesListPage() {
  const toast = useToast();

  const [candidatures, setCandidatures] = useState<candidature[]>([]);
  const [selectedCandidature, setSelectedCandidature] =
    useState<candidature | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getAllCandidaturesAdmin()
      .then(setCandidatures)
      .catch(() =>
        toast.error('Impossible de charger les candidatures.')
      )
      .finally(() => setLoading(false));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredCandidatures = candidatures.filter((c) => {
    const query = search.toLowerCase();

    return (
      c.nom.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query) ||
      c.reference?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="px-8 py-10 max-w-6xl">
      <PageHeader
        eyebrow="Recrutement"
        title="Candidatures"
      />

      {/* Header / search */}
      {!loading && candidatures.length > 0 && (
        <div className="mt-8 mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-[var(--ink-soft)]">
              {candidatures.length}{' '}
              {candidatures.length === 1
                ? 'candidature reçue'
                : 'candidatures reçues'}
            </p>
          </div>

          <div className="relative w-72">
            <input
              type="text"
              placeholder="Rechercher un candidat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-sm outline-none transition focus:border-[var(--accent-secondary)]"
            />
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 rounded-2xl bg-[var(--line)]/50 animate-pulse"
            />
          ))}
        </div>
      ) : candidatures.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-6 py-12 text-center">
          <p className="text-sm font-medium">
            Aucune candidature reçue
          </p>

          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Les candidatures envoyées depuis le site apparaîtront ici.
          </p>
        </div>
      ) : filteredCandidatures.length === 0 ? (
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-6 py-10 text-center">
          <p className="text-sm text-[var(--ink-soft)]">
            Aucun candidat ne correspond à votre recherche.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCandidatures.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCandidature(c)}
              className="group w-full rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 text-left transition hover:border-[var(--accent-secondary)]/40 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-6">
                {/* Candidate identity */}
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--line)] text-sm font-semibold">
                    {c.nom
                      .split(' ')
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold">
                      {c.nom}
                    </h2>

                    <p className="mt-1 truncate text-sm text-[var(--ink-soft)]">
                      {c.email}
                    </p>

                    <p className="mt-1 text-sm text-[var(--ink-soft)]">
                      {c.telephone}
                    </p>
                  </div>
                </div>

                {/* Job / reference */}
                <div className="shrink-0 text-right">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-mono-num">
                    Poste
                  </p>

                  <p className="mt-1 max-w-[220px] truncate text-sm font-medium">
                    {c.reference || 'Poste non renseigné'}
                  </p>
                </div>
              </div>

              {/* Message preview */}
              {c.message && (
                <div className="mt-4 border-t border-[var(--line)] pt-4">
                  <p className="line-clamp-2 text-sm leading-6 text-[var(--ink-soft)]">
                    {c.message}
                  </p>
                </div>
              )}

              {/* Bottom row */}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-[var(--ink-soft)]">
                  Candidature #{c.id}
                </span>

                <span className="text-sm font-medium text-[var(--accent-secondary)] transition group-hover:translate-x-0.5">
                  Voir le profil →
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Candidate detail drawer */}
      {selectedCandidature && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => setSelectedCandidature(null)}
            className="absolute inset-0 h-full w-full bg-black/30 backdrop-blur-[2px]"
          />

          {/* Drawer */}
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-[var(--surface)] shadow-2xl">
            {/* Drawer header */}
            <div className="flex items-start justify-between border-b border-[var(--line)] px-6 py-5">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-mono-num">
                  Candidature #{selectedCandidature.id}
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  {selectedCandidature.nom}
                </h2>

                <p className="mt-1 text-sm text-[var(--ink-soft)]">
                  {selectedCandidature.reference || 'Poste non renseigné'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCandidature(null)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--line)] text-lg transition hover:bg-[var(--line)]/40"
                aria-label="Fermer"
              >
                ×
              </button>
            </div>

            {/* Drawer content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {/* Contact */}
              <section>
                <p className="mb-3 text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-mono-num">
                  Coordonnées
                </p>

                <div className="space-y-2 rounded-xl border border-[var(--line)] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-[var(--ink-soft)]">
                      Email
                    </span>

                    <a
                      href={`mailto:${selectedCandidature.email}`}
                      className="truncate text-sm font-medium underline underline-offset-2"
                    >
                      {selectedCandidature.email}
                    </a>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-[var(--ink-soft)]">
                      Téléphone
                    </span>

                    <a
                      href={`tel:${selectedCandidature.telephone}`}
                      className="text-sm font-medium"
                    >
                      {selectedCandidature.telephone}
                    </a>
                  </div>
                </div>
              </section>

              {/* Job */}
              <section className="mt-7">
                <p className="mb-3 text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-mono-num">
                  Poste
                </p>

                <div className="rounded-xl border border-[var(--line)] p-4">
                  <p className="text-sm font-medium">
                    {selectedCandidature.reference || 'Poste non renseigné'}
                  </p>
                </div>
              </section>

              {/* Message */}
              <section className="mt-7">
                <p className="mb-3 text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-mono-num">
                  Message du candidat
                </p>

                <div className="rounded-xl border border-[var(--line)] p-4">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--ink-soft)]">
                    {selectedCandidature.message || 'Aucun message.'}
                  </p>
                </div>
              </section>

              {/* CV */}
              <section className="mt-7">
                <p className="mb-3 text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-mono-num">
                  Curriculum vitae
                </p>

                {selectedCandidature.cv ? (
                  <a
                    href={selectedCandidature.cv}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl border border-[var(--line)] p-4 transition hover:bg-[var(--line)]/30"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        Curriculum vitae
                      </p>

                      <p className="mt-1 text-xs text-[var(--ink-soft)]">
                        Ouvrir le document
                      </p>
                    </div>

                    <span className="text-sm font-medium text-[var(--accent-secondary)]">
                      Voir le CV ↗
                    </span>
                  </a>
                ) : (
                  <div className="rounded-xl border border-[var(--line)] p-4">
                    <p className="text-sm text-[var(--ink-soft)]">
                      Aucun CV fourni.
                    </p>
                  </div>
                )}
              </section>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

