'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { fetchClients } from '@/lib/clients';
import { fetchRendezVousList, confirmerRendezVous } from '@/lib/rendezvous';
import { formatMontant } from '@/lib/devis';
import { getAllCandidaturesAdmin, type candidature } from '@/lib/candidature';
import { Client, Devis, RendezVous } from '@/lib/types';
import { TYPE_RDV_CONFIG } from '@/lib/statusRdv';
import { STATUT_CLIENT_CONFIG } from '@/lib/statusClient';
import { useToast } from '@/components/ToastProvider';

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// "2026-11-03" -> "lun. 3 nov." (parsed as a local date, no timezone shift)
function formatJour(ymd: string) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

const TYPE_STAGE_LABELS: Record<string, string> = { pfe: 'Stage PFE', ete: 'Stage d’été', autre: 'Stage' };

const ICONS = {
  candidature: 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM19 8v6M22 11h-6',
  rdv: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
  devis: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M9 13h6M9 17h6',
  prospect: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
};

function Icon({ path, size = 18 }: { path: string; size?: number }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

function StatCard({ label, hint, value, color, icon, href }: {
  label: string; hint: string; value: number; color: string; icon: string; href: string;
}) {
  return (
    <Link
      href={href}
      className="card-hover group flex min-w-0 flex-col items-start gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:flex-row sm:gap-4 sm:p-5"
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color }}
      >
        <Icon path={icon} />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-semibold leading-none text-[var(--ink)] font-mono-num">{value}</p>
        <p className="mt-1.5 text-sm font-medium text-[var(--ink)] break-words">{label}</p>
        <p className="mt-0.5 text-xs text-[var(--ink-soft)] group-hover:text-[var(--accent-secondary)] transition-colors">
          {value > 0 ? `${hint} →` : 'Rien en attente'}
        </p>
      </div>
    </Link>
  );
}

function Panel({ title, count, href, empty, isEmpty, children }: {
  title: string; count?: number; href?: string; empty: string; isEmpty: boolean; children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-3.5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          {title}
          {!!count && (
            <span className="rounded-full bg-[var(--paper)] px-2 py-0.5 text-[11px] font-semibold text-[var(--ink-soft)] font-mono-num">
              {count}
            </span>
          )}
        </h2>
        {href && (
          <Link href={href} className="text-xs font-medium text-[var(--ink-soft)] hover:text-[var(--accent-secondary)] transition-colors">
            Tout voir →
          </Link>
        )}
      </div>
      {isEmpty ? <p className="px-5 py-8 text-center text-sm text-[var(--ink-soft)]">{empty}</p> : <div>{children}</div>}
    </section>
  );
}

const rowClass =
  'row-in flex items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-3 last:border-0 transition-colors hover:bg-[var(--paper)]';

export default function DashboardPage() {
  const toast = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [devisList, setDevisList] = useState<Devis[]>([]);
  const [rdvList, setRdvList] = useState<RendezVous[]>([]);
  const [candidatures, setCandidatures] = useState<candidature[]>([]);
  const [loading, setLoading] = useState(true);
  const [echecs, setEchecs] = useState<string[]>([]); // sections that could not be loaded
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  useEffect(() => {
    const failed: string[] = [];
    // A failed request must not look like "nothing to do": remember which part is missing
    const safe = <T,>(p: Promise<T[]>, nom: string) => p.catch(() => { failed.push(nom); return [] as T[]; });
    Promise.all([
      safe(fetchClients(), 'prospects'),
      safe(api.get('/devis/').then((r) => r.data as Devis[]), 'devis'),
      safe(fetchRendezVousList(), 'rendez-vous'),
      safe(getAllCandidaturesAdmin(), 'candidatures'),
    ]).then(([c, d, r, cand]) => {
      setClients(c);
      setDevisList(d);
      setRdvList(r);
      setCandidatures(cand);
      setEchecs(failed);
      setLoading(false);
    });
  }, []);

  const today = todayISO();

  const rdvAujourdhui = useMemo(
    () => rdvList.filter((r) => r.date_rdv === today && r.statut !== 'annule').sort((a, b) => a.heure_rdv.localeCompare(b.heure_rdv)),
    [rdvList, today]
  );
  const rdvAConfirmer = useMemo(
    () => rdvList.filter((r) => r.statut === 'demande').sort((a, b) => a.date_rdv.localeCompare(b.date_rdv)),
    [rdvList]
  );
  const devisEnAttente = useMemo(
    () => devisList.filter((d) => d.statut === 'brouillon' || d.statut === 'en_attente'),
    [devisList]
  );
  const nouveauxProspects = useMemo(
    () =>
      clients
        .filter((c) => c.statut === 'nouveau' || !c.statut)
        .sort((a, b) => (a.date_creation < b.date_creation ? 1 : -1)),
    [clients]
  );
  // Flagged "Hors critères" by the AI pre-analysis: kept apart (their own tab), not "to examine"
  const nbHorsCriteres = useMemo(
    () => candidatures.filter((c) => c.statut === 'nouvelle' && c.criteres?.hors_criteres === true).length,
    [candidatures]
  );
  const candidaturesNouvelles = useMemo(
    () => candidatures
      .filter((c) => c.statut === 'nouvelle' && c.criteres?.hors_criteres !== true)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
    [candidatures]
  );

  const aTraiter = rdvAConfirmer.length + devisEnAttente.length + candidaturesNouvelles.length + nouveauxProspects.length;

  const handleConfirmer = async (id: number) => {
    setConfirmingId(id);
    try {
      const { rendezVous } = await confirmerRendezVous(id);
      setRdvList((list) => list.map((r) => (r.id === id ? rendezVous : r)));
      toast.success('Rendez-vous confirmé.');
    } catch {
      toast.error('Impossible de confirmer ce rendez-vous.');
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
      {/* Header: date, what needs attention, quick actions */}
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--ink-soft)] first-letter:uppercase">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1 className="font-display mt-1 text-3xl">Tableau de bord</h1>
          {!loading && (
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              {aTraiter > 0
                ? `${aTraiter} élément${aTraiter > 1 ? 's demandent' : ' demande'} votre attention.`
                : 'Tout est à jour, rien en attente.'}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/admin-rdv/nouveau"
            className="btn-press rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-sm font-medium transition-colors hover:border-[var(--accent-secondary)] hover:text-[var(--accent-secondary)]"
          >
            + Rendez-vous
          </Link>
          <Link
            href="/admin/offre"
            className="btn-press rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-sm font-medium transition-colors hover:border-[var(--accent-secondary)] hover:text-[var(--accent-secondary)]"
          >
            + Offre
          </Link>
          <Link
            href="/admin/devis/nouveau"
            className="btn-press rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-shadow hover:shadow-[var(--shadow-glow)]"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            + Nouveau devis
          </Link>
        </div>
      </header>

      {echecs.length > 0 && (
        <div
          role="alert"
          className="mb-6 rounded-lg border px-4 py-3 text-sm"
          style={{ borderColor: 'var(--accent-brick)', color: 'var(--accent-brick)', background: 'color-mix(in srgb, var(--accent-brick) 6%, transparent)' }}
        >
          Impossible de charger : {echecs.join(', ')}. Les chiffres concernés peuvent être incomplets — rechargez la page.
        </div>
      )}

      {loading ? (
        <>
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-[var(--line)]/60" />)}
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="h-64 animate-pulse rounded-xl bg-[var(--line)]/60 lg:col-span-2" />
            <div className="h-64 animate-pulse rounded-xl bg-[var(--line)]/60" />
          </div>
        </>
      ) : (
        <>
          {/* Key numbers — each one opens the matching page */}
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Candidatures nouvelles" hint="À examiner" value={candidaturesNouvelles.length} color="var(--accent-primary)" icon={ICONS.candidature} href="/admin/candidature" />
            <StatCard label="RDV à confirmer" hint="À confirmer" value={rdvAConfirmer.length} color="var(--accent-amber)" icon={ICONS.rdv} href="/admin/admin-rdv" />
            <StatCard label="Devis en attente" hint="À finaliser" value={devisEnAttente.length} color="var(--accent-sage)" icon={ICONS.devis} href="/admin/devis" />
            <StatCard label="Nouveaux prospects" hint="À contacter" value={nouveauxProspects.length} color="var(--ink-soft)" icon={ICONS.prospect} href="/admin/prospects" />
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-3">
            {/* Left: everything that needs an action */}
            <div className="space-y-6 lg:col-span-2">
              <Panel
                title="Rendez-vous à confirmer"
                count={rdvAConfirmer.length}
                href="/admin/admin-rdv"
                isEmpty={rdvAConfirmer.length === 0}
                empty="Aucune demande de rendez-vous en attente."
              >
                {rdvAConfirmer.slice(0, 5).map((rdv, i) => (
                  <div key={rdv.id} className={rowClass} style={{ animationDelay: `${i * 25}ms` }}>
                    <Link href={`/admin/admin-rdv/${rdv.id}`} className="group min-w-0 flex-1">
                      <p className="flex items-center gap-2 truncate text-sm font-medium group-hover:text-[var(--accent-secondary)] transition-colors">
                        {rdv.client_nom}
                        {rdv.source === 'public' && (
                          <span className="rounded-full bg-[var(--paper)] px-2 py-0.5 text-[10px] font-medium text-[var(--ink-soft)]">
                            Demande en ligne
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--ink-soft)]">
                        {TYPE_RDV_CONFIG[rdv.type_rdv]?.label} · {formatJour(rdv.date_rdv)} à {rdv.heure_rdv?.slice(0, 5)}
                      </p>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleConfirmer(rdv.id)}
                      disabled={confirmingId === rdv.id}
                      className="btn-press shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity disabled:opacity-40"
                      style={{ background: 'var(--accent-sage)' }}
                    >
                      {confirmingId === rdv.id ? 'Confirmation…' : 'Confirmer'}
                    </button>
                  </div>
                ))}
              </Panel>

              <Panel
                title="Candidatures à examiner"
                count={candidaturesNouvelles.length}
                href="/admin/candidature"
                isEmpty={candidaturesNouvelles.length === 0}
                empty="Aucune nouvelle candidature."
              >
                {candidaturesNouvelles.slice(0, 5).map((c, i) => (
                  <Link key={c.id} href="/admin/candidature" className={`group ${rowClass}`} style={{ animationDelay: `${i * 25}ms` }}>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium group-hover:text-[var(--accent-secondary)] transition-colors">{c.nom}</p>
                      <p className="mt-0.5 truncate text-xs text-[var(--ink-soft)]">
                        {c.reference || 'Poste non renseigné'}
                        {TYPE_STAGE_LABELS[c.type_stage] ? ` · ${TYPE_STAGE_LABELS[c.type_stage]}` : ''}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-[var(--ink-soft)]">
                      {new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                  </Link>
                ))}
              </Panel>
              {nbHorsCriteres > 0 && (
                <Link
                  href="/admin/candidature"
                  className="-mt-3 block rounded-xl border border-[var(--accent-brick)]/30 bg-[var(--accent-brick)]/5 px-5 py-3 text-sm text-[var(--accent-brick)] transition-colors hover:bg-[var(--accent-brick)]/10"
                >
                  {nbHorsCriteres} candidature{nbHorsCriteres > 1 ? 's' : ''} hors critères à revoir (onglet « Hors critères ») →
                </Link>
              )}

              <Panel
                title="Devis en attente"
                count={devisEnAttente.length}
                href="/admin/devis"
                isEmpty={devisEnAttente.length === 0}
                empty="Aucun devis en attente — tout est à jour."
              >
                {devisEnAttente.slice(0, 5).map((d, i) => (
                  <Link key={d.id} href={`/admin/devis/${d.id}`} className={`group ${rowClass}`} style={{ animationDelay: `${i * 25}ms` }}>
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 truncate text-sm font-medium group-hover:text-[var(--accent-secondary)] transition-colors">
                        {d.client_nom}
                        {!d.synthese_ia && (
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ color: 'var(--accent-amber)', background: 'color-mix(in srgb, var(--accent-amber) 12%, transparent)' }}>
                            Chiffrage à générer
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--ink-soft)]">
                        Créé le {new Date(d.date_creation).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-medium font-mono-num">{formatMontant(d.estimation_montant)}</span>
                  </Link>
                ))}
              </Panel>
            </div>

            {/* Right: today's agenda and new contacts */}
            <div className="space-y-6">
              <Panel
                title="Aujourd’hui"
                count={rdvAujourdhui.length}
                isEmpty={rdvAujourdhui.length === 0}
                empty="Aucun rendez-vous prévu aujourd’hui."
              >
                {rdvAujourdhui.map((rdv, i) => (
                  <Link key={rdv.id} href={`/admin/admin-rdv/${rdv.id}`} className={`group ${rowClass} justify-start gap-4`} style={{ animationDelay: `${i * 25}ms` }}>
                    <span className="w-12 shrink-0 text-sm font-semibold font-mono-num text-[var(--accent-secondary)]">
                      {rdv.heure_rdv?.slice(0, 5)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium group-hover:text-[var(--accent-secondary)] transition-colors">{rdv.client_nom}</p>
                      <p className="text-xs text-[var(--ink-soft)]">{TYPE_RDV_CONFIG[rdv.type_rdv]?.label}</p>
                    </div>
                  </Link>
                ))}
              </Panel>

              <Panel
                title="Nouveaux prospects"
                count={nouveauxProspects.length}
                href="/admin/prospects"
                isEmpty={nouveauxProspects.length === 0}
                empty="Aucun nouveau prospect."
              >
                {nouveauxProspects.slice(0, 5).map((c, i) => (
                  <Link key={c.id} href={`/admin/${c.id}`} className={`group ${rowClass}`} style={{ animationDelay: `${i * 25}ms` }}>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium group-hover:text-[var(--accent-secondary)] transition-colors">{c.prenom} {c.nom}</p>
                      <p className="truncate text-xs text-[var(--ink-soft)]">{c.entreprise || c.email}</p>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ background: STATUT_CLIENT_CONFIG[c.statut ?? 'nouveau']?.bg, color: STATUT_CLIENT_CONFIG[c.statut ?? 'nouveau']?.color }}
                    >
                      {STATUT_CLIENT_CONFIG[c.statut ?? 'nouveau']?.label}
                    </span>
                  </Link>
                ))}
              </Panel>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
