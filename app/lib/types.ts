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

};
