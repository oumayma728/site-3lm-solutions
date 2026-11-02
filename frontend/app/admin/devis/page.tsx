'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Devis } from '@/lib/types';
import { STATUT_CONFIG } from '@/lib/status';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { formatMontant, deleteDevis } from '@/lib/devis';
import { useToast } from '@/components/ToastProvider';
import { Pagination, usePagination } from '@/components/Pagination';

const STATUT_FILTERS = ['tous', ...Object.keys(STATUT_CONFIG)];

// Client / Statut / Montant / Créé le / actions
// min-w: on phones the table scrolls sideways inside its card instead of squeezing the columns
const COLS = 'grid min-w-[640px] grid-cols-[minmax(0,1fr)_130px_130px_100px_36px] gap-4';

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub: string; color: string }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
      <div className="flex items-center gap-2">
        <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: color }} />
        <p className="text-sm font-medium text-[var(--ink-soft)]">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-semibold font-mono-num text-[var(--ink)]">{value}</p>
      <p className="mt-0.5 text-xs text-[var(--ink-soft)]">{sub}</p>
    </div>
  );
}

export default function DevisListPage() {
  const toast = useToast();
  const [devisList, setDevisList] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState<string>('tous');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (e: React.MouseEvent, id: number, clientNom?: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Supprimer définitivement le devis de ${clientNom ?? 'ce client'} ?`)) return;
    setDeletingId(id);
    try {
      await deleteDevis(id);
      setDevisList((list) => list.filter((d) => d.id !== id));
      toast.success('Devis supprimé.');
    } catch {
      toast.error('Impossible de supprimer ce devis.');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    api
      .get('/devis/')
      .then((res) => setDevisList(res.data))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  // Search only: each status tab shows how many matching devis it holds
  const matching = useMemo(() => {
    const q = search.toLowerCase();
    return devisList.filter(
      (d) => !q || d.client_nom?.toLowerCase().includes(q) || d.besoins_client.toLowerCase().includes(q) || d.numero?.toLowerCase().includes(q)
    );
  }, [devisList, search]);

  const filtered = useMemo(
    () => matching.filter((d) => statutFilter === 'tous' || d.statut === statutFilter),
    [matching, statutFilter]
  );

  const pager = usePagination(filtered, `${search}|${statutFilter}`);

  const stats = useMemo(() => {
    const enCours = devisList.filter((d) => d.statut === 'brouillon' || d.statut === 'en_attente');
    const conclus = devisList.filter((d) => d.statut === 'valide' || d.statut === 'envoye');
    const montant = conclus.reduce((sum, d) => sum + (Number(d.estimation_montant) || 0), 0);
    return { total: devisList.length, enCours: enCours.length, conclus: conclus.length, montant };
  }, [devisList]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
      <PageHeader
        eyebrow="Registre"
        title="Devis"
        action={
          <Link
            href="/admin/devis/nouveau"
            className="btn-press flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-shadow hover:shadow-[var(--shadow-glow)]"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            <span className="text-lg leading-none">+</span>
            Nouveau devis
          </Link>
        }
      />

      {loadError && (
        <div role="alert" className="mb-6 rounded-lg border px-4 py-3 text-sm" style={{ borderColor: 'var(--accent-brick)', color: 'var(--accent-brick)' }}>
          Impossible de charger les devis. Rechargez la page.
        </div>
      )}

      {!loading && devisList.length > 0 && (
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total" value={stats.total} sub="devis créés" color="var(--accent-primary)" />
          <StatCard label="En cours" value={stats.enCours} sub="brouillons et en attente" color="var(--accent-amber)" />
          <StatCard label="Validés / envoyés" value={stats.conclus} sub="prêts ou chez le client" color="var(--accent-sage)" />
          <StatCard label="Montant validé" value={formatMontant(stats.montant)} sub="total HT des devis validés et envoyés" color="var(--ink)" />
        </div>
      )}

      {!loading && devisList.length > 0 && (
        <div className="mb-4 flex flex-col-reverse gap-3 border-b border-[var(--line)] lg:flex-row lg:items-end lg:justify-between">
          <nav aria-label="Statut des devis" className="-mb-px flex gap-1 overflow-x-auto app-scroll">
            {STATUT_FILTERS.map((s) => {
              const active = statutFilter === s;
              const count = s === 'tous' ? matching.length : matching.filter((d) => d.statut === s).length;
              const color = s === 'tous' ? 'var(--accent-primary)' : STATUT_CONFIG[s].color;
              return (
                <button
                  key={s}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setStatutFilter(s)}
                  className={`flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-3 text-sm font-medium transition-colors ${
                    active ? '' : 'border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]'
                  }`}
                  style={active ? { borderColor: color, color } : undefined}
                >
                  {s === 'tous' ? 'Tous' : STATUT_CONFIG[s].label}
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-semibold font-mono-num"
                    style={active ? { background: color, color: '#fff' } : { background: 'var(--line)', color: 'var(--ink-soft)' }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un client, un besoin, un n°…"
            className="mb-3 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--accent-primary)] lg:w-80"
          />
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--line)]/50" />
          ))}
        </div>
      ) : devisList.length === 0 ? (
        !loadError && (
          <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)] p-12 text-center">
            <p className="font-medium">Aucun devis pour l’instant</p>
            <p className="mb-5 mt-1 text-sm text-[var(--ink-soft)]">
              Décrivez le besoin d’un client : l’assistant prépare le chiffrage, vous le relisez avant l’envoi.
            </p>
            <Link
              href="/admin/devis/nouveau"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              + Créer le premier devis
            </Link>
          </div>
        )
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-6 py-10 text-center text-sm text-[var(--ink-soft)]">
          Aucun devis ne correspond.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--surface)]">
          <div className={`${COLS} border-b border-[var(--line)] bg-[var(--paper)] px-5 py-3 text-xs font-medium text-[var(--ink-soft)]`}>
            <span>Client</span>
            <span>Statut</span>
            <span className="text-right">Montant HT</span>
            <span>Créé le</span>
            <span />
          </div>
          {pager.pageItems.map((devis, i) => (
            <Link
              key={devis.id}
              href={`/admin/devis/${devis.id}`}
              className={`row-in group ${COLS} items-center border-b border-[var(--line)] px-5 py-4 transition-colors last:border-0 hover:bg-[var(--paper)]`}
              style={{ animationDelay: `${Math.min(i, 10) * 25}ms` }}
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <span className="truncate group-hover:text-[var(--accent-secondary)] transition-colors">{devis.client_nom}</span>
                  {devis.numero && <span className="shrink-0 text-xs font-normal text-[var(--ink-soft)] font-mono-num">{devis.numero}</span>}
                  {!devis.synthese_ia && (
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ color: 'var(--accent-amber)', background: 'color-mix(in srgb, var(--accent-amber) 12%, transparent)' }}>
                      Chiffrage à générer
                    </span>
                  )}
                </p>
                <p className="mt-0.5 truncate text-xs text-[var(--ink-soft)]">{devis.besoins_client}</p>
              </div>
              <div>
                <StatusBadge statut={devis.statut} size="sm" />
              </div>
              <span className="text-right text-sm font-medium font-mono-num">
                {formatMontant(devis.estimation_montant, devis.devise)}
              </span>
              <span className="text-sm text-[var(--ink-soft)]">
                {new Date(devis.date_creation).toLocaleDateString('fr-FR')}
              </span>
              <button
                type="button"
                onClick={(e) => handleDelete(e, devis.id, devis.client_nom)}
                disabled={deletingId === devis.id}
                title="Supprimer ce devis"
                aria-label={`Supprimer le devis de ${devis.client_nom}`}
                className="flex h-8 w-8 items-center justify-center justify-self-end rounded-lg text-[var(--ink-soft)] opacity-60 transition hover:bg-[var(--accent-brick)] hover:text-white hover:opacity-100 disabled:opacity-30"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6h16zM10 11v6M14 11v6" />
                </svg>
              </button>
            </Link>
          ))}
        </div>
      )}

      {!loading && <Pagination {...pager} label="devis" />}
    </div>
  );
}
