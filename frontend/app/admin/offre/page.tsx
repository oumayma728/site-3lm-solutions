'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getAllOffresAdmin, deleteOffre, updateOffre, type Offre } from '@/lib/offres';
import PageHeader from '@/components/PageHeader';
import { useToast } from '@/components/ToastProvider';

const FILTERS = ['tous', 'emploi', 'stage'] as const;

export default function OffresListPage() {
  const toast = useToast();
  const [offres, setOffres] = useState<Offre[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('tous');
  const [busySlug, setBusySlug] = useState<string | null>(null);

  useEffect(() => {
    getAllOffresAdmin()
      .then(setOffres)
      .catch(() => toast.error('Impossible de charger les offres.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () => offres.filter((o) => filter === 'tous' || o.type_offre === filter),
    [offres, filter]
  );

  const handleDelete = async (o: Offre) => {
    if (!window.confirm(`Supprimer définitivement « ${o.titre} » ?`)) return;
    setBusySlug(o.slug);
    try {
      await deleteOffre(o.slug);
      setOffres((list) => list.filter((x) => x.slug !== o.slug));
      toast.success('Offre supprimée.');
    } catch {
      toast.error('Impossible de supprimer cette offre.');
    } finally {
      setBusySlug(null);
    }
  };

  const handleToggleActif = async (o: Offre) => {
    setBusySlug(o.slug);
    try {
      const updated = await updateOffre(o.slug, { actif: !o.actif });
      setOffres((list) => list.map((x) => (x.slug === o.slug ? updated : x)));
    } catch {
      toast.error('Impossible de mettre à jour cette offre.');
    } finally {
      setBusySlug(null);
    }
  };

  return (
    <div className="mx-auto w-full px-8 py-10 max-w-7xl">
      <PageHeader
        eyebrow="Carrières & Stages"
        title="Offres"
        action={
          <div className="flex gap-2">
            <Link
              href="/admin/offre/job"
              className="btn-press text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 hover:shadow-lg hover:-translate-y-0.5"
              style={{ backgroundColor: 'var(--accent-primary)', boxShadow: 'var(--shadow-glow)' }}
            >
              <span className="text-lg leading-none">+</span> Poste
            </Link>
            <Link
              href="/admin/offre/internship"
              className="btn-press px-5 py-2.5 rounded-full text-sm font-medium border border-[var(--line)] transition-colors hover:border-[var(--accent-secondary)] hover:text-[var(--accent-secondary)] flex items-center gap-2"
            >
              <span className="text-lg leading-none">+</span> Stage
            </Link>
          </div>
        }
      />

      {!loading && offres.length > 0 && (
        <div className="flex gap-2 mb-6">
          {FILTERS.map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className="text-xs uppercase tracking-wider font-mono-num px-3 py-2 rounded-full border transition-all duration-200"
                style={
                  active
                    ? {
                        backgroundColor: 'var(--accent-primary)',
                        color: '#fff',
                        borderColor: 'transparent',
                      }
                    : { borderColor: 'var(--line)' }
                }
              >
                {f === 'tous' ? 'Toutes' : f === 'emploi' ? 'Postes' : 'Stages'}
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-[var(--line)]/50 animate-pulse" />
          ))}
        </div>
      ) : offres.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--line)] p-12 text-center bg-[var(--surface)]">
          <p className="text-[var(--ink-soft)] text-sm mb-4">Aucune offre pour l&apos;instant.</p>
          <div className="flex gap-2 justify-center">
            <Link
              href="/admin/offre/job"
              className="inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              Créer un poste
            </Link>
            <Link
              href="/admin/offre/internship"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium border border-[var(--line)] hover:border-[var(--accent-secondary)] hover:text-[var(--accent-secondary)] transition-colors"
            >
              Créer un stage
            </Link>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-[var(--ink-soft)]">Aucune offre dans cette catégorie.</p>
      ) : (
        <div className="rounded-2xl bg-[var(--surface)] border border-[var(--line)] overflow-hidden">
          <div className="grid grid-cols-[1fr_100px_120px_90px_70px_36px] px-5 py-3 text-[11px] uppercase tracking-wider text-[var(--ink-soft)] border-b border-[var(--line)] font-mono-num">
            <span>Titre</span>
            <span>Type</span>
            <span>Département</span>
            <span>Statut</span>
            <span />
            <span />
          </div>
          {filtered.map((o) => (
            <div
              key={o.slug}
              className="grid grid-cols-[1fr_100px_120px_90px_70px_36px] px-5 py-4 items-center border-b border-[var(--line)] last:border-0"
            >
              <div className="min-w-0 pr-4">
                <span className="font-medium text-sm block truncate">{o.titre}</span>
                {o.type_offre === 'stage' && o.programme && (
                  <span className="text-[11px] text-[var(--ink-soft)]">
                    {o.programme === 'ete' ? "Stage d'été" : 'Stage PFE'}
                  </span>
                )}
              </div>
              <span className="text-sm capitalize">{o.type_offre}</span>
              <span className="text-sm text-[var(--ink-soft)] truncate">{o.departement || '—'}</span>
              <button
                type="button"
                onClick={() => handleToggleActif(o)}
                disabled={busySlug === o.slug}
                className="justify-self-start text-xs font-medium px-2.5 py-1 rounded-full transition-colors disabled:opacity-40"
                style={
                  o.actif
                    ? { background: 'rgba(46,196,110,0.12)', color: 'var(--accent-sage)' }
                    : { background: 'rgba(26,26,46,0.06)', color: 'var(--ink-soft)' }
                }
              >
                {o.actif ? 'Publiée' : 'Masquée'}
              </button>
              <a
                href={`/public/carrieres/${o.slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[var(--ink-soft)] hover:text-[var(--accent-primary)] transition-colors"
              >
                Voir →
              </a>
              <button
                type="button"
                onClick={() => handleDelete(o)}
                disabled={busySlug === o.slug}
                title="Supprimer cette offre"
                className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--ink-soft)] hover:text-white hover:bg-[var(--accent-brick)] transition-colors disabled:opacity-40 justify-self-end"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6h16zM10 11v6M14 11v6" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
