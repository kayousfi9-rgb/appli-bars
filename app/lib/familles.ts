// Les trois grandes familles de lieux, et ce qui dépend de la famille (nom, emoji, couleur)


export type Famille = "manger_boire" | "sport_bienetre" | "sorties";


export type InfosFamille = {
  id: Famille;
  libelle: string; // ex : « Manger & boire »
  emoji: string;
  couleur: string; // la couleur de l'étoile sur la carte
};


// Pour changer un nom ou une couleur : c'est ici, à un seul endroit
export const FAMILLES: InfosFamille[] = [
  { id: "manger_boire", libelle: "Manger & boire", emoji: "🍽️", couleur: "#00AAA0" },
  { id: "sport_bienetre", libelle: "Sport & bien-être", emoji: "💪", couleur: "#E08A00" },
  { id: "sorties", libelle: "Sorties", emoji: "🎯", couleur: "#3B4A9E" },
];


export function infosFamille(valeur: string | null | undefined): InfosFamille {
  return FAMILLES.find((f) => f.id === valeur) ?? FAMILLES[0];
}


// Les trois types d'offre
export type TypeOffre = "boisson" | "plat" | "activite";


// Une offre « plat » ou « activité » a son nom dans nom_plat ; une boisson dans produit
export function aUnNomLibre(categorie: string | null | undefined): boolean {
  return categorie === "plat" || categorie === "activite";
}


// Cette offre est-elle une boisson alcoolisée ? (tout sauf « sans alcool »)
export function boissonAvecAlcool(offre: { categorie: string | null; type_boisson: string | null }): boolean {
  if (offre.categorie === "plat" || offre.categorie === "activite") return false;
  return (offre.type_boisson ?? "").trim().toLowerCase() !== "sans alcool";
}

