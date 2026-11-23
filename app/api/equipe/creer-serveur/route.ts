import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { barDuGerant, utilisateurDepuisRequete } from "../../../lib/authRoutes";


const MAX_SERVEURS = 10;


export async function POST(request: NextRequest) {
  // 1) Qui appelle ? Il faut être connecté ET être gérant d'un bar.
  const utilisateur = await utilisateurDepuisRequete(request);
  if (!utilisateur) {
    return NextResponse.json({ erreur: "Tu dois être connecté." }, { status: 401 });
  }
  const bar = await barDuGerant(utilisateur.id);
  if (!bar) {
    return NextResponse.json({ erreur: "Seul le gérant d'un établissement peut créer un serveur." }, { status: 403 });
  }


  // 2) On lit et on contrôle ce qui a été tapé.
  const corps = (await request.json().catch(() => null)) as {
    prenom?: string;
    email?: string;
    motDePasse?: string;
  } | null;
  const prenom = (corps?.prenom ?? "").trim();
  const email = (corps?.email ?? "").trim().toLowerCase();
  const motDePasse = corps?.motDePasse ?? "";


  if (prenom.length < 2 || prenom.length > 40) {
    return NextResponse.json({ erreur: "Le prénom doit faire entre 2 et 40 caractères." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ erreur: "L'adresse e-mail n'a pas l'air valide." }, { status: 400 });
  }
  if (motDePasse.length < 8) {
    return NextResponse.json({ erreur: "Le mot de passe doit faire au moins 8 caractères." }, { status: 400 });
  }


  // 3) Pas plus de 10 serveurs par établissement.
  const { count } = await supabaseAdmin
    .from("serveurs")
    .select("id", { count: "exact", head: true })
    .eq("bar_id", bar.id);
  if ((count ?? 0) >= MAX_SERVEURS) {
    return NextResponse.json({ erreur: "Tu as atteint la limite de " + MAX_SERVEURS + " serveurs." }, { status: 400 });
  }


  // 4) On crée le compte de connexion du serveur.
  const { data: cree, error: erreurCompte } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: motDePasse,
    email_confirm: true,
    user_metadata: { role: "serveur", prenom },
  });
  if (erreurCompte || !cree.user) {
    return NextResponse.json(
      { erreur: "Création du compte impossible : " + (erreurCompte?.message ?? "erreur inconnue") },
      { status: 400 }
    );
  }


  // 5) On le rattache à l'établissement. Si ça rate, on supprime le compte pour ne rien laisser traîner.
  const { error: erreurLigne } = await supabaseAdmin.from("serveurs").insert({
    bar_id: bar.id,
    user_id: cree.user.id,
    prenom,
    email,
  });
  if (erreurLigne) {
    await supabaseAdmin.auth.admin.deleteUser(cree.user.id);
    return NextResponse.json({ erreur: "Rattachement impossible : " + erreurLigne.message }, { status: 500 });
  }


  return NextResponse.json({ ok: true });
}
