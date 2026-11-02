import api from './api';

export type candidature = {
id: number;
  reference: string;
nom: string;
  email: string;
  telephone: string;
  message: string;
  has_cv: boolean; // the file itself is only downloadable with openCandidatureCv()
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
  statut: 'nouvelle' | 'preselectionnee' | 'refusee'; // 'preselectionnee' = accepted, sent to the CRM
  crm_envoye_le: string | null; // set once the CRM has received it
  crm_erreur: string; // last CRM send error, empty when fine
  refusee_le: string | null;
  email_examen_envoye_le: string | null; // "under review" e-mail, sent when the CRM first receives it
  email_refus_envoye_le: string | null;
  // AI pre-analysis of the CV (flags only: a person always decides)
  analyse_statut: '' | 'en_cours' | 'ok' | 'non_analysable' | 'erreur';
  analyse_le: string | null;
  analyse: { competences?: string[]; technologies?: string[]; projets?: string[]; nb_projets?: number; resume?: string };
  analyse_erreur: string;
  // hors_criteres: true = outside the team's criteria, false = fits, null = cannot be evaluated
  criteres: { hors_criteres: boolean | null; raison: string };
};

export type CriteresTri = { min_competences: number; min_projets: number; analyse_auto: boolean };

export async function analyserCandidature(id: number): Promise<candidature> {
  return (await api.post(`/candidature/${id}/analyser/`)).data;
}

export async function getCriteresTri(): Promise<CriteresTri> {
  return (await api.get('/candidature/criteres/')).data;
}

export async function updateCriteresTri(data: Partial<CriteresTri>): Promise<CriteresTri> {
  return (await api.patch('/candidature/criteres/', data)).data;
}




// Admin-only: authenticated requests see every offer (active or not),
// unlike getOffres() which the public site uses and which only returns active ones.
export async function getAllCandidaturesAdmin(): Promise<candidature[]> {
  const res = await api.get('/candidature/');
  return res.data;
}
// CVs are never public: download through the authenticated API (the token is sent in a header,
// so a plain <a href> could not carry it), then hand the file to the browser.
export async function openCandidatureCv(id: number, filename?: string): Promise<void> {
  const res = await api.get(`/candidature/${id}/cv/`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'cv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function DeleteCandidatureAdmin(id: number): Promise<void> {
  await api.delete(`/candidature/${id}/`);
}

// First acceptance: pre-select the candidature and send it to the CRM for analysis.
// The server answers 200 even when the CRM is down (crm_ok=false): the pre-selection is kept, retry any time.
// Refuse here, before the CRM (the backend refuses with 409 once the CRM has it).
export async function refuserCandidature(id: number, envoyerEmail: boolean): Promise<{ candidature: candidature; email_envoye: boolean; message: string }> {
  const res = await api.post(`/candidature/${id}/refuser/`, { envoyer_email: envoyerEmail });
  return res.data;
}

export async function accepterCandidature(id: number): Promise<{ candidature: candidature; crm_ok: boolean; message: string }> {
  const res = await api.post(`/candidature/${id}/accepter/`);
  return res.data;
}
