export type Offre = {

  id: string | number;

  produit: string;

  type_boisson: string | null;

  prix_normal: number;

  prix_reduit: number;

  debut: string;

  fin: string;

  quantite: number | null;

};

export type Match = {

  id: string | number;

  intitule: string;

  date_heure: string;

};

export type Bar = {

  id: string | number;

  nom: string;

  adresse: string | null;

  latitude: number;

  longitude: number;

  type_bar: string | null;

  terrasse: boolean | null;

  ambiance: string | null;

  horaires: string | null;

  offres: Offre[];

  matchs: Match[];

};

// Un bar tel qu'il est affiché (après les filtres)

export type BarAffiche = Bar & {

  distanceKm: number | null;

  matchSoir: boolean;

};

export type Position = { lat: number; lng: number };

// Le bar vu depuis l'espace gérant

export type BarGerant = {

  id: string | number;

  nom: string;

  adresse: string | null;

  verifie: boolean;

  stripe_account_id: string | null;

  stripe_onboarding_complete: boolean;

};

export type ProfilClient = {

  id: string;

  prenom: string;

  date_naissance: string;

  cgu_acceptees: boolean;

};

export type FavoriAffiche = {

  bar_id: string | number;

  bars: { nom: string; adresse: string | null } | null;


};
export type StatutCommande = "payee" | "recuperee" | "expiree";

export type InfosOffreCommande = {

  produit: string | null;

  nom_plat: string | null;

  categorie: string | null;

};

// Supabase renvoie parfois un objet, parfois une liste d'un seul élément

// pour les tables reliées. Ce type accepte les deux.

export type Relie<T> = T | T[] | null;

export type CommandeClient = {

  id: string;

  prix_paye: number;

  statut: StatutCommande;

  qr_token: string;

  created_at: string;

  expire_le: string | null;

  recuperee_le: string | null;

  offres: Relie<InfosOffreCommande>;

  bars: Relie<{ nom: string }>;

};

export type VenteBar = {

  id: string;

  prix_paye: number;

  commission: number;

  statut: StatutCommande;

  created_at: string;

  expire_le: string | null;

  recuperee_le: string | null;

  offres: Relie<InfosOffreCommande>;

};

export type ResultatScan = {

  resultat:

    | "ok"

    | "deja_recuperee"

    | "expiree"

    | "introuvable"

    | "autre_bar"

    | "non_connecte"

    | "erreur";

  produit?: string | null;

  prix?: number;

  prenom?: string | null;

  recuperee_le?: string | null;

  expire_le?: string | null;

  message?: string;

};

export type MonBar = {

  id: string | number;

  nom: string;

};
export type VenteStat = {

  id: string;

  prix_paye: number;

  commission: number;

  statut: StatutCommande;

  created_at: string;

  offres: Relie<InfosOffreCommande>;

};

export type VisiteBar = {

  prix_paye: number;

  recuperee_le: string | null;

  bar_id: string | number;

  bars: Relie<{ nom: string; adresse: string | null }>;

};

export type PreferencesNotifications = {

  client_id: string;

  favoris: boolean;

  proximite: boolean;

  latitude: number | null;

  longitude: number | null;

  rayon_km: number;

};

export type NotificationClient = {

  id: string;

  titre: string;

  texte: string;

  lien: string | null;

  lue: boolean;

  cree_le: string;

};
