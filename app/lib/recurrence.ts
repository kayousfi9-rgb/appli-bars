// Tout ce qui concerne les offres récurrentes (« tous les jeudis de 18h à 20h »)


export const JOURS_COURTS = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];
export const JOURS_LONGS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];


// Une ligne de la table offres_recurrentes
export type OffreRecurrente = {
  id: string;
  bar_id: string | number;
  categorie: "boisson" | "plat" | "activite";
  produit: string;
  nom_plat: string | null;
  type_boisson: string | null;
  prix_normal: number;
  prix_reduit: number;
  quantite: number | null;
  jours: number[]; // 1 = lundi ... 7 = dimanche
  heure_debut: string; // ex : 18:00:00
  heure_fin: string;
  actif: boolean;
};


const NUMERO_JOUR: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };


// Le jour (1 à 7) et l'heure (en minutes depuis minuit) à Paris
export function parisMaintenant(ms: number): { jour: number; minutes: number } {
  const parties = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(ms));
  const lire = (type: string) => parties.find((p) => p.type === type)?.value ?? "";
  return {
    jour: NUMERO_JOUR[lire("weekday")] ?? 1,
    minutes: Number(lire("hour")) * 60 + Number(lire("minute")),
  };
}


// 18:00:00 devient 18:00
export function heureCourte(heure: string): string {
  return heure.slice(0, 5);
}


// 18:30 devient 1110
export function versMinutes(heure: string): number {
  const [h, m] = heure.split(":");
  return Number(h) * 60 + Number(m);
}


// [1,2,3,4,5,6,7] devient « Tous les jours », [4] devient « jeu »
export function libelleJours(jours: number[]): string {
  const tries = [...jours].sort((a, b) => a - b);
  if (tries.length === 7) return "Tous les jours";
  return tries.map((j) => JOURS_COURTS[j - 1]).join(", ");
}


// Nom à afficher : le nom du plat, ou le produit
export function nomModele(m: Pick<OffreRecurrente, "categorie" | "nom_plat" | "produit">): string {
  return (m.categorie === "plat" || m.categorie === "activite") && m.nom_plat ? m.nom_plat : m.produit;
}
