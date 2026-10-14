'use client';

import { useEffect, useState } from 'react';
import {
  getAllCandidaturesAdmin, DeleteCandidatureAdmin,
  type candidature,
} from '@/lib/candidature';

import PageHeader from '@/components/PageHeader';
import { useToast } from '@/components/ToastProvider';

const TYPE_STAGE_LABELS: Record<string, string> = {
  pfe: 'Stage PFE',
  ete: 'Stage d’été',
  autre: 'Stage',
};

// Avatar colours, picked deterministically from the candidate name
const AVATAR_COLORS = [
  'var(--accent-secondary)',
  'var(--accent-primary)',
  'var(--accent-sage)',
  'var(--accent-amber)',
  'var(--ink)',
];

function avatarColor(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// "aujourd'hui", "hier", "il y a 3 jours"...
function relativeDate(iso: string) {
  const days = Math.round(
    (new Date(iso).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) /
      86_400_000
  );
  if (days > -30) {
    return new Intl.RelativeTimeFormat('fr', { numeric: 'auto' }).format(days, 'day');
  }
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// "2026-11-03" -> "03/11/2026" (parsed as a local date, no timezone shift)
function formatJour(ymd: string) {
  const [y, m, d] = ymd.split('-');
  return `${d}/${m}/${y}`;
}

// Received less than 48h ago
function isNew(iso: string) {
  return Date.now() - new Date(iso).getTime() < 48 * 3_600_000;
}

export default function CandidaturesListPage() {
  const toast = useToast();

  const [candidatures, setCandidatures] = useState<candidature[]>([]);
  const [selectedCandidature, setSelectedCandidature] =
    useState<candidature | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [poste, setPoste] = useState('');

  useEffect(() => {
    getAllCandidaturesAdmin()
      .then(setCandidatures)
      .catch(() =>
        toast.error('Impossible de charger les candidatures.')
      )
      .finally(() => setLoading(false));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDeleteCandidature(id: number) {
    try {
      await DeleteCandidatureAdmin(id);
      setCandidatures(candidatures.filter((c) => c.id !== id));
      setSelectedCandidature(null);
      toast.success('Candidature supprimée.');
    } catch {
      toast.error('Impossible de supprimer la candidature.');
    }
  }
  // Distinct postes present in the received candidatures, for the filter dropdown
  const postes = Array.from(
    new Set(candidatures.map((c) => c.reference?.trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, 'fr'));

  const filteredCandidatures = candidatures.filter((c) => {
    const query = search.toLowerCase();

    if (poste && c.reference?.trim() !== poste) return false;

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

          <div className="flex items-center gap-3">
            <select
              value={poste}
              onChange={(e) => setPoste(e.target.value)}
              aria-label="Filtrer par poste"
              className="w-56 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-sm outline-none transition focus:border-[var(--accent-secondary)]"
            >
              <option value="">Tous les postes</option>
              {postes.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

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
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredCandidatures.map((c) => (
            <article
              key={c.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedCandidature(c)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedCandidature(c);
                }
              }}
              className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-soft)] outline-none transition hover:-translate-y-0.5 hover:border-[var(--accent-secondary)]/40 hover:shadow-[var(--shadow-lift)] focus-visible:border-[var(--accent-secondary)]"
            >
              {/* Accent strip in the candidate's colour */}
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 w-1"
                style={{ background: avatarColor(c.nom) }}
              />

              {/* Header: identity + date */}
              <div className="flex items-start gap-4 p-5 pb-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white"
                  style={{ background: avatarColor(c.nom) }}
                >
                  {initials(c.nom)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-base font-semibold text-[var(--ink)]">
                      {c.nom}
                    </h2>
                    {isNew(c.created_at) && (
                      <span className="shrink-0 rounded-full bg-[var(--accent-primary)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
                        Nouveau
                      </span>
                    )}
                  </div>

                  {/* Poste — the key info for a recruiter */}
                  <span
                    className={`mt-2 inline-flex max-w-full items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${
                      c.reference
                        ? 'bg-[var(--accent-secondary)]/10 text-[var(--accent-secondary)]'
                        : 'bg-[var(--line)] text-[var(--ink-soft)]'
                    }`}
                  >
                    <svg aria-hidden width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <rect x="2" y="7" width="20" height="14" rx="2" />
                      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                    </svg>
                    <span className="truncate">
                      {c.reference || 'Poste non renseigné'}
                    </span>
                  </span>

                  {TYPE_STAGE_LABELS[c.type_stage] && (
                    <span className="mt-2 ml-1.5 inline-flex items-center rounded-lg bg-[var(--accent-amber)]/10 px-2.5 py-1 text-xs font-medium text-[var(--accent-amber)]">
                      {TYPE_STAGE_LABELS[c.type_stage]}
                    </span>
                  )}
                </div>

                <time
                  dateTime={c.created_at}
                  title={new Date(c.created_at).toLocaleString('fr-FR')}
                  className="shrink-0 text-xs text-[var(--ink-soft)] first-letter:uppercase"
                >
                  {relativeDate(c.created_at)}
                </time>
              </div>

              {/* Message preview */}
              <div className="flex-1 px-5">
                {c.message ? (
                  <p className="line-clamp-2 border-l-2 border-[var(--line)] pl-3 text-sm italic leading-6 text-[var(--ink-soft)]">
                    {c.message}
                  </p>
                ) : (
                  <p className="text-sm text-[var(--ink-soft)]/70">
                    Aucun message joint.
                  </p>
                )}
              </div>

              {/* Footer: quick actions */}
              <div className="mt-4 flex items-center gap-2 border-t border-[var(--line)] bg-[var(--paper)] px-5 py-3">
                <a
                  href={`mailto:${c.email}`}
                  onClick={(e) => e.stopPropagation()}
                  title={c.email}
                  aria-label={`Écrire à ${c.nom}`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-soft)] transition hover:border-[var(--accent-secondary)]/40 hover:text-[var(--accent-secondary)]"
                >
                  <svg aria-hidden width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-10 6L2 7" />
                  </svg>
                </a>

                {c.telephone && (
                  <a
                    href={`tel:${c.telephone}`}
                    onClick={(e) => e.stopPropagation()}
                    title={c.telephone}
                    aria-label={`Appeler ${c.nom}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-soft)] transition hover:border-[var(--accent-secondary)]/40 hover:text-[var(--accent-secondary)]"
                  >
                    <svg aria-hidden width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </a>
                )}

                {c.cv ? (
                  <a
                    href={c.cv}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex h-8 items-center gap-1.5 rounded-lg border border-[var(--accent-sage)]/30 bg-[var(--accent-sage)]/10 px-2.5 text-xs font-medium text-[var(--accent-sage)] transition hover:bg-[var(--accent-sage)]/20"
                  >
                    <svg aria-hidden width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6" />
                    </svg>
                    CV
                  </a>
                ) : (
                  <span className="flex h-8 items-center rounded-lg border border-dashed border-[var(--line)] px-2.5 text-xs text-[var(--ink-soft)]">
                    Sans CV
                  </span>
                )}

                <span className="ml-auto text-sm font-medium text-[var(--accent-secondary)] transition group-hover:translate-x-0.5">
                  Voir le profil →
                </span>
              </div>
            </article>
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

              {/* Background & availability */}
              {(selectedCandidature.ecole ||
                selectedCandidature.niveau_etude ||
                selectedCandidature.linkedin_url ||
                selectedCandidature.disponible_du) && (
                <section className="mt-7">
                  <p className="mb-3 text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-mono-num">
                    Parcours
                  </p>

                  <div className="space-y-2 rounded-xl border border-[var(--line)] p-4">
                    {[
                      ['École', selectedCandidature.ecole],
                      ['Niveau', selectedCandidature.niveau_etude],
                      [
                        'Disponibilité',
                        selectedCandidature.disponible_du &&
                          `${formatJour(selectedCandidature.disponible_du)}${
                            selectedCandidature.disponible_au
                              ? ` → ${formatJour(selectedCandidature.disponible_au)}`
                              : ''
                          }`,
                      ],
                    ]
                      .filter(([, value]) => value)
                      .map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between gap-4">
                          <span className="text-sm text-[var(--ink-soft)]">{label}</span>
                          <span className="text-right text-sm font-medium">{value}</span>
                        </div>
                      ))}

                    {selectedCandidature.linkedin_url && (
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-[var(--ink-soft)]">LinkedIn</span>
                        <a
                          href={selectedCandidature.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-sm font-medium text-[var(--accent-secondary)] underline underline-offset-2"
                        >
                          Voir le profil ↗
                        </a>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Job */}
              <section className="mt-7">
                <p className="mb-3 text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-mono-num">
                  Poste
                </p>

                <div className="rounded-xl border border-[var(--line)] p-4">
                  <p className="text-sm font-medium">
                    {selectedCandidature.reference || 'Poste non renseigné'}
                  </p>
                  {TYPE_STAGE_LABELS[selectedCandidature.type_stage] && (
                    <p className="mt-1 text-sm text-[var(--ink-soft)]">
                      {TYPE_STAGE_LABELS[selectedCandidature.type_stage]}
                    </p>
                  )}
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
              {/* Consent */}
              <section className="mt-7">
                <p className="mb-3 text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-mono-num">
                  Consentement données
                </p>

                <div className="rounded-xl border border-[var(--line)] p-4">
                  {selectedCandidature.consentement_date ? (
                    <p className="text-sm">
                      <span className="font-medium text-[var(--accent-sage)]">✓ Accepté</span>{' '}
                      <span className="text-[var(--ink-soft)]">
                        le{' '}
                        {new Date(selectedCandidature.consentement_date).toLocaleString('fr-FR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                        {selectedCandidature.consentement_version &&
                          ` (texte v${selectedCandidature.consentement_version})`}
                      </span>
                    </p>
                  ) : (
                    <p className="text-sm text-[var(--ink-soft)]">
                      Non enregistré (candidature antérieure au formulaire de consentement).
                    </p>
                  )}
                </div>
              </section>

              <div>
                <button
                  type="button"
                  onClick={() => setSelectedCandidature(null)}
                  className="mt-8 w-full rounded-lg bg-[var(--accent-secondary)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--accent-secondary-dark)]"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={() =>
                    selectedCandidature &&
                    handleDeleteCandidature(selectedCandidature.id)
                  }
                  className="mt-2 w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
                >
                  Supprimer la candidature
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

