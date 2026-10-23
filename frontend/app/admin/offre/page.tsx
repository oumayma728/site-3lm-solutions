'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getAllOffresAdmin, deleteOffre, updateOffre, type Offre } from '@/lib/offres';
import PageHeader from '@/components/PageHeader';
import { useToast } from '@/components/ToastProvider';

type Vue = 'actives' | 'archivees';
const TYPES = ['tous', 'emploi', 'stage'] as const;

// Ouverte (accepts applications) → Clôturée (still public, no applications) → Archivée (hidden, kept here)
function statutDe(o: Offre) {
  if (!o.actif) return { label: 'Archivée', color: 'var(--ink-soft)' };
  if (o.cloturee) return { label: 'Clôturée', color: 'var(--accent-amber)' };
  return { label: 'Ouverte', color: 'var(--accent-sage)' };
}

const COLS = 'grid grid-cols-[minmax(0,1fr)_90px_130px_100px_auto] gap-4';
const btn =
  'rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-medium transition-colors hover:border-[var(--accent-secondary)] hover:text-[var(--accent-secondary)] disabled:opacity-40';

export default function OffresListPage() {
  const toast = useToast();
  const [offres, setOffres] = useState<Offre[]>([]);
  const [loading, setLoading] = useState(true);
  const [vue, setVue] = useState<Vue>('actives');
  const [type, setType] = useState<(typeof TYPES)[number]>('tous');
  const [busySlug, setBusySlug] = useState<string | null>(null);

  useEffect(() => {
    getAllOffresAdmin()
      .then(setOffres)
      .catch(() => toast.error('Impossible de charger les offres.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const parType = useMemo(() => offres.filter((o) => type === 'tous' || o.type_offre === type), [offres, type]);
  const filtered = parType.filter((o) => (vue === 'actives' ? o.actif : !o.actif));
  const nbActives = parType.filter((o) => o.actif).length;
  const nbArchivees = parType.length - nbActives;

  const modifier = async (o: Offre, data: { actif?: boolean; cloturee?: boolean }, succes: string) => {
    setBusySlug(o.slug);
    try {
      const updated = await updateOffre(o.slug, data);
      setOffres((list) => list.map((x) => (x.slug === o.slug ? updated : x)));
      toast.success(succes);
    } catch {
      toast.error('Impossible de mettre à jour cette offre.');
    } finally {
      setBusySlug(null);
    }
  };

  const cloturer = (o: Offre) => {
    if (!window.confirm(`Clôturer « ${o.titre} » ? L’offre reste visible sur le site avec la mention « Offre clôturée », mais plus personne ne peut postuler.`)) return;
    modifier(o, { cloturee: true }, 'Offre clôturée : les candidatures sont fermées.');
  };

  const archiver = (o: Offre) => {
    if (!window.confirm(`Archiver « ${o.titre} » ? Elle disparaît du site public mais reste ici, dans l’onglet Archivées, avec ses candidatures.`)) return;
    modifier(o, { actif: false }, 'Offre archivée : retirée du site.');
  };

  const handleDelete = async (o: Offre) => {
    if (!window.confirm(`Supprimer définitivement « ${o.titre} » ? Préférez l’archivage pour garder une trace de l’offre.`)) return;
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

  return (
    <div className="mx-auto w-full px-8 py-10 max-w-7xl">
      <PageHeader
        eyebrow="Carrières & Stages"
        title="Offres"
        action={
          <div className="flex gap-2">
            <Link
              href="/admin/offre/job"
              className="btn-press flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-shadow hover:shadow-[var(--shadow-glow)]"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              <span className="text-lg leading-none">+</span> Poste
            </Link>
            <Link
              href="/admin/offre/internship"
              className="btn-press flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-sm font-medium transition-colors hover:border-[var(--accent-secondary)] hover:text-[var(--accent-secondary)]"
            >
              <span className="text-lg leading-none">+</span> Stage
            </Link>
          </div>
        }
      />

      {!loading && offres.length > 0 && (
        <div className="mb-4 flex flex-col-reverse gap-3 border-b border-[var(--line)] sm:flex-row sm:items-end sm:justify-between">
          <nav aria-label="Offres actives ou archivées" className="-mb-px flex gap-1">
            {([['actives', 'Actives', nbActives], ['archivees', 'Archivées', nbArchivees]] as const).map(([v, label, n]) => {
              const active = vue === v;
              return (
                <button
                  key={v}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setVue(v)}
                  className={`flex items-center gap-2 border-b-2 px-3.5 py-3 text-sm font-medium transition-colors ${
                    active ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]' : 'border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]'
                  }`}
                >
                  {label}
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-semibold font-mono-num"
                    style={active ? { background: 'var(--accent-primary)', color: '#fff' } : { background: 'var(--line)', color: 'var(--ink-soft)' }}
                  >
                    {n}
                  </span>
                </button>
              );
            })}
          </nav>
          <div className="mb-3 flex gap-1.5">
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  type === t ? 'bg-[var(--ink)] text-white' : 'text-[var(--ink-soft)] hover:bg-[var(--line)]/60'
                }`}
              >
                {t === 'tous' ? 'Tous types' : t === 'emploi' ? 'Postes' : 'Stages'}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-[var(--line)]/50 animate-pulse" />
          ))}
        </div>
      ) : offres.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)] p-12 text-center">
          <p className="mb-4 text-sm text-[var(--ink-soft)]">Aucune offre pour l’instant.</p>
          <div className="flex justify-center gap-2">
            <Link href="/admin/offre/job" className="rounded-lg px-4 py-2.5 text-sm font-medium text-white" style={{ backgroundColor: 'var(--accent-primary)' }}>
              Créer un poste
            </Link>
            <Link href="/admin/offre/internship" className="rounded-lg border border-[var(--line)] px-4 py-2.5 text-sm font-medium hover:border-[var(--accent-secondary)] hover:text-[var(--accent-secondary)]">
              Créer un stage
            </Link>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-6 py-10 text-center text-sm text-[var(--ink-soft)]">
          {vue === 'archivees'
            ? 'Aucune offre archivée. Une offre archivée disparaît du site mais reste consultable ici.'
            : 'Aucune offre active dans cette catégorie.'}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)]">
          <div className={`${COLS} border-b border-[var(--line)] bg-[var(--paper)] px-5 py-3 text-xs font-medium text-[var(--ink-soft)]`}>
            <span>Titre</span>
            <span>Type</span>
            <span>Département</span>
            <span>Statut</span>
            <span className="text-right">Actions</span>
          </div>
          {filtered.map((o) => {
            const s = statutDe(o);
            const busy = busySlug === o.slug;
            return (
              <div key={o.slug} className={`${COLS} items-center border-b border-[var(--line)] px-5 py-4 last:border-0`}>
                <div className="min-w-0">
                  <span className="block truncate text-sm font-medium">{o.titre}</span>
                  <span className="text-xs text-[var(--ink-soft)]">
                    {o.type_offre === 'stage' && o.programme ? (o.programme === 'ete' ? 'Stage d’été' : 'Stage PFE') : ''}
                    {o.cloturee && o.cloturee_le && ` · clôturée le ${new Date(o.cloturee_le).toLocaleDateString('fr-FR')}`}
                  </span>
                </div>
                <span className="text-sm">{o.type_offre === 'stage' ? 'Stage' : 'Poste'}</span>
                <span className="truncate text-sm text-[var(--ink-soft)]">{o.departement || '—'}</span>
                <span
                  className="inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{ color: s.color, background: `color-mix(in srgb, ${s.color} 12%, transparent)` }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
                  {s.label}
                </span>
                <div className="flex flex-wrap items-center justify-end gap-1.5">
                  {o.actif && (
                    <a href={`/public/carrieres/${o.slug}`} target="_blank" rel="noreferrer" className={btn}>
                      Voir
                    </a>
                  )}
                  {o.actif && !o.cloturee && (
                    <button type="button" className={btn} disabled={busy} onClick={() => cloturer(o)}>
                      Clôturer
                    </button>
                  )}
                  {o.actif && o.cloturee && (
                    <button type="button" className={btn} disabled={busy}
                      onClick={() => modifier(o, { cloturee: false }, 'Offre rouverte : les candidatures sont de nouveau acceptées.')}>
                      Rouvrir
                    </button>
                  )}
                  {o.actif ? (
                    <button type="button" className={btn} disabled={busy} onClick={() => archiver(o)}>
                      Archiver
                    </button>
                  ) : (
                    <button type="button" className={btn} disabled={busy}
                      onClick={() => modifier(o, { actif: true }, 'Offre restaurée : de nouveau visible sur le site.')}>
                      Restaurer
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(o)}
                    disabled={busy}
                    title="Supprimer définitivement"
                    aria-label={`Supprimer ${o.titre}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--ink-soft)] transition-colors hover:bg-[var(--accent-brick)] hover:text-white disabled:opacity-40"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6h16zM10 11v6M14 11v6" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
