import api from './api';

export type candidature = {
id: number;
  reference: string;
nom: string;
  email: string;
  telephone: string;
  message: string;
  cv: string; // URL to the uploaded CV file
};




// Admin-only: authenticated requests see every offer (active or not),
// unlike getOffres() which the public site uses and which only returns active ones.
export async function getAllCandidaturesAdmin(): Promise<candidature[]> {
  const res = await api.get('/candidature/');
  return res.data;
}


