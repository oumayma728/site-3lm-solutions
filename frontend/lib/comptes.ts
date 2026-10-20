import api from './api';

// Team login accounts (who can sign in to the admin). Managed by administrators only.
export type Compte = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_superuser: boolean; // "Administrateur": can manage accounts and the team
  is_active: boolean;
  last_login: string | null;
  date_joined: string;
};

export type CompteInput = Partial<Omit<Compte, 'id' | 'last_login' | 'date_joined'>> & { password?: string };

export type Moi = Pick<Compte, 'id' | 'username' | 'first_name' | 'last_name' | 'is_superuser'>;

export async function getMoi(): Promise<Moi> {
  return (await api.get('/comptes/moi/')).data;
}

export async function getComptes(): Promise<Compte[]> {
  return (await api.get('/comptes/')).data;
}

export async function createCompte(data: CompteInput): Promise<Compte> {
  return (await api.post('/comptes/', data)).data;
}

export async function updateCompte(id: number, data: CompteInput): Promise<Compte> {
  return (await api.patch(`/comptes/${id}/`, data)).data;
}

// DRF validation errors ({field: [messages]}) as one readable sentence
export function messageErreur(err: unknown, defaut: string): string {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (data && typeof data === 'object') {
    const msg = Object.values(data as Record<string, unknown>).flat().join(' ');
    if (msg) return msg;
  }
  return defaut;
}
