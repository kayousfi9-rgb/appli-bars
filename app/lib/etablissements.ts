import type { Bar, Offre } from "./types";
import type { HorairesSemaine } from "./horaires";
import { aUnNomLibre, type Famille } from "./familles";


export type CategorieEtab = Famille; // manger_boire, sport_bienetre ou sorties


// Une offre avec ses deux colonnes de l'étape 7 (boisson ou plat)
export type OffreEtendue = Offre & {
  categorie: string | null;
  nom_plat: string | null;
};


// Un établissement : un bar, un restaurant ou un loisir
export type Etablissement = Omit<Bar, "offres"> & {
  categorie_etab: CategorieEtab;
  etiquette: string | null; // texte libre : « laser game », « padel », « boulangerie »…
  photo_url: string | null;
  horaires_semaine: HorairesSemaine | null;
  offres: OffreEtendue[];
};


// Tel qu'il est affiché (après les filtres)
export type EtablissementAffiche = Etablissement & {
  distanceKm: number | null;
  matchSoir: boolean;
};


// Le nom à afficher pour une offre : le nom du plat, ou le produit
export function nomOffre(offre: OffreEtendue): string {
  return aUnNomLibre(offre.categorie) && offre.nom_plat ? offre.nom_plat : offre.produit;
}

