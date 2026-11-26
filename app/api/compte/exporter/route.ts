import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { utilisateurDepuisRequete } from "../../../lib/authRoutes";
import { adresseAppelant, limiteAtteinte, reponseTropDeDemandes } from "../../../lib/limiteur";


// Lit toutes les lignes d'une table qui appartiennent à la personne.
// Les noms de colonnes de certaines tables ne sont pas tous connus d'avance : on essaie les
// colonnes possibles l'une après l'autre. Si aucune ne marche, on le dit dans le fichier.
async function lireTable(table: string, colonnes: string[], id: string): Promise<unknown> {
  for (const colonne of colonnes) {
    const { data, error } = await supabaseAdmin.from(table).select("*").eq(colonne, id);
    if (!error) return data;
  }
  return "non disponible";
}


export async function GET(request: NextRequest) {
  if (await limiteAtteinte("exporter:ip:" + adresseAppelant(request), 30, 60)) {
    return reponseTropDeDemandes();
  }
  const utilisateur = await utilisateurDepuisRequete(request);
  if (!utilisateur) {
    return NextResponse.json({ erreur: "Tu dois être connecté." }, { status: 401 });
  }
  if (await limiteAtteinte("exporter:u:" + utilisateur.id, 5, 3600)) {
    return reponseTropDeDemandes();
  }


  const { data: compteAuth } = await supabaseAdmin.auth.admin.getUserById(utilisateur.id);
  const compte = {
    id: utilisateur.id,
    email: compteAuth.user?.email ?? null,
    cree_le: compteAuth.user?.created_at ?? null,
    derniere_connexion: compteAuth.user?.last_sign_in_at ?? null,
  };


  const [profil, commandes, favoris, notifications, signalements, consentements] = await Promise.all([
    lireTable("clients", ["id", "user_id"], utilisateur.id),
    lireTable("commandes", ["client_id"], utilisateur.id),
    lireTable("favoris", ["client_id", "user_id"], utilisateur.id),
    lireTable("notifications", ["client_id", "user_id"], utilisateur.id),
    lireTable("signalements", ["client_id", "user_id"], utilisateur.id),
    lireTable("consentements", ["user_id"], utilisateur.id),
  ]);


  const { count: appareils } = await supabaseAdmin
    .from("abonnements_push")
    .select("*", { count: "exact", head: true })
    .eq("client_id", utilisateur.id);


  const contenu = JSON.stringify(
    {
      exporte_le: new Date().toISOString(),
      compte,
      profil,
      commandes,
      favoris,
      notifications,
      signalements,
      consentements,
      appareils_avec_notifications: appareils ?? 0,
    },
    null,
    2
  );


  return new NextResponse(contenu, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="mes-donnees-happyvo.json"',
      "Cache-Control": "no-store",
    },
  });
}
