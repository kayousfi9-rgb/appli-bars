import { heureParis } from "./utils";


export type Creneau = [string, string]; // par exemple ["12:00", "23:30"]
export type JourSemaine = "dim" | "lun" | "mar" | "mer" | "jeu" | "ven" | "sam";
export type HorairesSemaine = Partial<Record<JourSemaine, Creneau[]>>;


const JOURS: JourSemaine[] = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];
const NOMS_JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const JOUR_ANGLAIS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };


function enMinutes(heure: string): number {
  const morceaux = heure.split(":");
  return Number(morceaux[0]) * 60 + Number(morceaux[1] ?? 0);
}


// Le jour (0 = dimanche) et l'heure (en minutes depuis minuit) à Paris
function partiesParis(ms: number): { jour: number; minutes: number } {
  const morceaux = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(ms));
  let jour = 0;
  let heures = 0;
  let minutes = 0;
  for (const morceau of morceaux) {
    if (morceau.type === "weekday") jour = JOUR_ANGLAIS[morceau.value] ?? 0;
    if (morceau.type === "hour") heures = Number(morceau.value) % 24;
    if (morceau.type === "minute") minutes = Number(morceau.value);
  }
  return { jour, minutes: heures * 60 + minutes };
}


function creneauxDuJour(horaires: HorairesSemaine, jour: number): Creneau[] {
  return horaires[JOURS[(jour + 7) % 7]] ?? [];
}


export type StatutHoraires = { etat: "ouvert" | "ferme" | "inconnu"; texte: string };


// Ouvert ou fermé en ce moment ? (ms = l'heure actuelle en millisecondes)
export function statutHoraires(
  horaires: HorairesSemaine | null | undefined,
  ms: number | null
): StatutHoraires {
  if (!horaires || ms === null) return { etat: "inconnu", texte: "" };
  const auMoinsUnCreneau = JOURS.some((j) => (horaires[j] ?? []).length > 0);
  if (!auMoinsUnCreneau) return { etat: "inconnu", texte: "" };


  const { jour, minutes } = partiesParis(ms);


  // 1) Un créneau d'aujourd'hui en cours ?
  for (const [a, b] of creneauxDuJour(horaires, jour)) {
    const debut = enMinutes(a);
    const fin = enMinutes(b);
    const enCours = fin > debut ? minutes >= debut && minutes < fin : minutes >= debut;
    if (enCours) return { etat: "ouvert", texte: "Ouvert · ferme à " + b };
  }


  // 2) Un créneau d'hier qui finit après minuit (ex. 18:00 à 02:00) ?
  for (const [a, b] of creneauxDuJour(horaires, jour - 1)) {
    const debut = enMinutes(a);
    const fin = enMinutes(b);
    if (fin <= debut && minutes < fin) return { etat: "ouvert", texte: "Ouvert · ferme à " + b };
  }


  // 3) Fermé : on cherche la prochaine ouverture
  for (let decalage = 0; decalage < 8; decalage++) {
    const j = (jour + decalage) % 7;
    const creneaux = [...(horaires[JOURS[j]] ?? [])].sort(
      (x, y) => enMinutes(x[0]) - enMinutes(y[0])
    );
    for (const [a] of creneaux) {
      if (decalage === 0 && enMinutes(a) <= minutes) continue;
      const quand = decalage === 0 ? "" : decalage === 1 ? " demain" : " " + NOMS_JOURS[j];
      return { etat: "ferme", texte: "Fermé · ouvre" + quand + " à " + a };
    }
  }
  return { etat: "ferme", texte: "Fermé" };
}


// Le compte à rebours d'une offre
export function tempsRestant(
  finIso: string,
  ms: number | null
): { texte: string; urgent: boolean } | null {
  if (ms === null) return null;
  const reste = new Date(finIso).getTime() - ms;
  if (reste <= 0) return { texte: "Terminée", urgent: true };
  const minutes = Math.ceil(reste / 60000);
  if (minutes < 60) return { texte: "Plus que " + minutes + " min", urgent: true };
  if (minutes < 180) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return { texte: "Encore " + h + " h" + (m > 0 ? " " + String(m).padStart(2, "0") : ""), urgent: false };
  }
  return { texte: "Jusqu'à " + heureParis(finIso), urgent: false };
}


// Vrai si l'offre se termine dans moins d'une heure (l'étoile devient rouge)
export function offreUrgente(finIso: string, ms: number | null): boolean {
  if (ms === null) return false;
  const reste = new Date(finIso).getTime() - ms;
  return reste > 0 && reste <= 60 * 60 * 1000;
}


// Le stock visible : « Plus que 3 ! »
export function stockLibelle(quantite: number | null): { texte: string; urgent: boolean } | null {
  if (quantite === null) return null;
  if (quantite <= 0) return { texte: "Épuisé", urgent: true };
  if (quantite <= 5) return { texte: "Plus que " + quantite + " !", urgent: true };
  return { texte: quantite + " disponibles", urgent: false };
}


export function libelleCategorie(categorie: string): string {
  if (categorie === "loisir") return "Loisir";
  if (categorie === "restaurant") return "Restaurant";
  return "Bar";
}
