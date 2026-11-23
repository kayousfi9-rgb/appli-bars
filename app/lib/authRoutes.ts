import type { NextRequest } from "next/server";
import { supabaseAdmin } from "./supabaseAdmin";


// Qui appelle cette route ? On lit le « badge » (jeton) envoyé par le navigateur
// et on demande à Supabase de le vérifier. Renvoie null si le badge est absent ou faux.
export async function utilisateurDepuisRequete(request: NextRequest): Promise<{ id: string } | null> {
  const entete = request.headers.get("authorization") ?? "";
  const jeton = entete.replace(/^Bearer\s+/i, "").trim();
  if (!jeton) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(jeton);
  if (error || !data.user) return null;
  return { id: data.user.id };
}


// Le bar dont cette personne est le gérant (propriétaire)
export async function barDuGerant(idUtilisateur: string): Promise<{ id: string; nom: string } | null> {
  const { data } = await supabaseAdmin
    .from("bars")
    .select("id, nom")
    .eq("owner_id", idUtilisateur)
    .limit(1);
  if (!data || data.length === 0) return null;
  return { id: String(data[0].id), nom: data[0].nom as string };
}
