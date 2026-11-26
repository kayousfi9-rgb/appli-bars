import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { barDuGerant, utilisateurDepuisRequete } from "../../../lib/authRoutes";
import { adresseAppelant, limiteAtteinte, reponseTropDeDemandes } from "../../../lib/limiteur";


// Colonnes d'identité qu'on vide dans la table clients si elles existent.
const COLONNES_IDENTITE = ["prenom", "nom", "email", "telephone", "pseudo"];


export async function POST(request: NextRequest) {
  if (await limiteAtteinte("supprimer-compte:ip:" + adresseAppelant(request), 30, 60)) {
    return reponseTropDeDemandes();
  }
  const utilisateur = await utilisateurDepuisRequete(request);
  if (!utilisateur) {
    return NextResponse.json({ erreur: "Tu dois être connecté." }, { status: 401 });
  }
  if (await limiteAtteinte("supprimer-compte:u:" + utilisateur.id, 5, 86400)) {
    return reponseTropDeDemandes();
  }


  const corps = (await request.json().catch(() => null)) as { confirmation?: string } | null;
  if (corps?.confirmation !== "SUPPRIMER") {
    return NextResponse.json({ erreur: "Écris SUPPRIMER pour confirmer." }, { status: 400 });
  }


  // Un gérant ou un serveur ne supprime pas son compte lui-même : cela toucherait un établissement.
  const bar = await barDuGerant(utilisateur.id);
  if (bar) {
    return NextResponse.json(
      { erreur: "Ce compte gère un établissement. Contacte-nous pour le supprimer." },
      { status: 403 }
    );
  }
  const { data: serveur } = await supabaseAdmin.from("serveurs").select("id").eq("user_id", utilisateur.id).limit(1);
  if (serveur && serveur.length > 0) {
    return NextResponse.json(
      { erreur: "Ce compte fait partie d'une équipe d'établissement. Demande au gérant de le retirer." },
      { status: 403 }
    );
  }


  // Pas de suppression tant qu'une commande payée attend d'être récupérée.
  const { data: enCours } = await supabaseAdmin
    .from("commandes")
    .select("id")
    .eq("client_id", utilisateur.id)
    .eq("statut", "payee")
    .gt("expire_le", new Date().toISOString())
    .limit(1);
  if (enCours && enCours.length > 0) {
    return NextResponse.json(
      { erreur: "Tu as une commande payée à récupérer. Récupère-la ou attends son expiration avant de supprimer ton compte." },
      { status: 409 }
    );
  }


  // On efface les données qui ne servent qu'à l'usage de l'appli.
  for (const table of ["favoris", "notifications", "abonnements_push"]) {
    await supabaseAdmin.from(table).delete().eq("client_id", utilisateur.id);
  }


  // On vide les champs d'identité du profil (chaque essai ignore les colonnes qui n'existent pas).
  for (const colonneId of ["id", "user_id"]) {
    for (const colonne of COLONNES_IDENTITE) {
      const vide: Record<string, null> = { [colonne]: null };
      await supabaseAdmin.from("clients").update(vide).eq(colonneId, utilisateur.id);
    }
  }


  // Le compte de connexion est rendu anonyme et bloqué. On ne le supprime pas : les commandes passées
  // doivent rester dans la comptabilité, sans qu'on puisse retrouver la personne.
  const { error } = await supabaseAdmin.auth.admin.updateUserById(utilisateur.id, {
    email: "supprime-" + utilisateur.id + "@compte-supprime.invalid",
    password: randomUUID() + randomUUID(),
    email_confirm: true,
    user_metadata: {},
    ban_duration: "876000h",
  });
  if (error) {
    return NextResponse.json({ erreur: "Suppression impossible : " + error.message }, { status: 500 });
  }


  await supabaseAdmin
    .from("comptes_supprimes")
    .upsert({ user_id: utilisateur.id }, { onConflict: "user_id", ignoreDuplicates: true });


  // On coupe toutes les sessions encore ouvertes.
  const jeton = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (jeton) await supabaseAdmin.auth.admin.signOut(jeton, "global");


  return NextResponse.json({ ok: true });
}
