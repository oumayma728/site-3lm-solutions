import api from './api';

export type candidature = {
id: number;
  reference: string;
nom: string;
  email: string;
  telephone: string;
  message: string;
  cv: string; // URL to the uploaded CV file
  created_at: string; // ISO date string
  consentement_date: string | null; // when the candidate accepted data processing
  consentement_version: string;
  type_stage: 'pfe' | 'ete' | 'autre' | ''; // set by the backend from the offer
  ecole: string;
  niveau_etude: string;
  linkedin_url: string;
  disponible_du: string | null; // YYYY-MM-DD
  disponible_au: string | null;
  cv_nom_original: string;
  statut: 'nouvelle' | 'preselectionnee'; // 'preselectionnee' = accepted, sent to the CRM
  crm_envoye_le: string | null; // set once the CRM has received it
  crm_erreur: string; // last CRM send error, empty when fine
};




// Admin-only: authenticated requests see every offer (active or not),
// unlike getOffres() which the public site uses and which only returns active ones.
export async function getAllCandidaturesAdmin(): Promise<candidature[]> {
  const res = await api.get('/candidature/');
  return res.data;
}
export async function DeleteCandidatureAdmin(id: number): Promise<void> {
  await api.delete(`/candidature/${id}/`);
}

// First acceptance: pre-select the candidature and send it to the CRM for analysis.
// The server answers 200 even when the CRM is down (crm_ok=false): the pre-selection is kept, retry any time.
export async function accepterCandidature(id: number): Promise<{ candidature: candidature; crm_ok: boolean; message: string }> {
  const res = await api.post(`/candidature/${id}/accepter/`);
  return res.data;
}
