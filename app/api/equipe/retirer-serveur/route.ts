import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { barDuGerant, utilisateurDepuisRequete } from "../../../lib/authRoutes";
import { adresseAppelant, limiteAtteinte, reponseTropDeDemandes } from "../../../lib/limiteur";


export async function POST(request: NextRequest) {
  // Premier filet : pas plus de 60 appels par minute depuis une même adresse.
  if (await limiteAtteinte("retirer-serveur:ip:" + adresseAppelant(request), 60, 60)) {
    return reponseTropDeDemandes();
  }


  const utilisateur = await utilisateurDepuisRequete(request);
  if (!utilisateur) {
    return NextResponse.json({ erreur: "Tu dois être connecté." }, { status: 401 });
  }
  // Second filet : une limite par personne connectée et par heure.
  if (await limiteAtteinte("retirer-serveur:u:" + utilisateur.id, 30, 3600)) {
    return reponseTropDeDemandes();
  }
  const bar = await barDuGerant(utilisateur.id);
  if (!bar) {
    return NextResponse.json({ erreur: "Réservé au gérant." }, { status: 403 });
  }


  const corps = (await request.json().catch(() => null)) as { serveurId?: string } | null;
  if (!corps?.serveurId) {
    return NextResponse.json({ erreur: "serveurId manquant." }, { status: 400 });
  }


  // On retrouve le serveur ET on vérifie qu'il travaille bien dans CE bar.
  const { data: serveur } = await supabaseAdmin
    .from("serveurs")
    .select("id, user_id, bar_id")
    .eq("id", corps.serveurId)
    .maybeSingle();
  if (!serveur || String(serveur.bar_id) !== bar.id) {
    return NextResponse.json({ erreur: "Serveur introuvable." }, { status: 404 });
  }


  // On supprime son compte de connexion (la ligne « serveurs » part avec lui).
  const { error } = await supabaseAdmin.auth.admin.deleteUser(serveur.user_id as string);
  if (error) {
    return NextResponse.json({ erreur: "Suppression impossible : " + error.message }, { status: 500 });
  }
  await supabaseAdmin.from("serveurs").delete().eq("id", serveur.id);


  return NextResponse.json({ ok: true });
}
