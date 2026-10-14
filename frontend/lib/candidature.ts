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

