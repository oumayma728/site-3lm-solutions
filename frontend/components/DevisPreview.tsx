'use client';

import { useEffect, useState } from 'react';
import { LigneDevis, Profil, Complexite, Devise, ModeTarification } from '@/lib/types';
import { calcTotalLignes, calculerTva, convertirMontant, formatMontant, formatMontantConverti, parseMontant } from '@/lib/devis';

interface DevisPreviewProps {
  lignes: LigneDevis[];
  estimation?: number | string | null;
  clientNom?: string;
  devisId?: number;
  readOnly?: boolean;
  devise?: Devise;
  onDeviseChange?: (devise: Devise) => void;
  // Mode 'cout_reel' : pas de prix par ligne (voir backend), l'admin saisit
  // un coût réel total à la place — voir coutReel/onCoutReelChange ci-dessous.
  modeTarification?: ModeTarification;
  coutReel?: number | string | null;
  onCoutReelChange?: (coutReel: number) => void;
  onSave?: (lignes: LigneDevis[], estimation: number) => Promise<void>;
}

const DEVISES: Devise[] = ['TND', 'EUR', 'USD'];

const PROFIL_LABELS: Record<Profil, string> = {
  junior: 'Junior',
  senior: 'Senior',
  chef_de_projet: 'Chef de projet',
};

const COMPLEXITE_LABELS: Record<Complexite, string> = {
  simple: 'Simple',
  moyenne: 'Moyenne',
  complexe: 'Complexe',
};

function emptyLigne(): LigneDevis {
  return {
    description: '',
    quantite: 1,
    prix_unitaire: 0,
    profil: '',
    jours_estimes: '',
    nombre_personnes: 1,
    complexite: '',
  };
}

export default function DevisPreview({
  lignes, estimation, clientNom, devisId, readOnly, devise = 'TND', onDeviseChange,
  modeTarification = 'estimation_ia', coutReel, onCoutReelChange, onSave,
}: DevisPreviewProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<LigneDevis[]>(lignes);
  const [draftEstimation, setDraftEstimation] = useState<string>(estimation != null ? String(parseMontant(estimation)) : '');
  const [estimationOverridden, setEstimationOverridden] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Champ "coût réel" (mode 'cout_reel' uniquement) — un brouillon texte
  // séparé de la prop, comme les autres champs de ce composant, pour laisser
  // taper librement avant de valider avec le bouton "Enregistrer".
  const [coutReelDraft, setCoutReelDraft] = useState<string>(coutReel != null ? String(parseMontant(coutReel)) : '');
  const [savingCoutReel, setSavingCoutReel] = useState(false);

  useEffect(() => {
    setCoutReelDraft(coutReel != null ? String(parseMontant(coutReel)) : '');
  }, [coutReel]);

  const modeCoutReel = modeTarification === 'cout_reel';

  const handleSaveCoutReel = () => {
    if (!onCoutReelChange) return;
    setSavingCoutReel(true);
    try {
      onCoutReelChange(parseMontant(coutReelDraft));
    } finally {
      setSavingCoutReel(false);
    }
  };

  useEffect(() => {
    if (!editing) {
      setDraft(lignes);
      setDraftEstimation(estimation != null ? String(parseMontant(estimation)) : '');
    }
  }, [lignes, estimation, editing]);

  // Tant que l'utilisateur n'a pas tapé sa propre valeur, "Estimation finale"
  // suit automatiquement la somme des lignes — évite qu'elle reste figée à
  // l'ancienne valeur pendant qu'on modifie les lignes.
  useEffect(() => {
    if (editing && !estimationOverridden) {
      setDraftEstimation(String(calcTotalLignes(draft) || ''));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, editing]);

  const total = calcTotalLignes(editing ? draft : lignes);
  const hasLignes = (editing ? draft : lignes).length > 0;

  const startEditing = () => {
    setDraft(lignes.length > 0 ? lignes.map((l) => ({ ...l })) : [emptyLigne()]);
    setDraftEstimation(estimation != null ? String(parseMontant(estimation)) : String(calcTotalLignes(lignes) || ''));
    setEstimationOverridden(false);
    setError(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setError(null);
  };

  const updateLigne = (index: number, patch: Partial<LigneDevis>) => {
    setDraft((d) => d.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  };

  const removeLigne = (index: number) => {
    setDraft((d) => d.filter((_, i) => i !== index));
  };

  const addLigne = () => {
    setDraft((d) => [...d, emptyLigne()]);
  };

  const handleSave = async () => {
    if (!onSave) return;
    const cleaned = draft
      .map((l) => ({ ...l, description: l.description.trim() }))
      .filter((l) => l.description.length > 0);

    if (cleaned.length === 0) {
      setError('Ajoutez au moins une ligne avec une description.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const estimationFinale = draftEstimation.trim() === '' ? calcTotalLignes(cleaned) : parseMontant(draftEstimation);
      await onSave(cleaned, estimationFinale);
      setEditing(false);
    } catch {
      setError('Impossible d’enregistrer les modifications.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl bg-[var(--surface)] border border-[var(--line)] flex flex-col overflow-hidden max-h-[calc(100vh-170px)]">
      <div className="px-6 py-5 border-b border-[var(--line)] flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--accent-secondary)' }}>
            Aperçu du devis
          </p>
          <h2 className="font-display text-xl truncate">
            {clientNom ?? 'Client'}
            {devisId != null && (
              <span className="text-[var(--ink-soft)] font-normal text-base ml-2">#{devisId}</span>
            )}
          </h2>
        </div>

        {!editing && (
          <div className="shrink-0 flex items-center gap-2">
            {onDeviseChange && (
              <div className="flex rounded-full border border-[var(--line)] p-0.5 text-xs font-semibold">
                {DEVISES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => onDeviseChange(d)}
                    title="Conversion à titre indicatif — taux fixes, pas de taux de change en temps réel"
                    className="px-2.5 py-1 rounded-full transition-colors"
                    style={
                      d === devise
                        ? { background: 'var(--accent-secondary)', color: '#fff' }
                        : { color: 'var(--ink-soft)' }
                    }
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
            {!readOnly && lignes.length > 0 && (
              <button
                type="button"
                onClick={startEditing}
                className="text-xs font-semibold rounded-full px-3.5 py-2 border border-[var(--line)] hover:border-[var(--accent-secondary)] hover:text-[var(--accent-secondary)] transition-colors flex items-center gap-1.5"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Modifier
              </button>
            )}
          </div>
        )}
      </div>

      {/* Panneau "coût réel" — mode 'cout_reel' uniquement, toujours visible
          (pas besoin de cliquer "Modifier") puisque ce n'est pas lié aux
          lignes générées par l'IA. */}
      {modeCoutReel && (
        <div className="px-6 py-4 border-b border-[var(--line)] space-y-2" style={{ background: '#FAFAFB' }}>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label htmlFor="cout-reel" className="text-xs uppercase tracking-wide text-[var(--ink-soft)] block mb-1">
                Coût réel payé (DT) — salaires, charges, déploiement, impôts...
              </label>
              <input
                id="cout-reel"
                type="number"
                min={0}
                step="0.01"
                value={coutReelDraft}
                onChange={(e) => setCoutReelDraft(e.target.value)}
                disabled={readOnly || !onCoutReelChange}
                className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm font-mono-num outline-none focus:border-[var(--accent-primary)] transition-colors disabled:opacity-60"
              />
            </div>
            {!readOnly && onCoutReelChange && (
              <button
                type="button"
                onClick={handleSaveCoutReel}
                disabled={savingCoutReel || coutReelDraft.trim() === ''}
                className="text-xs font-semibold rounded-lg px-3.5 py-2 text-white transition-opacity disabled:opacity-40"
                style={{ backgroundImage: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }}
              >
                {savingCoutReel ? '...' : 'Enregistrer'}
              </button>
            )}
          </div>
          {/* estimation = coût réel + marge, calculé côté backend dès que
              coutReel change — voir DevisSerializer.update. TVA 19% ajoutée
              par-dessus uniquement en TND, même règle qu'en mode 'estimation_ia'
              (voir plus bas) et que le PDF (services/pdf.py). */}
          {estimation != null && parseMontant(estimation) > 0 && (() => {
            const estimationConvertie = convertirMontant(estimation, devise);
            const tva = calculerTva(estimationConvertie, devise);
            const totalTtc = estimationConvertie + tva;
            return (
              <>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--ink-soft)]">Prix final (HT)</span>
                  <span className="font-mono-num font-medium">{formatMontant(estimation, devise)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--ink-soft)]">TVA ({devise === 'TND' ? 19 : 0}%)</span>
                  <span className="font-mono-num font-medium">{formatMontantConverti(tva, devise)}</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-1">
                  <span className="font-semibold">Total TTC</span>
                  <span
                    className="font-mono-num font-bold text-lg px-3 py-1 rounded-lg"
                    style={{ color: 'var(--accent-primary)', background: '#FFF1EC' }}
                  >
                    {formatMontantConverti(totalTtc, devise)}
                  </span>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {!hasLignes && !editing ? (
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-white"
            style={{ background: 'var(--accent-primary)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 12h6M9 16h6M9 8h6M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" />
            </svg>
          </div>
          <p className="text-sm text-[var(--ink-soft)] max-w-xs">
            Les lignes du devis apparaîtront ici après génération par l&apos;assistant IA.
          </p>
        </div>
      ) : editing ? (
        <>
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {draft.map((ligne, i) => (
              <div key={i} className="rounded-xl border border-[var(--line)] p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <textarea
                    value={ligne.description}
                    onChange={(e) => updateLigne(i, { description: e.target.value })}
                    placeholder="Description de la ligne"
                    rows={2}
                    className="flex-1 rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm outline-none resize-none focus:border-[var(--accent-secondary)] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => removeLigne(i)}
                    title="Supprimer cette ligne"
                    className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[var(--ink-soft)] hover:text-white hover:bg-[var(--accent-brick)] transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6h16zM10 11v6M14 11v6" />
                    </svg>
                  </button>
                </div>

                {/* Champs d'estimation — base du calcul de prix_unitaire */}
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] uppercase tracking-wide text-[var(--ink-soft)] block mb-1">Profil</label>
                    <select
                      value={ligne.profil ?? ''}
                      onChange={(e) => updateLigne(i, { profil: e.target.value as Profil | '' })}
                      className="w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] px-2 py-1.5 text-sm outline-none focus:border-[var(--accent-secondary)] transition-colors"
                    >
                      <option value="">—</option>
                      <option value="junior">Junior</option>
                      <option value="senior">Senior</option>
                      <option value="chef_de_projet">Chef de projet</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wide text-[var(--ink-soft)] block mb-1">Jours</label>
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      value={ligne.jours_estimes ?? ''}
                      onChange={(e) => updateLigne(i, { jours_estimes: e.target.value })}
                      className="w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] px-2 py-1.5 text-sm font-mono-num outline-none focus:border-[var(--accent-secondary)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wide text-[var(--ink-soft)] block mb-1">Personnes</label>
                    <input
                      type="number"
                      min={1}
                      value={ligne.nombre_personnes ?? 1}
                      onChange={(e) => updateLigne(i, { nombre_personnes: Number(e.target.value) || 1 })}
                      className="w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] px-2 py-1.5 text-sm font-mono-num outline-none focus:border-[var(--accent-secondary)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wide text-[var(--ink-soft)] block mb-1">Complexité</label>
                    <select
                      value={ligne.complexite ?? ''}
                      onChange={(e) => updateLigne(i, { complexite: e.target.value as Complexite | '' })}
                      className="w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] px-2 py-1.5 text-sm outline-none focus:border-[var(--accent-secondary)] transition-colors"
                    >
                      <option value="">—</option>
                      <option value="simple">Simple</option>
                      <option value="moyenne">Moyenne</option>
                      <option value="complexe">Complexe</option>
                    </select>
                  </div>
                </div>

                {/* P.U./Total masqués en mode 'cout_reel' : prix_unitaire vaut
                    toujours 0 dans ce mode (voir backend generer_ia), le prix
                    se décide via le panneau "Coût réel" plus haut, pas ici. */}
                <div className={modeCoutReel ? 'grid grid-cols-1 gap-2 max-w-[120px]' : 'grid grid-cols-3 gap-2'}>
                  <div>
                    <label className="text-[10px] uppercase tracking-wide text-[var(--ink-soft)] block mb-1">Qté</label>
                    <input
                      type="number"
                      min={1}
                      value={ligne.quantite}
                      onChange={(e) => updateLigne(i, { quantite: Number(e.target.value) || 1 })}
                      className="w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] px-2.5 py-1.5 text-sm font-mono-num outline-none focus:border-[var(--accent-secondary)] transition-colors"
                    />
                  </div>
                  {!modeCoutReel && (
                    <>
                      <div>
                        <label className="text-[10px] uppercase tracking-wide text-[var(--ink-soft)] block mb-1">P.U. (DT)</label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={ligne.prix_unitaire}
                          onChange={(e) => updateLigne(i, { prix_unitaire: e.target.value })}
                          className="w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] px-2.5 py-1.5 text-sm font-mono-num outline-none focus:border-[var(--accent-secondary)] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wide text-[var(--ink-soft)] block mb-1">Total</label>
                        <p className="px-2.5 py-1.5 text-sm font-mono-num font-semibold">
                          {formatMontant(ligne.quantite * parseMontant(ligne.prix_unitaire))}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addLigne}
              className="w-full text-xs font-semibold rounded-lg border border-dashed border-[var(--line)] py-2.5 text-[var(--ink-soft)] hover:border-[var(--accent-secondary)] hover:text-[var(--accent-secondary)] transition-colors"
            >
              + Ajouter une ligne
            </button>
          </div>

          <div className="border-t border-[var(--line)] px-6 py-5 space-y-3" style={{ background: '#FAFAFB' }}>
            {/* Sous-total/estimation par lignes n'ont pas de sens en mode
                'cout_reel' (toutes les lignes sont à 0) — le prix final s'y
                pilote depuis le panneau "Coût réel" plus haut, pas ici. */}
            {!modeCoutReel && (
              <>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--ink-soft)]">Sous-total lignes</span>
                  <span className="font-mono-num font-medium">{formatMontant(calcTotalLignes(draft))}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <label htmlFor="estimation" className="font-semibold">
                    Estimation finale
                    {estimationOverridden && (
                      <button
                        type="button"
                        onClick={() => setEstimationOverridden(false)}
                        className="ml-2 text-xs font-normal underline text-[var(--ink-soft)] hover:text-[var(--accent-secondary)]"
                        title="Revenir au calcul automatique à partir des lignes"
                      >
                        ↺ recalculer
                      </button>
                    )}
                  </label>
                  <input
                    id="estimation"
                    type="number"
                    min={0}
                    step="0.01"
                    value={draftEstimation}
                    onChange={(e) => {
                      setEstimationOverridden(true);
                      setDraftEstimation(e.target.value);
                    }}
                    className="w-32 text-right rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5 text-sm font-mono-num font-bold outline-none focus:border-[var(--accent-primary)] transition-colors"
                    style={{ color: 'var(--accent-primary)' }}
                  />
                </div>
              </>
            )}

            {error && <p className="text-xs text-[var(--accent-brick)]">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={cancelEditing}
                disabled={saving}
                className="flex-1 text-sm font-semibold rounded-lg border border-[var(--line)] py-2.5 transition-colors hover:border-[var(--accent-brick)] hover:text-[var(--accent-brick)] disabled:opacity-40"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="btn-press flex-1 text-sm font-semibold text-white rounded-lg py-2.5 transition-all duration-200 disabled:opacity-40"
                style={{ backgroundImage: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }}
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex-1 overflow-auto">
            {/* En mode 'cout_reel', pas de colonnes de prix par ligne — voir
                le commentaire sur le panneau "Coût réel" plus haut. */}
            <div
              className={
                modeCoutReel
                  ? 'grid grid-cols-[1fr_64px] px-5 py-3 text-xs font-semibold text-[var(--ink-soft)] border-b border-[var(--line)] sticky top-0 bg-[var(--surface)]'
                  : 'grid grid-cols-[1fr_64px_96px_96px] px-5 py-3 text-xs font-semibold text-[var(--ink-soft)] border-b border-[var(--line)] sticky top-0 bg-[var(--surface)]'
              }
            >
              <span>Description</span>
              <span className="text-right">Qté</span>
              {!modeCoutReel && (
                <>
                  <span className="text-right">P.U.</span>
                  <span className="text-right">Total</span>
                </>
              )}
            </div>
            {lignes.map((ligne, i) => {
              const ligneTotal = ligne.total ?? ligne.quantite * parseMontant(ligne.prix_unitaire);
              const details = [
                ligne.profil ? PROFIL_LABELS[ligne.profil as Profil] : null,
                ligne.complexite ? COMPLEXITE_LABELS[ligne.complexite as Complexite] : null,
                ligne.jours_estimes ? `${ligne.jours_estimes}j${ligne.nombre_personnes && ligne.nombre_personnes > 1 ? ` × ${ligne.nombre_personnes}` : ''}` : null,
              ].filter(Boolean);
              return (
                <div
                  key={ligne.id ?? i}
                  className={
                    modeCoutReel
                      ? 'grid grid-cols-[1fr_64px] px-5 py-3.5 items-start border-b border-[var(--line)] last:border-0 text-sm transition-colors'
                      : 'grid grid-cols-[1fr_64px_96px_96px] px-5 py-3.5 items-start border-b border-[var(--line)] last:border-0 text-sm transition-colors'
                  }
                  style={{ background: 'transparent' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#FFF6F3')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span className="pr-4 leading-snug">
                    {ligne.description}
                    {details.length > 0 && (
                      <span className="block text-xs text-[var(--ink-soft)] mt-1">{details.join(' · ')}</span>
                    )}
                  </span>
                  <span className="text-right font-mono-num text-[var(--ink-soft)]">{ligne.quantite}</span>
                  {!modeCoutReel && (
                    <>
                      <span className="text-right font-mono-num text-[var(--ink-soft)]">{formatMontant(ligne.prix_unitaire, devise)}</span>
                      <span className="text-right font-mono-num font-semibold">{formatMontant(ligneTotal, devise)}</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sous-total/Estimation IA : uniquement pertinent en mode
              'estimation_ia'. En mode 'cout_reel' le prix final est déjà
              affiché dans le panneau "Coût réel" tout en haut. */}
          {!modeCoutReel && (
            <div className="border-t border-[var(--line)] px-6 py-5 space-y-2" style={{ background: '#FAFAFB' }}>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--ink-soft)]">Sous-total lignes</span>
                <span className="font-mono-num font-medium">{formatMontant(total, devise)}</span>
              </div>
              {estimation != null && parseMontant(estimation) > 0 && (() => {
                // TVA 19% uniquement en TND — une facture EUR/USD est une
                // facture d'export, hors champ de la TVA tunisienne (0%
                // dans ce cas). Même règle que le PDF, voir lib/devis.ts.
                const estimationConvertie = convertirMontant(estimation, devise);
                const tva = calculerTva(estimationConvertie, devise);
                const totalTtc = estimationConvertie + tva;
                return (
                  <>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--ink-soft)]">Estimation IA (HT)</span>
                      <span className="font-mono-num font-medium">{formatMontant(estimation, devise)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--ink-soft)]">TVA ({devise === 'TND' ? 19 : 0}%)</span>
                      <span className="font-mono-num font-medium">{formatMontantConverti(tva, devise)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-3 mt-1 border-t border-[var(--line)]">
                      <span className="font-semibold">Total TTC</span>
                      <span
                        className="font-mono-num font-bold text-xl px-3 py-1 rounded-lg"
                        style={{ color: 'var(--accent-primary)', background: '#FFF1EC' }}
                      >
                        {formatMontantConverti(totalTtc, devise)}
                      </span>
                    </div>
                  </>
                );
              })()}
              {devise !== 'TND' && (
                <p className="text-[11px] text-[var(--ink-soft)] pt-1">
                  Montants convertis à titre indicatif (taux fixe) — calcul et enregistrement toujours en DT.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}