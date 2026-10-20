// DevisDetailPage.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AssistantPanel from '@/components/AssistantPanel';
import DevisPreview from '@/components/DevisPreview';
import StatusBadge from '@/components/StatusBadge';
import LigneDirectePanel from '@/components/LigneDirectePanel';
import { Devis, LigneDevis, Devise } from '@/lib/types';
import {
  apercuPdfDevis, deleteDevis, fetchDevis, genererDevisIA, messageErreurApi, recalculerPrixDevis, renvoyerDevis,
  telechargerPdfDevis, updateDevis, validerDevis,
} from '@/lib/devis';
import { useToast } from '@/components/ToastProvider';

export default function DevisDetailPage() {
  const toast = useToast();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id as string;

  const [devis, setDevis] = useState<Devis | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [validating, setValidating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  // Étape d'aperçu avant envoi : URL locale du PDF exact qui partira au client.
  const [apercuUrl, setApercuUrl] = useState<string | null>(null);
  const [apercuLoading, setApercuLoading] = useState(false);
  const [renvoi, setRenvoi] = useState(false);

  const loadDevis = useCallback(async () => {
    try {
      const data = await fetchDevis(id);
      setDevis(data);
      setError(null);
    } catch {
      setError('Impossible de charger ce devis.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadDevis(); }, [loadDevis]);

  const handleGenerate = async (instructions: string) => {
    setGenerating(true);
    setGenError(null);
    try {
      const updated = await genererDevisIA(id, instructions);
      setDevis(updated);
    } catch (err: unknown) {
      // Message clair renvoyé par le backend (IA invalide après relance, clé, modèle, réseau…).
      setGenError(messageErreurApi(err, 'Erreur lors de la génération. Réessayez.'));
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (searchParams.get('generer') === '1' && devis && !devis.synthese_ia && !generating) {
      handleGenerate('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devis?.id, searchParams]);

  const handleUpdateBesoins = async (besoins: string) => {
    try {
      const updated = await updateDevis(id, { besoins_client: besoins });
      setDevis(updated);
    } catch {
      setGenError('Impossible de mettre à jour les besoins.');
    }
  };

  // Le total est recalculé par le backend (somme des lignes) : on n'envoie que les lignes.
  const handleSaveLignes = async (lignes: LigneDevis[]) => {
    try {
      const updated = await updateDevis(id, { lignes });
      setDevis(updated);
      toast.success('Lignes du devis mises à jour.');
    } catch (err) {
      throw new Error(messageErreurApi(err, 'Impossible d’enregistrer les modifications.'));
    }
  };

  const handleRecalculerPrix = async () => {
    try {
      const updated = await recalculerPrixDevis(id);
      setDevis(updated);
      toast.success('Prix recalculés avec les tarifs actuels.');
    } catch (err) {
      toast.error(messageErreurApi(err, 'Impossible de recalculer les prix.'));
    }
  };

  const handleDeviseChange = async (devise: Devise) => {
    if (!devis || devis.devise === devise) return;
    const previous = devis;
    setDevis({ ...devis, devise }); // affichage immédiat, pas d'attente réseau
    try {
      await updateDevis(id, { devise });
    } catch {
      setDevis(previous);
      toast.error('Impossible de changer la devise.');
    }
  };

  // Mode 'cout_reel' : envoie juste le coût réel saisi — le backend calcule
  // et renvoie estimation_montant = coût + marge (voir DevisSerializer.update),
  // donc on prend directement sa réponse plutôt que de recalculer ici.
  const handleCoutReelChange = async (coutReel: number) => {
    try {
      const updated = await updateDevis(id, { cout_reel: coutReel });
      setDevis(updated);
      toast.success('Coût réel enregistré.');
    } catch {
      toast.error('Impossible d’enregistrer le coût réel.');
    }
  };

  const fermerApercu = () => {
    if (apercuUrl) window.URL.revokeObjectURL(apercuUrl);
    setApercuUrl(null);
  };

  // Étape 1 : afficher le PDF exact qui partira au client, avant toute validation.
  const ouvrirApercu = async () => {
    setApercuLoading(true);
    setGenError(null);
    try {
      setApercuUrl(await apercuPdfDevis(id));
    } catch (err) {
      setGenError(messageErreurApi(err, 'Impossible de générer l’aperçu du devis.'));
    } finally {
      setApercuLoading(false);
    }
  };

  // Étape 2 : après relecture, valider (le devis est figé) et envoyer.
  const handleValider = async () => {
    if (!devis?.synthese_ia) return;
    setValidating(true);
    setValidationMessage(null);
    try {
      const updated = await validerDevis(id);
      setDevis(updated);
      fermerApercu();
      setValidationMessage(
        updated.statut === 'envoye'
          ? `Devis validé et envoyé à ${updated.client_email ?? updated.client_nom} par email.`
          : "Devis validé, mais l'envoi de l'email a échoué. Utilisez « Renvoyer l'email » ou téléchargez le PDF."
      );
    } catch (err) {
      setGenError(messageErreurApi(err, 'Impossible de valider le devis.'));
      fermerApercu();
    } finally {
      setValidating(false);
    }
  };

  const handleRenvoyer = async () => {
    setRenvoi(true);
    try {
      const updated = await renvoyerDevis(id);
      setDevis(updated);
      setValidationMessage(
        updated.statut === 'envoye'
          ? `Devis envoyé à ${updated.client_email ?? updated.client_nom} par email.`
          : "L'envoi de l'email a de nouveau échoué. Vérifiez la configuration email ou téléchargez le PDF."
      );
    } catch (err) {
      setGenError(messageErreurApi(err, 'Impossible de renvoyer le devis.'));
    } finally {
      setRenvoi(false);
    }
  };

  const handleTelechargerPdf = async () => {
    setDownloading(true);
    try {
      await telechargerPdfDevis(id);
    } catch {
      setGenError('Impossible de télécharger le PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!devis) return;
    if (!window.confirm(`Supprimer définitivement le devis de ${devis.client_nom ?? 'ce client'} ? Cette action est irréversible.`)) return;
    setDeleting(true);
    try {
      await deleteDevis(id);
      router.push('/admin/devis');
    } catch {
      setGenError('Impossible de supprimer ce devis.');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="px-8 py-10">
        <div className="animate-pulse space-y-4 max-w-4xl">
          <div className="h-4 w-32 rounded bg-[var(--line)]" />
          <div className="h-10 w-64 rounded bg-[var(--line)]" />
          <div className="h-96 rounded-2xl bg-[var(--line)]" />
        </div>
      </div>
    );
  }

  if (error || !devis) {
    return (
      <div className="mx-auto w-full px-8 py-10 max-w-4xl">
        <p className="text-[var(--accent-brick)] text-sm mb-4">{error ?? 'Devis introuvable.'}</p>
        <Link href="/admin/devis" className="text-sm font-semibold underline underline-offset-4" style={{ color: 'var(--accent-secondary)' }}>
          Retour au registre
        </Link>
      </div>
    );
  }

  const isValide = devis.statut === 'valide' || devis.statut === 'envoye';
  const canValidate = Boolean(devis.synthese_ia) && devis.statut === 'brouillon';

  return (
    <div className="flex flex-col min-h-screen">
      <header className="shrink-0 sticky top-0 z-10 px-8 py-5 border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <Link href="/admin/devis" className="text-xs font-semibold uppercase tracking-wide transition-colors" style={{ color: 'var(--accent-secondary)' }}>
              ← Registre
            </Link>
            <div className="flex items-center gap-3 mt-2">
              <h1 className="font-display text-2xl truncate">{devis.client_nom}</h1>
              <StatusBadge statut={devis.statut} />
            </div>
            <p className="text-xs text-[var(--ink-soft)] mt-1">
              Devis {devis.numero ?? `#${devis.id}`}
              {devis.version && devis.version > 1 ? ` · version ${devis.version}` : ''}
              {' · '}{new Date(devis.date_creation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
              {devis.date_validite && ` · valable jusqu'au ${new Date(devis.date_validite).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {canValidate && (
              <button
                type="button"
                onClick={ouvrirApercu}
                disabled={apercuLoading || validating || generating}
                className="btn-press rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                style={{ background: 'var(--accent-sage)' }}
              >
                {apercuLoading ? 'Préparation de l’aperçu...' : 'Vérifier et envoyer'}
              </button>
            )}
            {devis.statut === 'valide' && (
              <button
                type="button"
                onClick={handleRenvoyer}
                disabled={renvoi}
                className="btn-press rounded-full px-5 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-40 border"
                style={{ borderColor: 'var(--accent-sage)', color: 'var(--accent-sage)' }}
              >
                {renvoi ? 'Envoi...' : 'Renvoyer l’email'}
              </button>
            )}
            {isValide && (
              <>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1" style={{ background: '#E9F9EF', color: 'var(--accent-sage)' }}>
                  ✓ Devis validé
                </span>
                <button
                  type="button"
                  onClick={handleTelechargerPdf}
                  disabled={downloading}
                  className="btn-press rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                  style={{ background: 'var(--accent-primary)' }}
                >
                  {downloading ? 'Téléchargement...' : '⬇ Télécharger le PDF'}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              title="Supprimer ce devis"
              className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--ink-soft)] hover:text-white hover:bg-[var(--accent-brick)] transition-colors disabled:opacity-40"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6h16zM10 11v6M14 11v6" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-5">
          {[
            { label: 'Besoins', done: Boolean(devis.besoins_client) },
            { label: 'Génération IA', done: Boolean(devis.synthese_ia) },
            { label: 'Validation', done: isValide },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              {i > 0 && <div className="w-8 h-px" style={{ background: 'var(--line)' }} />}
              <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: step.done ? 'var(--accent-sage)' : 'var(--ink-soft)' }}>
                <span
                  className="w-5 h-5 flex items-center justify-center rounded-full text-[10px]"
                  style={step.done ? { background: 'var(--accent-sage)', color: '#fff' } : { border: '1.5px solid var(--line)' }}
                >
                  {step.done ? '✓' : i + 1}
                </span>
                {step.label}
              </div>
            </div>
          ))}
        </div>
      </header>

      <LigneDirectePanel devisId={devis.id} clientId={devis.client} />

      {validationMessage && (
        <div className="px-8 py-3 text-sm border-b" style={{ background: '#E9F9EF', borderColor: 'var(--accent-sage)', color: 'var(--accent-sage)' }}>
          {validationMessage}
        </div>
      )}

      <div className="flex-1 grid lg:grid-cols-2 items-start divide-x divide-[var(--line)]">
        <div className="bg-[var(--paper)]">
          <AssistantPanel
            besoins={devis.besoins_client}
            synthese={devis.synthese_ia}
            generating={generating}
            error={genError}
            onGenerate={handleGenerate}
            onUpdateBesoins={isValide ? undefined : handleUpdateBesoins}
            readOnly={isValide}
          />
        </div>
        <div className="bg-[var(--paper)] p-5 lg:sticky lg:top-4">
          <DevisPreview
            lignes={devis.lignes ?? []}
            estimation={devis.estimation_montant}
            clientNom={devis.client_nom}
            devisId={devis.id}
            numero={devis.numero}
            readOnly={isValide}
            hypotheses={devis.hypotheses}
            questionsOuvertes={devis.questions_ouvertes}
            budgetMentionne={devis.budget_mentionne}
            tarifsModifies={devis.tarifs_modifies}
            onRecalculerPrix={isValide ? undefined : handleRecalculerPrix}
            devise={devis.devise}
            onDeviseChange={handleDeviseChange}
            modeTarification={devis.mode_tarification}
            coutReel={devis.cout_reel}
            onCoutReelChange={handleCoutReelChange}
            onSave={handleSaveLignes}
          />
        </div>
      </div>

      {/* Aperçu avant envoi : le PDF exact, le destinataire, puis confirmation. */}
      {apercuUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(15, 23, 42, 0.55)' }}>
          <div className="w-full max-w-4xl h-[90vh] flex flex-col rounded-2xl bg-[var(--surface)] shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--line)] flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--accent-secondary)' }}>
                  Aperçu avant envoi
                </p>
                <p className="text-sm mt-1 truncate">
                  Ce PDF sera envoyé à <span className="font-semibold">{devis.client_email ?? devis.client_nom}</span>.
                  Une fois validé, le devis ne pourra plus être modifié.
                </p>
              </div>
              <button
                type="button"
                onClick={fermerApercu}
                className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-[var(--ink-soft)] hover:bg-[var(--line)]"
                title="Fermer"
              >
                ✕
              </button>
            </div>
            <iframe src={apercuUrl} title="Aperçu du devis" className="flex-1 w-full bg-[var(--paper)]" />
            <div className="px-6 py-4 border-t border-[var(--line)] flex justify-end gap-3">
              <button
                type="button"
                onClick={fermerApercu}
                disabled={validating}
                className="rounded-full px-5 py-2.5 text-sm font-semibold border border-[var(--line)] disabled:opacity-40"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleValider}
                disabled={validating}
                className="btn-press rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                style={{ background: 'var(--accent-sage)' }}
              >
                {validating ? 'Validation et envoi...' : 'Valider et envoyer au client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}