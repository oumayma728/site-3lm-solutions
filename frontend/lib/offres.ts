import api from './api';

export type Offre = {
  id: number;
  titre: string;
  slug: string;
  type_offre: 'emploi' | 'stage';
  programme: 'ete' | 'pfe' | '';
  departement: string;
  location: string;
  contract_type: string;
  experience: string;
  description: string;
  about_role: string[];
  responsibilities: string[];
  qualifications: string[];
  benefits: string[];
  skills: string[];
  actif: boolean; // false = archived: hidden from the public site, kept in the admin
  cloturee: boolean; // still shown publicly as "Offre clôturée", but applications are refused
  cloturee_le: string | null;
};

export async function getOffres(type: 'emploi' | 'stage'): Promise<Offre[]> {
  try {
    const res = await api.get(`/offres/?type=${type}`);
    return res.data;
  } catch {
    // Backend unreachable — fail gracefully, page shows "0 postes" instead of crashing.
    return [];
  }
}

export async function getOffreBySlug(slug: string): Promise<Offre | null> {
  try {
    const res = await api.get(`/offres/${slug}/`);
    return res.data;
  } catch {
    return null;
  }
}

// Admin-only: authenticated requests see every offer (active or not),
// unlike getOffres() which the public site uses and which only returns active ones.
export async function getAllOffresAdmin(): Promise<Offre[]> {
  const res = await api.get('/offres/');
  return res.data;
}

export type OffreInput = {
  titre: string;
  type_offre: 'emploi' | 'stage';
  programme: 'ete' | 'pfe' | '';
  departement: string;
  location: string;
  contract_type: string;
  experience: string;
  description: string;
  about_role: string[];
  responsibilities: string[];
  qualifications: string[];
  benefits: string[];
  skills: string[];
  actif: boolean;
};

export async function createOffre(data: OffreInput): Promise<Offre> {
  const res = await api.post('/offres/', data);
  return res.data;
}

export async function updateOffre(slug: string, data: Partial<OffreInput> & { cloturee?: boolean }): Promise<Offre> {
  const res = await api.patch(`/offres/${slug}/`, data);
  return res.data;
}

export async function deleteOffre(slug: string): Promise<void> {
  await api.delete(`/offres/${slug}/`);
}
