import api from './api';

export type equipe = {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    poste: string;
    profil: string; 
    salaire: number | null;
    actif: boolean;
    
};




// Admin-only: authenticated requests see every offer (active or not),
// unlike getOffres() which the public site uses and which only returns active ones.
export async function getAllEquipesAdmin(): Promise<equipe[]> {
  const res = await api.get('/equipe/');
  return res.data;
}
export async function getEquipeById(id: string): Promise<equipe> {
  const res = await api.get(`/equipe/${id}/`);
  return res.data;
}
export type EmployeInput = {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  poste: string;
  profil: string;
  salaire: string;

  actif: boolean;
};

export async function createEmploye(data :EmployeInput): Promise<equipe> {
    const res = await api.post('/equipe/', data);
    return res.data;
}
export async function updateEmploye(id: string, data: Partial<EmployeInput>): Promise<equipe> {
    const res = await api.put(`/equipe/${id}/`, data);
    return res.data;
}


