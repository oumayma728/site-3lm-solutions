'use client';

import { useEffect, useState } from 'react';
import {
  getAllCandidaturesAdmin, DeleteCandidatureAdmin, accepterCandidature, refuserCandidature, openCandidatureCv,
  analyserCandidature, getCriteresTri, updateCriteresTri, type CriteresTri,
  type candidature,
} from '@/lib/candidature';

import PageHeader from '@/components/PageHeader';
import { useToast } from '@/components/ToastProvider';
import { Pagination, usePagination } from '@/components/Pagination';

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

// ── Filters ─────────────────────────────────────────────────────────────

// Same order as NIVEAU_ETUDE_CHOICES in the backend; unknown values go last
const NIVEAU_ORDER = [
  'Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2',
  'Cycle ingénieur 1', 'Cycle ingénieur 2', 'Cycle ingénieur 3', 'Autre',
];
const SANS_NIVEAU = ''; // candidatures with no study level

type Periode = 'all' | 'semaine' | 'mois' | 'mois_prochain' | 'custom';
type EnvoiFiltre = 'all' | 'a_traiter' | 'hors_criteres' | 'envoyees' | 'a_renvoyer' | 'refusees';

// Local date as YYYY-MM-DD (the API's disponible_du has the same format, so strings compare correctly)
function ymd(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// [first day, last day] of the chosen period; the week runs Monday to Sunday
function periodeRange(periode: Periode, du: string, au: string): [string, string] | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (periode === 'semaine') {
    const start = new Date(today);
    start.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return [ymd(start), ymd(end)];
  }
  if (periode === 'mois' || periode === 'mois_prochain') {
    const offset = periode === 'mois' ? 0 : 1;
    return [
      ymd(new Date(today.getFullYear(), today.getMonth() + offset, 1)),
      ymd(new Date(today.getFullYear(), today.getMonth() + offset + 1, 0)),
    ];
  }
  if (periode === 'custom' && (du || au)) return [du || '0000-01-01', au || '9999-12-31'];
  return null;
}

function alreadySent(c: candidature) {
  return !!c.crm_envoye_le;
}

// Status tabs: where each candidature stands in the pre-selection / CRM pipeline.
// "Hors critères" is set apart at the end: those candidatures appear ONLY there.
const STATUT_TABS: { value: EnvoiFiltre; label: string; color: string }[] = [
  { value: 'all', label: 'Toutes', color: 'var(--ink)' },
  { value: 'a_traiter', label: 'Nouvelles', color: 'var(--accent-secondary)' },
  { value: 'a_renvoyer', label: 'À renvoyer au CRM', color: 'var(--accent-amber)' },
  { value: 'envoyees', label: 'Envoyées au CRM', color: 'var(--accent-sage)' },
  { value: 'refusees', label: 'Refusées', color: 'var(--accent-brick)' },
  { value: 'hors_criteres', label: 'Hors critères', color: 'var(--accent-brick)' },
];

// Flagged by the AI pre-analysis and still undecided: kept apart, in the "Hors critères" tab only.
// They leave it when a person decides (refused → Refusées, sent to the CRM → Envoyées) or when the
// criteria are relaxed (back to Nouvelles).
function estHorsCriteres(c: candidature) {
  return c.statut === 'nouvelle' && c.criteres?.hors_criteres === true;
}

function matchesStatut(c: candidature, tab: EnvoiFiltre) {
  if (tab === 'hors_criteres') return estHorsCriteres(c);
  if (estHorsCriteres(c)) return false;   // not in "Toutes" nor "Nouvelles"
  if (tab === 'a_traiter') return c.statut === 'nouvelle';
  if (tab === 'envoyees') return alreadySent(c);
  if (tab === 'a_renvoyer') return c.statut === 'preselectionnee' && !alreadySent(c);
  if (tab === 'refusees') return c.statut === 'refusee';
  return true;
}

// Short summary of the AI pre-analysis, for the card
function resumeAnalyse(c: candidature): { texte: string; titre?: string; couleur: string } | null {
  switch (c.analyse_statut) {
    case 'ok': {
      const nbProjets = c.analyse.nb_projets ?? 0;
      return {
        texte: c.criteres?.raison || `${nbProjets} projet(s)`,
        titre: c.analyse.resume,
        couleur: c.criteres?.hors_criteres ? 'var(--accent-brick)' : 'var(--ink-soft)',
      };
    }
    case 'en_cours': return { texte: 'Analyse IA en cours…', couleur: 'var(--ink-soft)' };
    case 'non_analysable': return { texte: 'CV non analysable', titre: c.analyse_erreur, couleur: 'var(--ink-soft)' };
    case 'erreur': return { texte: 'Analyse IA en échec', titre: c.analyse_erreur, couleur: 'var(--accent-amber)' };
    default: return null;
  }
}

function formatDateHeure(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

export default function CandidaturesListPage() {
  const toast = useToast();

  const [candidatures, setCandidatures] = useState<candidature[]>([]);
  const [selectedCandidature, setSelectedCandidature] =
    useState<candidature | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [poste, setPoste] = useState('');
  const [accepting, setAccepting] = useState(false);
  // Refusal confirmation panel in the drawer (null = closed)
  const [refus, setRefus] = useState<{ id: number; envoyerEmail: boolean; enCours: boolean } | null>(null);

  // Filters and bulk selection
  const [niveaux, setNiveaux] = useState<string[]>([]); // empty = every level
  const [periode, setPeriode] = useState<Periode>('all');
  const [du, setDu] = useState('');
  const [au, setAu] = useState('');
  const [envoi, setEnvoi] = useState<EnvoiFiltre>('all');
  const [selection, setSelection] = useState<Set<number>>(new Set());
  const [bulk, setBulk] = useState<{ done: number; total: number } | null>(null);

  // AI pre-analysis: thresholds of the "Hors critères" flag, and running analyses
  const [criteres, setCriteres] = useState<CriteresTri | null>(null);
  const [brouillonCriteres, setBrouillonCriteres] = useState<{ min_competences: string; min_projets: string } | null>(null);
  const [analyseEnCours, setAnalyseEnCours] = useState<Set<number>>(new Set());
  const [bulkAnalyse, setBulkAnalyse] = useState<{ done: number; total: number } | null>(null);
  const [bulkRefus, setBulkRefus] = useState<{ done: number; total: number } | null>(null);
  const [emailRefusGroupe, setEmailRefusGroupe] = useState(true);

  useEffect(() => {
    getAllCandidaturesAdmin()
      .then(setCandidatures)
      .catch(() =>
        toast.error('Impossible de charger les candidatures.')
      )
      .finally(() => setLoading(false));
    getCriteresTri().then(setCriteres).catch(() => setCriteres(null));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function remplacer(updated: candidature) {
    setCandidatures((list) => list.map((c) => (c.id === updated.id ? updated : c)));
    setSelectedCandidature((s) => (s && s.id === updated.id ? updated : s));
  }

  async function handleAnalyser(id: number) {
    setAnalyseEnCours((s) => new Set(s).add(id));
    try {
      const updated = await analyserCandidature(id);
      remplacer(updated);
      if (updated.analyse_statut === 'ok') toast.success('Analyse terminée.');
      else toast.error(updated.analyse_erreur || 'Analyse impossible.');
    } catch {
      toast.error('Impossible de lancer l’analyse.');
    } finally {
      setAnalyseEnCours((s) => { const n = new Set(s); n.delete(id); return n; });
    }
  }

  // Undecided candidatures with a CV that were never analysed (or failed): analyse them one by one
  // …and those analysed before project relevance was assessed (they need a re-run to use it)
  const nonAnalysees = candidatures.filter(
    (c) => c.statut === 'nouvelle' && c.has_cv && (
      c.analyse_statut === '' || c.analyse_statut === 'erreur'
      || (c.analyse_statut === 'ok' && c.analyse?.nb_projets_pertinents === undefined)
    )
  );

  async function handleAnalyserNonAnalysees() {
    const ids = nonAnalysees.map((c) => c.id);
    if (ids.length === 0) return;
    let ok = 0;
    setBulkAnalyse({ done: 0, total: ids.length });
    for (const [i, id] of ids.entries()) {
      try {
        const updated = await analyserCandidature(id);
        remplacer(updated);
        if (updated.analyse_statut === 'ok') ok++;
      } catch { /* the row keeps its state; counted below */ }
      setBulkAnalyse({ done: i + 1, total: ids.length });
    }
    setBulkAnalyse(null);
    if (ok === ids.length) toast.success(`${ok} candidature(s) analysée(s).`);
    else toast.error(`${ok} analysée(s) sur ${ids.length}. Ouvrez les autres pour voir la raison.`);
  }

  async function handleSaveCriteres() {
    if (!brouillonCriteres) return;
    try {
      const saved = await updateCriteresTri({
        min_competences: Number(brouillonCriteres.min_competences),
        min_projets: Number(brouillonCriteres.min_projets),
      });
      setCriteres(saved);
      setBrouillonCriteres(null);
      // the flag is computed by the server from the current thresholds: reload the list
      setCandidatures(await getAllCandidaturesAdmin());
      toast.success('Critères enregistrés.');
    } catch {
      toast.error('Critères invalides (nombres entre 0 et 20).');
    }
  }

  async function handleToggleAnalyseAuto() {
    if (!criteres) return;
    try {
      setCriteres(await updateCriteresTri({ analyse_auto: !criteres.analyse_auto }));
    } catch {
      toast.error('Impossible de modifier ce réglage.');
    }
  }

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
  async function handleOpenCv(c: candidature) {
    try {
      await openCandidatureCv(c.id, c.cv_nom_original);
    } catch {
      toast.error('Impossible de télécharger le CV.');
    }
  }

  async function handleRefuser(id: number, envoyerEmail: boolean) {
    setRefus({ id, envoyerEmail, enCours: true });
    try {
      const { candidature: updated, email_envoye, message } = await refuserCandidature(id, envoyerEmail);
      setCandidatures((list) => list.map((c) => (c.id === id ? updated : c)));
      setSelectedCandidature(updated);
      setSelection((s) => { const next = new Set(s); next.delete(id); return next; });
      if (!envoyerEmail || email_envoye) toast.success(message);
      else toast.error(message);
      setRefus(null);
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(detail || 'Impossible de refuser cette candidature.');
      setRefus({ id, envoyerEmail, enCours: false });
    }
  }

  // First acceptance: pre-select and send to the CRM for analysis
  async function handleAccepter(id: number) {
    setAccepting(true);
    try {
      const { candidature: updated, crm_ok, message } = await accepterCandidature(id);
      setCandidatures((list) => list.map((c) => (c.id === id ? updated : c)));
      setSelectedCandidature(updated);
      if (crm_ok) toast.success(message);
      else toast.error(`Candidature acceptée, mais pas envoyée au CRM. ${message}`);
    } catch {
      toast.error('Impossible d’accepter la candidature.');
    } finally {
      setAccepting(false);
    }
  }
  // Distinct postes present in the received candidatures, for the filter dropdown
  const postes = Array.from(
    new Set(candidatures.map((c) => c.reference?.trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, 'fr'));

  // Study levels present in the received candidatures, with how many of each
  const niveauxDisponibles = Array.from(
    candidatures.reduce((acc, c) => {
      const n = c.niveau_etude || SANS_NIVEAU;
      return acc.set(n, (acc.get(n) ?? 0) + 1);
    }, new Map<string, number>())
  ).sort(([a], [b]) => {
    const rank = (n: string) => (n === SANS_NIVEAU ? 99 : NIVEAU_ORDER.indexOf(n) === -1 ? 98 : NIVEAU_ORDER.indexOf(n));
    return rank(a) - rank(b);
  });

  const range = periodeRange(periode, du, au);
  const filtersActive = niveaux.length > 0 || !!range;

  function resetFilters() {
    setNiveaux([]);
    setPeriode('all');
    setDu('');
    setAu('');
  }

  function toggleNiveau(n: string) {
    setNiveaux((list) => (list.includes(n) ? list.filter((x) => x !== n) : [...list, n]));
  }

  // Every filter except the status tab, so each tab can show how many candidatures it holds
  const matchingCandidatures = candidatures.filter((c) => {
    const query = search.toLowerCase();

    if (poste && c.reference?.trim() !== poste) return false;
    if (niveaux.length > 0 && !niveaux.includes(c.niveau_etude || SANS_NIVEAU)) return false;
    if (range && !(c.disponible_du && c.disponible_du >= range[0] && c.disponible_du <= range[1])) return false;

    return (
      c.nom.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query) ||
      c.reference?.toLowerCase().includes(query)
    );
  });

  const filteredCandidatures = matchingCandidatures.filter((c) => matchesStatut(c, envoi));

  // Pages only change what is displayed: "select all" and the counts still cover every page
  const pager = usePagination(
    filteredCandidatures,
    [search, poste, niveaux.join(','), range?.join('~') ?? '', envoi].join('|'),
  );

  // ── Refuse the flagged candidatures (Hors critères tab): a person reviews the list, then confirms ──
  const horsCriteres = envoi === 'hors_criteres' ? filteredCandidatures : [];

  async function handleRefuserHorsCriteres() {
    const ids = horsCriteres.map((c) => c.id);
    if (ids.length === 0) return;
    const avecEmail = emailRefusGroupe ? ' et prévenir chaque candidat par e-mail' : ' sans envoyer d’e-mail';
    if (!window.confirm(`Refuser ${ids.length} candidature(s) hors critères${avecEmail} ? Vérifiez la liste avant de confirmer.`)) return;
    let ok = 0;
    let emailsKo = 0;
    setBulkRefus({ done: 0, total: ids.length });
    for (const [i, id] of ids.entries()) {
      try {
        const res = await refuserCandidature(id, emailRefusGroupe);
        remplacer(res.candidature);
        ok++;
        if (emailRefusGroupe && !res.email_envoye) emailsKo++;
      } catch { /* already refused / sent to the CRM meanwhile: left as is */ }
      setBulkRefus({ done: i + 1, total: ids.length });
    }
    setBulkRefus(null);
    if (ok === ids.length && emailsKo === 0) toast.success(`${ok} candidature(s) refusée(s).`);
    else toast.error(`${ok}/${ids.length} refusée(s)${emailsKo ? `, ${emailsKo} e-mail(s) non envoyé(s)` : ''}.`);
  }

  // ── Bulk send ──
  // "Select all" picks the visible candidatures the CRM has not received yet. Anything hidden by a
  // filter is never part of the selection that gets sent.
  // Refused candidatures are never sent to the CRM
  const envoyables = filteredCandidatures.filter((c) => !alreadySent(c) && c.statut !== 'refusee');
  const aEnvoyer = filteredCandidatures.filter((c) => selection.has(c.id));
  const toutSelectionne = envoyables.length > 0 && envoyables.every((c) => selection.has(c.id));

  function toggleOne(id: number) {
    setSelection((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelection((s) => {
      const next = new Set(s);
      for (const c of envoyables) {
        if (toutSelectionne) next.delete(c.id);
        else next.add(c.id);
      }
      return next;
    });
  }

  async function handleBulkSend() {
    const ids = aEnvoyer.map((c) => c.id);
    if (ids.length === 0) return;
    if (!window.confirm(`Accepter ${ids.length} candidature(s) et les envoyer au CRM pour analyse ?`)) return;

    const sent = new Set<number>();
    let lastError = ''; // the CRM's reason, shown with the summary (e.g. "Le CRM est injoignable")
    let inARow = 0;
    let done = 0;
    setBulk({ done: 0, total: ids.length });
    for (const id of ids) {
      try {
        const res = await accepterCandidature(id);
        setCandidatures((list) => list.map((c) => (c.id === id ? res.candidature : c)));
        if (res.crm_ok) {
          sent.add(id);
          inARow = 0;
        } else {
          lastError = res.message;
          inARow++;
        }
      } catch {
        lastError = 'Erreur du serveur du site.';
        inARow++;
      }
      done++;
      setBulk({ done, total: ids.length });
      // A broken connection fails every time: stop instead of hammering the CRM
      if (inARow >= 3 && done < ids.length) {
        toast.error('Envoi interrompu après 3 échecs de suite : vérifiez la connexion au CRM.');
        break;
      }
    }
    setBulk(null);
    setSelection(new Set(ids.filter((id) => !sent.has(id)))); // keep the ones to retry selected
    if (sent.size === ids.length) toast.success(`${sent.size} candidature(s) envoyée(s) au CRM.`);
    else toast.error(`${sent.size} envoyée(s) au CRM, ${ids.length - sent.size} à renvoyer.${lastError ? ` ${lastError}` : ''}`);
  }

  return (
    <div className="mx-auto w-full px-4 py-6 sm:px-8 sm:py-10 max-w-7xl">
      <PageHeader
        eyebrow="Recrutement"
        title="Candidatures"
      />

      {/* Header / search */}
      {!loading && candidatures.length > 0 && (
        <div className="mt-8 mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div>
            <p className="text-sm text-[var(--ink-soft)]">
              {candidatures.length}{' '}
              {candidatures.length === 1
                ? 'candidature reçue'
                : 'candidatures reçues'}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={poste}
              onChange={(e) => setPoste(e.target.value)}
              aria-label="Filtrer par poste"
              className="w-full sm:w-56 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-sm outline-none transition focus:border-[var(--accent-secondary)]"
            >
              <option value="">Tous les postes</option>
              {postes.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <div className="relative w-full sm:w-72">
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

      {/* Status tabs */}
      {!loading && candidatures.length > 0 && (
        <nav
          aria-label="Statut des candidatures"
          className="mb-6 flex gap-1 overflow-x-auto border-b border-[var(--line)] app-scroll"
        >
          {STATUT_TABS.map((tab) => {
            const active = envoi === tab.value;
            const count = matchingCandidatures.filter((c) => matchesStatut(c, tab.value)).length;
            return (
              <button
                key={tab.value}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => setEnvoi(tab.value)}
                className={`relative -mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  active ? '' : 'border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]'
                } ${tab.value === 'hors_criteres' ? 'ml-auto' : ''}`}
                style={active ? { borderColor: tab.color, color: tab.color } : undefined}
              >
                {tab.value !== 'all' && (
                  <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: tab.color }} />
                )}
                {tab.label}
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-semibold font-mono-num"
                  style={
                    active
                      ? { background: tab.color, color: '#fff' }
                      : { background: 'var(--line)', color: 'var(--ink-soft)' }
                  }
                >
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
      )}

      {/* Filters */}
      {!loading && candidatures.length > 0 && (
        <div className="mb-6 space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-mono-num">
              Niveau d’études (plusieurs choix possibles)
            </p>
            <div className="flex flex-wrap gap-2">
              {niveauxDisponibles.map(([n, count]) => {
                const on = niveaux.includes(n);
                return (
                  <button
                    key={n || 'sans-niveau'}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleNiveau(n)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                      on
                        ? 'border-[var(--accent-secondary)] bg-[var(--accent-secondary)]/10 text-[var(--accent-secondary)]'
                        : 'border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--accent-secondary)]/40'
                    }`}
                  >
                    {n || 'Non renseigné'} <span className="opacity-60">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-mono-num">
              Date de début de stage
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {([
                ['all', 'Toutes'],
                ['semaine', 'Cette semaine'],
                ['mois', 'Ce mois-ci'],
                ['mois_prochain', 'Le mois prochain'],
                ['custom', 'Période…'],
              ] as [Periode, string][]).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={periode === value}
                  onClick={() => setPeriode(value)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    periode === value
                      ? 'border-[var(--accent-secondary)] bg-[var(--accent-secondary)]/10 text-[var(--accent-secondary)]'
                      : 'border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--accent-secondary)]/40'
                  }`}
                >
                  {label}
                </button>
              ))}
              {periode === 'custom' && (
                <>
                  <input
                    type="date"
                    value={du}
                    onChange={(e) => setDu(e.target.value)}
                    aria-label="Début de la période"
                    className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-xs outline-none focus:border-[var(--accent-secondary)]"
                  />
                  <span className="text-xs text-[var(--ink-soft)]">→</span>
                  <input
                    type="date"
                    value={au}
                    onChange={(e) => setAu(e.target.value)}
                    aria-label="Fin de la période"
                    className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-xs outline-none focus:border-[var(--accent-secondary)]"
                  />
                </>
              )}
            </div>
            {range && (
              <p className="mt-2 text-xs text-[var(--ink-soft)]">
                Début de stage{' '}
                {range[0] === '0000-01-01'
                  ? `jusqu’au ${formatJour(range[1])}`
                  : range[1] === '9999-12-31'
                    ? `à partir du ${formatJour(range[0])}`
                    : `entre le ${formatJour(range[0])} et le ${formatJour(range[1])}`}
                . Les candidatures sans date de début sont masquées.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {filtersActive && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-sm font-medium text-[var(--accent-secondary)] underline underline-offset-2"
              >
                Réinitialiser les filtres
              </button>
            )}
            <span className="ml-auto text-xs text-[var(--ink-soft)]">
              {filteredCandidatures.length} / {candidatures.length} candidature(s)
            </span>
          </div>
        </div>
      )}

      {/* AI pre-analysis: criteria, analyse the backlog, and (Hors critères tab) refuse the flagged ones */}
      {!loading && candidatures.length > 0 && (
        <div className="mb-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 text-sm">
              <p className="font-medium">Pré-analyse IA des CV</p>
              {criteres && !brouillonCriteres && (
                <p className="mt-0.5 text-[var(--ink-soft)]">
                  « Hors critères » = moins de <strong className="text-[var(--ink)]">{criteres.min_competences}</strong> compétence(s) de l’offre
                  {' '}<strong className="text-[var(--ink)]">et</strong> moins de <strong className="text-[var(--ink)]">{criteres.min_projets}</strong> projet(s) pertinent(s) (qui utilisent les compétences ou le domaine de l’offre).
                  {' '}<button type="button" className="underline underline-offset-2 hover:text-[var(--accent-secondary)]"
                    onClick={() => setBrouillonCriteres({ min_competences: String(criteres.min_competences), min_projets: String(criteres.min_projets) })}>
                    Modifier
                  </button>
                </p>
              )}
              {brouillonCriteres && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[var(--ink-soft)]">
                  Moins de
                  <input type="number" min={0} max={20} value={brouillonCriteres.min_competences}
                    onChange={(e) => setBrouillonCriteres({ ...brouillonCriteres, min_competences: e.target.value })}
                    className="w-16 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2 py-1 text-[var(--ink)]" />
                  compétence(s) <strong className="text-[var(--ink)]">et</strong> moins de
                  <input type="number" min={0} max={20} value={brouillonCriteres.min_projets}
                    onChange={(e) => setBrouillonCriteres({ ...brouillonCriteres, min_projets: e.target.value })}
                    className="w-16 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2 py-1 text-[var(--ink)]" />
                  projet(s) pertinent(s)
                  <button type="button" onClick={handleSaveCriteres}
                    className="rounded-lg bg-[var(--accent-primary)] px-3 py-1 text-xs font-medium text-white">Enregistrer</button>
                  <button type="button" onClick={() => setBrouillonCriteres(null)} className="text-xs">Annuler</button>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {criteres && (
                <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--ink-soft)]">
                  <input type="checkbox" checked={criteres.analyse_auto} onChange={handleToggleAnalyseAuto} />
                  Analyser automatiquement à la réception
                </label>
              )}
              <button
                type="button"
                disabled={nonAnalysees.length === 0 || !!bulkAnalyse}
                onClick={handleAnalyserNonAnalysees}
                className="rounded-lg border border-[var(--line)] px-3 py-2 text-xs font-medium transition hover:border-[var(--accent-secondary)] hover:text-[var(--accent-secondary)] disabled:opacity-40"
              >
                {bulkAnalyse ? `Analyse ${bulkAnalyse.done}/${bulkAnalyse.total}…` : `Analyser les non analysées / à mettre à jour (${nonAnalysees.length})`}
              </button>
            </div>
          </div>

          {envoi === 'hors_criteres' && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
              <p className="max-w-xl text-sm text-[var(--ink-soft)]">
                Ces candidatures ne correspondent pas aux critères selon l’analyse IA. <strong className="text-[var(--ink)]">Rien n’est refusé
                automatiquement</strong> : parcourez la liste (ouvrez un profil en cas de doute), puis refusez-les en une fois.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" checked={emailRefusGroupe} onChange={(e) => setEmailRefusGroupe(e.target.checked)} />
                  Prévenir par e-mail
                </label>
                <button
                  type="button"
                  disabled={horsCriteres.length === 0 || !!bulkRefus}
                  onClick={handleRefuserHorsCriteres}
                  className="rounded-lg bg-[var(--accent-brick)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
                >
                  {bulkRefus ? `Refus ${bulkRefus.done}/${bulkRefus.total}…` : `Refuser ces ${horsCriteres.length} candidature(s)`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bulk send */}
      {!loading && filteredCandidatures.length > 0 && envoi !== 'hors_criteres' && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={toutSelectionne}
              disabled={envoyables.length === 0 || !!bulk}
              onChange={toggleAll}
            />
            Tout sélectionner ({envoyables.length} pas encore envoyée{envoyables.length > 1 ? 's' : ''} au CRM)
          </label>
          <div className="flex items-center gap-3">
            {bulk && (
              <span className="text-sm text-[var(--ink-soft)]">
                Envoi {bulk.done}/{bulk.total}…
              </span>
            )}
            <button
              type="button"
              disabled={aEnvoyer.length === 0 || !!bulk}
              onClick={handleBulkSend}
              className="rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Accepter et envoyer {aEnvoyer.length > 0 ? `${aEnvoyer.length} ` : ''}au CRM
            </button>
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
            {matchingCandidatures.length > 0
              ? 'Aucune candidature dans cet onglet.'
              : 'Aucun candidat ne correspond à votre recherche.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {pager.pageItems.map((c) => (
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
                    {isNew(c.created_at) && c.statut === 'nouvelle' && (
                      <span className="shrink-0 rounded-full bg-[var(--accent-primary)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
                        Nouveau
                      </span>
                    )}
                    {c.statut === 'preselectionnee' && (
                      <span
                        title={c.crm_erreur || undefined}
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          c.crm_envoye_le
                            ? 'bg-[var(--accent-sage)]/10 text-[var(--accent-sage)]'
                            : 'bg-[var(--accent-amber)]/10 text-[var(--accent-amber)]'
                        }`}
                      >
                        {c.crm_envoye_le ? 'Envoyée au CRM' : 'À renvoyer au CRM'}
                      </span>
                    )}
                    {c.statut === 'nouvelle' && c.criteres?.hors_criteres && (
                      <span
                        title={c.criteres.raison}
                        className="shrink-0 rounded-full bg-[var(--accent-brick)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-brick)]"
                      >
                        Hors critères
                      </span>
                    )}
                    {c.statut === 'refusee' && (
                      <span className="shrink-0 rounded-full bg-[var(--accent-brick)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-brick)]">
                        Refusée
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

              {/* AI pre-analysis summary */}
              {(() => {
                const r = resumeAnalyse(c);
                return r ? (
                  <p className="-mt-1 mb-3 px-5 text-xs font-medium" style={{ color: r.couleur }} title={r.titre}>
                    ✦ {r.texte}
                  </p>
                ) : null;
              })()}

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
                <input
                  type="checkbox"
                  checked={selection.has(c.id)}
                  disabled={c.statut === 'refusee'}
                  onChange={() => toggleOne(c.id)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Sélectionner ${c.nom}`}
                  title={c.statut === 'refusee' ? 'Candidature refusée' : 'Sélectionner pour l’envoi au CRM'}
                  className="mr-1 h-4 w-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
                />
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

                {c.has_cv ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenCv(c);
                    }}
                    title={c.cv_nom_original || 'Télécharger le CV'}
                    className="flex h-8 items-center gap-1.5 rounded-lg border border-[var(--accent-sage)]/30 bg-[var(--accent-sage)]/10 px-2.5 text-xs font-medium text-[var(--accent-sage)] transition hover:bg-[var(--accent-sage)]/20"
                  >
                    <svg aria-hidden width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6" />
                    </svg>
                    CV
                  </button>
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

      {!loading && <Pagination {...pager} label="candidatures" />}

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

                {selectedCandidature.has_cv ? (
                  <button
                    type="button"
                    onClick={() => handleOpenCv(selectedCandidature)}
                    className="flex w-full items-center justify-between rounded-xl border border-[var(--line)] p-4 text-left transition hover:bg-[var(--line)]/30"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        Curriculum vitae
                      </p>

                      <p className="mt-1 truncate text-xs text-[var(--ink-soft)]">
                        {selectedCandidature.cv_nom_original || 'Télécharger le document'}
                      </p>
                    </div>

                    <span className="shrink-0 text-sm font-medium text-[var(--accent-secondary)]">
                      Télécharger ↓
                    </span>
                  </button>
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

              {/* AI pre-analysis: facts to help sort; the decision stays with a person */}
              <section className="mt-7">
                <p className="mb-3 text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-mono-num">
                  Pré-analyse IA du CV
                </p>
                <div className="rounded-xl border border-[var(--line)] p-4 text-sm">
                  {selectedCandidature.analyse_statut === 'ok' ? (
                    <div className="space-y-3">
                      {selectedCandidature.criteres?.hors_criteres !== null && (
                        <p className={`font-medium ${selectedCandidature.criteres.hors_criteres ? 'text-[var(--accent-brick)]' : 'text-[var(--accent-sage)]'}`}>
                          {selectedCandidature.criteres.hors_criteres ? '✕ Hors critères' : '✓ Correspond aux critères'}
                          <span className="font-normal text-[var(--ink-soft)]"> · {selectedCandidature.criteres.raison}</span>
                        </p>
                      )}
                      {selectedCandidature.criteres?.hors_criteres === null && selectedCandidature.criteres.raison && (
                        <p className="text-[var(--ink-soft)]">{selectedCandidature.criteres.raison}</p>
                      )}
                      {selectedCandidature.analyse.resume && <p className="text-[var(--ink-soft)]">{selectedCandidature.analyse.resume}</p>}
                      <div>
                        <p className="mb-1 text-xs text-[var(--ink-soft)]">Compétences de l’offre trouvées dans le CV</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(selectedCandidature.analyse.competences ?? []).length > 0
                            ? selectedCandidature.analyse.competences!.map((s) => (
                                <span key={s} className="rounded-md bg-[var(--accent-sage)]/10 px-2 py-0.5 text-xs font-medium text-[var(--accent-sage)]">{s}</span>
                              ))
                            : <span className="text-xs text-[var(--ink-soft)]">Aucune</span>}
                        </div>
                      </div>
                      {(selectedCandidature.analyse.technologies ?? []).length > 0 && (
                        <div>
                          <p className="mb-1 text-xs text-[var(--ink-soft)]">Technologies mentionnées</p>
                          <p className="text-xs">{selectedCandidature.analyse.technologies!.join(' · ')}</p>
                        </div>
                      )}
                      <div>
                        <p className="mb-1 text-xs text-[var(--ink-soft)]">
                          Projets repérés ({selectedCandidature.analyse.nb_projets ?? 0}
                          {selectedCandidature.analyse.nb_projets_pertinents !== undefined
                            && `, dont ${selectedCandidature.analyse.nb_projets_pertinents} pertinent(s) pour l’offre`})
                        </p>
                        {(selectedCandidature.analyse.projets ?? []).length > 0 ? (
                          <ul className="space-y-1 text-xs">
                            {selectedCandidature.analyse.projets!.map((p, i) => {
                              // older analyses stored plain titles, without relevance
                              const projet = typeof p === 'string' ? { titre: p, pertinent: undefined, raison: '' } : p;
                              return (
                                <li key={i} className="flex items-start gap-2">
                                  <span
                                    className="mt-0.5 shrink-0 font-semibold"
                                    style={{ color: projet.pertinent ? 'var(--accent-sage)' : 'var(--ink-soft)' }}
                                    aria-label={projet.pertinent ? 'Pertinent' : projet.pertinent === false ? 'Non pertinent' : 'Pertinence non évaluée'}
                                  >
                                    {projet.pertinent ? '✓' : projet.pertinent === false ? '–' : '•'}
                                  </span>
                                  <span>
                                    {projet.titre}
                                    {projet.raison && <span className="text-[var(--ink-soft)]"> · {projet.raison}</span>}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        ) : <p className="text-xs text-[var(--ink-soft)]">Aucun projet décrit dans le CV.</p>}
                      </div>
                      <p className="text-xs text-[var(--ink-soft)]">
                        Aide au tri uniquement : vérifiez le CV en cas de doute, la décision vous revient.
                      </p>
                    </div>
                  ) : selectedCandidature.analyse_statut === 'en_cours' ? (
                    <p className="text-[var(--ink-soft)]">Analyse en cours…</p>
                  ) : selectedCandidature.analyse_statut ? (
                    <p className={selectedCandidature.analyse_statut === 'erreur' ? 'text-[var(--accent-amber)]' : 'text-[var(--ink-soft)]'}>
                      {selectedCandidature.analyse_erreur || 'Analyse impossible.'}
                    </p>
                  ) : (
                    <p className="text-[var(--ink-soft)]">Pas encore analysée.</p>
                  )}

                  <button
                    type="button"
                    disabled={analyseEnCours.has(selectedCandidature.id) || !selectedCandidature.has_cv}
                    onClick={() => handleAnalyser(selectedCandidature.id)}
                    className="mt-3 rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-medium transition hover:border-[var(--accent-secondary)] hover:text-[var(--accent-secondary)] disabled:opacity-40"
                  >
                    {analyseEnCours.has(selectedCandidature.id)
                      ? 'Analyse…'
                      : selectedCandidature.analyse_statut ? 'Relancer l’analyse' : 'Analyser le CV'}
                  </button>
                </div>
              </section>

              {/* Pre-selection: first acceptance, sends the candidature to the CRM for analysis */}
              <section className="mt-7">
                <p className="mb-3 text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-mono-num">
                  Pré-sélection
                </p>

                {selectedCandidature.statut === 'refusee' ? (
                  <div className="rounded-xl border border-[var(--accent-brick)]/30 bg-[var(--accent-brick)]/5 p-4">
                    <p className="text-sm font-medium text-[var(--accent-brick)]">
                      ✕ Candidature refusée
                      {selectedCandidature.refusee_le && (
                        <span className="font-normal text-[var(--ink-soft)]"> le {formatDateHeure(selectedCandidature.refusee_le)}</span>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-[var(--ink-soft)]">
                      {selectedCandidature.email_refus_envoye_le
                        ? `E-mail de refus envoyé au candidat le ${formatDateHeure(selectedCandidature.email_refus_envoye_le)}.`
                        : 'Aucun e-mail de refus n’a été envoyé au candidat.'}
                    </p>
                  </div>
                ) : (
                <div className="rounded-xl border border-[var(--line)] p-4">
                  {selectedCandidature.crm_envoye_le ? (
                    <p className="text-sm">
                      <span className="font-medium text-[var(--accent-sage)]">✓ Envoyée au CRM</span>{' '}
                      <span className="text-[var(--ink-soft)]">
                        le{' '}
                        {new Date(selectedCandidature.crm_envoye_le).toLocaleString('fr-FR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                        . L’analyse se fait dans le CRM.
                      </span>
                    </p>
                  ) : selectedCandidature.statut === 'preselectionnee' ? (
                    <p className="text-sm text-[var(--accent-amber)]">
                      Acceptée, mais pas encore reçue par le CRM.{' '}
                      {selectedCandidature.crm_erreur}
                    </p>
                  ) : (
                    <p className="text-sm text-[var(--ink-soft)]">
                      En acceptant, la candidature (CV compris) est envoyée au CRM pour être analysée.
                    </p>
                  )}

                  <button
                    type="button"
                    disabled={accepting}
                    onClick={() => handleAccepter(selectedCandidature.id)}
                    className="mt-3 w-full rounded-lg bg-[var(--accent-primary)] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {accepting
                      ? 'Envoi au CRM…'
                      : selectedCandidature.crm_envoye_le
                        ? 'Renvoyer au CRM (mettre à jour)'
                        : selectedCandidature.statut === 'preselectionnee'
                          ? 'Réessayer l’envoi au CRM'
                          : 'Accepter et envoyer au CRM'}
                  </button>

                  {selectedCandidature.crm_envoye_le && (
                    <p className="mt-3 text-xs text-[var(--ink-soft)]">
                      {selectedCandidature.email_examen_envoye_le
                        ? `✉️ E-mail « candidature en cours d’examen » envoyé le ${formatDateHeure(selectedCandidature.email_examen_envoye_le)}.`
                        : '✉️ L’e-mail « en cours d’examen » n’a pas pu être envoyé au candidat.'}
                    </p>
                  )}
                </div>
                )}
              </section>

              {/* Refusal: only before the CRM has it (afterwards the decision is made in the CRM) */}
              {selectedCandidature.statut !== 'refusee' && (
                <section className="mt-7">
                  <p className="mb-3 text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-mono-num">
                    Refus
                  </p>
                  <div className="rounded-xl border border-[var(--line)] p-4">
                    {selectedCandidature.crm_envoye_le ? (
                      <p className="text-sm text-[var(--ink-soft)]">
                        Cette candidature est dans le CRM : l’acceptation ou le refus se décide dans le CRM, qui envoie lui-même l’e-mail au candidat.
                      </p>
                    ) : refus && refus.id === selectedCandidature.id ? (
                      <div>
                        <p className="text-sm font-medium">Refuser la candidature de {selectedCandidature.nom} ?</p>
                        <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-sm">
                          <input
                            type="checkbox"
                            className="mt-0.5 h-4 w-4"
                            checked={refus.envoyerEmail}
                            disabled={refus.enCours}
                            onChange={(e) => setRefus({ ...refus, envoyerEmail: e.target.checked })}
                          />
                          <span>
                            Envoyer l’e-mail de refus au candidat
                            <span className="block text-xs text-[var(--ink-soft)]">
                              Message poli et standard (le même que celui du CRM), sans motif interne.
                            </span>
                          </span>
                        </label>
                        <div className="mt-4 flex gap-2">
                          <button
                            type="button"
                            disabled={refus.enCours}
                            onClick={() => setRefus(null)}
                            className="flex-1 rounded-lg border border-[var(--line)] px-4 py-2 text-sm font-medium transition hover:bg-[var(--line)]/40 disabled:opacity-50"
                          >
                            Annuler
                          </button>
                          <button
                            type="button"
                            disabled={refus.enCours}
                            onClick={() => handleRefuser(selectedCandidature.id, refus.envoyerEmail)}
                            className="flex-1 rounded-lg bg-[var(--accent-brick)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                          >
                            {refus.enCours ? 'Refus en cours…' : 'Confirmer le refus'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm text-[var(--ink-soft)]">
                          Le profil ne convient pas ? Refusez-la ici, le candidat peut être prévenu par e-mail.
                        </p>
                        <button
                          type="button"
                          onClick={() => setRefus({ id: selectedCandidature.id, envoyerEmail: true, enCours: false })}
                          className="shrink-0 rounded-lg border border-[var(--accent-brick)]/40 px-4 py-2 text-sm font-medium text-[var(--accent-brick)] transition hover:bg-[var(--accent-brick)]/10"
                        >
                          Refuser
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              )}

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

