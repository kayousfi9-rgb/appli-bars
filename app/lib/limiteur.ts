import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "./supabaseAdmin";


// Compte les appels d'une même « clé » (une personne, une adresse...) sur une période.
// Renvoie true si la limite est dépassée : il faut alors refuser l'appel.
// Si le compteur lui-même tombe en panne, on laisse passer : mieux vaut ne bloquer
// personne par erreur que de couper l'application.
export async function limiteAtteinte(cle: string, maximum: number, secondes: number): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc("limiter_appel", {
    p_cle: cle,
    p_max: maximum,
    p_secondes: secondes,
  });
  if (error) return false;
  return data === false;
}


// L'adresse de la personne qui appelle (Vercel la donne dans l'en-tête x-forwarded-for).
export function adresseAppelant(request: NextRequest): string {
  const liste = request.headers.get("x-forwarded-for") ?? "";
  const premiere = liste.split(",")[0]?.trim();
  return premiere && premiere.length > 0 ? premiere : "inconnue";
}


export function reponseTropDeDemandes() {
  return NextResponse.json(
    { erreur: "Trop de demandes en peu de temps. Réessaie dans quelques minutes." },
    { status: 429, headers: { "Retry-After": "60" } }
  );
}
