import { supabase } from "./supabase";


// L'établissement auquel le compte connecté est rattaché
export type MonEtablissement = {
  id: string;
  nom: string;
  role: "gerant" | "serveur";
};


// Supabase renvoie parfois un objet, parfois une liste d'un seul élément
export type Lie<T> = T | T[] | null;


export function premierLie<T>(valeur: Lie<T>): T | null {
  if (!valeur) return null;
  return Array.isArray(valeur) ? (valeur[0] ?? null) : valeur;
}


// Le nom d'une offre à partir de la ligne liée à une commande
export type OffreLiee = { produit: string | null; nom_plat: string | null; categorie: string | null };


export function nomOffreLiee(offres: Lie<OffreLiee>): string {
  const o = premierLie(offres);
  if (!o) return "Offre";
  if (o.categorie === "plat") return o.nom_plat || "Plat";
  if (o.categorie === "activite") return o.nom_plat || o.produit || "Activité";
  return o.produit || "Boisson";
}


// Gérant d'un bar, ou serveur d'un bar : null si personne n'est connecté ou si le compte n'est rattaché à rien
export async function chargerMonEtablissement(): Promise<MonEtablissement | null> {
  const { data: session } = await supabase.auth.getSession();
  const idUtilisateur = session.session?.user.id;
  if (!idUtilisateur) return null;


  const { data: bars } = await supabase
    .from("bars")
    .select("id, nom")
    .eq("owner_id", idUtilisateur)
    .limit(1);
  if (bars && bars.length > 0) {
    return { id: String(bars[0].id), nom: bars[0].nom as string, role: "gerant" };
  }


  const { data: lignes } = await supabase
    .from("serveurs")
    .select("bar_id")
    .eq("user_id", idUtilisateur)
    .eq("actif", true)
    .limit(1);
  if (!lignes || lignes.length === 0) return null;


  const { data: bar } = await supabase.from("bars").select("id, nom").eq("id", lignes[0].bar_id).limit(1);
  if (!bar || bar.length === 0) return null;
  return { id: String(bar[0].id), nom: bar[0].nom as string, role: "serveur" };
}


// Le « badge » de la personne connectée, à envoyer aux routes serveur
export async function jetonSession(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
