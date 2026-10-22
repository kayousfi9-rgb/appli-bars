import { supabase } from "./supabase";

import type {

  InfosOffreCommande,

  MonBar,

  Relie,

  StatutCommande,

} from "./types";

// Les libellés affichés à l'écran, en français.

export const LIBELLES_STATUT: Record<StatutCommande, string> = {

  payee: "À récupérer",

  recuperee: "Récupérée",

  expiree: "Expirée",

};

// Supabase renvoie parfois une liste au lieu d'un objet : on prend le premier.

export function premier<T>(valeur: Relie<T>): T | null {

  if (!valeur) return null;

  return Array.isArray(valeur) ? valeur[0] ?? null : valeur;

}

// Le nom à afficher : le nom du plat pour un plat, le produit pour une boisson.

export function nomOffre(offres: Relie<InfosOffreCommande>): string {

  const offre = premier(offres);

  if (!offre) return "Offre";

  if (offre.categorie === "plat") return offre.nom_plat || "Plat";

  return offre.produit || "Boisson";

}

// Le vrai statut à afficher : une commande « payee » dont l'heure limite

// est passée est affichée « expiree », même si le robot n'est pas encore passé.

export function statutReel(statut: StatutCommande, expireLe: string | null): StatutCommande {

  if (statut === "payee" && expireLe && new Date(expireLe).getTime() < Date.now()) {

    return "expiree";

  }

  return statut;

}

// 22/10 à 21:30

export function formaterDateHeure(iso: string | null | undefined): string {

  if (!iso) return "";

  const date = new Date(iso);

  if (isNaN(date.getTime())) return "";

  const jour = date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });

  const heure = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return jour + " à " + heure;

}

// 4,50 €

export function formaterEuros(montant: number | null | undefined): string {

  const valeur = Number(montant ?? 0);

  return valeur.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

}

// Retrouve le bar du gérant connecté. Renvoie null si personne n'est connecté

// ou si ce compte n'a pas de bar.

export async function chargerMonBar(): Promise<MonBar | null> {

  const { data: session } = await supabase.auth.getSession();

  const idUtilisateur = session.session?.user.id;

  if (!idUtilisateur) return null;

  const { data } = await supabase

    .from("bars")

    .select("id, nom")

    .eq("gerant_id", idUtilisateur)

    .limit(1);

  if (!data || data.length === 0) return null;

  return data[0] as MonBar;

}
