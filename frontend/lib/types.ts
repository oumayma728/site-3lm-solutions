export type StatutClient = 'nouveau' | 'contacte' | 'qualifie' | 'client' | 'perdu';

export interface Client {
  id: number;
  nom: string;
  prenom?: string;
  entreprise?: string;
  email: string;
  telephone: string;
  message?: string;
  statut?: StatutClient;
  date_creation: string;
}

export type Profil = 'junior' | 'senior' | 'chef_de_projet';
export type Complexite = 'simple' | 'moyenne' | 'complexe';

export interface LigneDevis {
  id?: number;
  description: string;
  quantite: number;
  prix_unitaire: number | string;
  total?: number;
  // Champs d'estimation — remplis par l'IA ou modifiables manuellement.
  // prix_unitaire reste éditable : ces champs servent de base au calcul,
  // pas une valeur verrouillée.
  profil?: Profil | '';
  jours_estimes?: number | string;
  nombre_personnes?: number;
  complexite?: Complexite | '';
}

export type Devise = 'TND' | 'EUR' | 'USD';

// Deux modes de chiffrage possibles pour un devis (voir backend Devis.MODE_TARIFICATION_CHOICES) :
// - 'estimation_ia' : comportement historique — l'IA estime profil/jours/complexité par ligne,
//   le prix de chaque ligne est calculé automatiquement à partir d'un TJM par profil.
// - 'cout_reel' : l'IA estime toujours l'équipe/complexité (aucun prix par ligne, prix_unitaire = 0),
//   et c'est l'admin qui saisit le coût réel total payé dans cout_reel — le prix final
//   (estimation_montant) devient alors cout_reel + la marge bénéficiaire configurée côté backend.
export type ModeTarification = 'estimation_ia' | 'cout_reel';

export interface Devis {
  id: number;
  client: number;
  client_nom?: string;
  besoins_client: string;
  synthese_ia?: string;
  estimation_montant?: number | string | null;
  // Devise d'affichage — les montants restent stockés en TND, voir lib/devis.ts convertirMontant.
  devise?: Devise;
  mode_tarification?: ModeTarification;
  // Rempli uniquement en mode 'cout_reel' — voir ModeTarification ci-dessus.
  cout_reel?: number | string | null;
  statut: 'brouillon' | 'en_attente' | 'valide' | 'envoye' | 'refuse';
  lignes: LigneDevis[];
  date_creation: string;
  date_modification?: string;
}

export type TypeRdv = 'appel' | 'visio' | 'sur_site';
export type StatutRdv = 'demande' | 'confirme' | 'annule' | 'termine';
export type SourceRdv = 'interne' | 'public';

export interface RendezVous {
  id: number;
  client: number;
  client_nom?: string;
  client_entreprise?: string;
  client_telephone?: string;
  client_email?: string;
  devis?: number | null;
  devis_statut?: string | null;
  manager?: number | null;
  date_rdv: string;
  heure_rdv: string;
  type_rdv: TypeRdv;
  statut: StatutRdv;
  source?: SourceRdv;
  notes?: string;
  date_creation: string;
  date_modification?: string;
}