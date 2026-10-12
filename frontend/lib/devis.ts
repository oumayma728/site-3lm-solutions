import api from './api';
import { Devis, Devise, LigneDevis } from './types';

export function parseMontant(value: string | number | null | undefined): number {
  if (value == null) return 0;
  return typeof value === 'string' ? parseFloat(value) : value;
}

// Taux fixes et approximatifs depuis le TND — DOIT rester synchronisé avec
// backend/devis/services/currency.py (TAUX_DEPUIS_TND). Pas de taux de change
// en temps réel : ce projet n'appelle aucune API externe pour ça.
const TAUX_DEPUIS_TND: Record<Devise, number> = {
  TND: 1,
  EUR: 0.3,
  USD: 0.32,
};

const SYMBOLES: Record<Devise, string> = { TND: 'DT', EUR: '€', USD: '$' };

// Les montants (lignes, estimation_montant) sont toujours stockés en TND —
// cette fonction ne fait que convertir POUR L'AFFICHAGE, à la volée.
export function convertirMontant(value: string | number | null | undefined, devise: Devise = 'TND'): number {
  return parseMontant(value) * TAUX_DEPUIS_TND[devise];
}

// Formate un nombre DÉJÀ dans la bonne devise (pas de reconversion) — utilisé
// pour afficher un montant calculé après coup, comme la TVA ou le total TTC
// ci-dessous, qu'on ne veut pas convertir une seconde fois.
function formatNombreDevise(n: number, devise: Devise): string {
  if (!n) return '—';
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
  return `${formatted} ${SYMBOLES[devise]}`;
}

export function formatMontant(value: string | number | null | undefined, devise: Devise = 'TND'): string {
  return formatNombreDevise(convertirMontant(value, devise), devise);
}

// TVA tunisienne 19% — uniquement sur les devis facturés en TND. Une facture
// en EUR/USD est une facture d'export, hors champ de la TVA tunisienne, donc
// 0%. DOIT rester synchronisé avec backend/devis/services/pdf.py (TAUX_TVA).
export const TAUX_TVA = 0.19;

// Prend un montant DÉJÀ converti dans la devise d'affichage (ex: le résultat
// de convertirMontant) et renvoie la TVA correspondante — pas de nouvelle
// conversion ici, juste le calcul du taux.
export function calculerTva(montantConverti: number, devise: Devise): number {
  return devise === 'TND' ? montantConverti * TAUX_TVA : 0;
}

export function formatMontantConverti(n: number, devise: Devise): string {
  return formatNombreDevise(n, devise);
}

export function calcTotalLignes(lignes: LigneDevis[]): number {
  return lignes.reduce(
    (sum, l) => sum + (l.total ?? l.quantite * parseMontant(l.prix_unitaire)),
    0
  );
}

export async function fetchDevis(id: number | string): Promise<Devis> {
  const res = await api.get(`/devis/${id}/`);
  return res.data;
}

export async function fetchDevisList(filters?: { client?: number | string }): Promise<Devis[]> {
  const res = await api.get('/devis/', { params: filters });
  return res.data;
}

export async function genererDevisIA(
  id: number | string,
  instructions?: string
): Promise<Devis> {
  const res = await api.post(`/devis/${id}/generer_ia/`, {
    instructions: instructions ?? '',
  });
  return res.data;
}

export async function validerDevis(id: number | string): Promise<Devis> {
  const res = await api.post(`/devis/${id}/valider/`);
  return res.data.devis;
}

export async function updateDevis(
  id: number | string,
  data: Partial<Pick<Devis, 'besoins_client' | 'synthese_ia' | 'estimation_montant' | 'devise' | 'mode_tarification' | 'cout_reel'>> & {
    lignes?: LigneDevis[];
  }
): Promise<Devis> {
  const res = await api.patch(`/devis/${id}/`, data);
  return res.data;
}

export async function deleteDevis(id: number | string): Promise<void> {
  await api.delete(`/devis/${id}/`);
}

export async function telechargerPdfDevis(id: number | string): Promise<void> {
  const res = await api.get(`/devis/${id}/pdf/`, { responseType: 'blob' });

  const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `devis_${id}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}