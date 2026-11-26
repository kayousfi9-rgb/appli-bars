import { NextRequest, NextResponse } from "next/server";
import { stripe } from "../../../lib/stripe";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { barDuGerant, utilisateurDepuisRequete } from "../../../lib/authRoutes";
import { adresseAppelant, limiteAtteinte, reponseTropDeDemandes } from "../../../lib/limiteur";
import { signalerProbleme } from "../../../lib/alertes";


type Corps = {
  signalementId?: string;
  decision?: "rembourser" | "refuser";
  reponse?: string;
};


export async function POST(request: NextRequest) {
  // Premier filet : pas plus de 60 appels par minute depuis une même adresse.
  if (await limiteAtteinte("rembourser:ip:" + adresseAppelant(request), 60, 60)) {
    return reponseTropDeDemandes();
  }


  // Il faut être connecté ET gérant d'un bar.
  const utilisateur = await utilisateurDepuisRequete(request);
  if (!utilisateur) {
    return NextResponse.json({ erreur: "Tu dois être connecté." }, { status: 401 });
  }
  // Second filet : une limite par personne connectée et par heure.
  if (await limiteAtteinte("rembourser:u:" + utilisateur.id, 30, 3600)) {
    return reponseTropDeDemandes();
  }
  const bar = await barDuGerant(utilisateur.id);
  if (!bar) {
    return NextResponse.json({ erreur: "Réservé au gérant." }, { status: 403 });
  }


  const corps = (await request.json().catch(() => null)) as Corps | null;
  if (!corps?.signalementId || (corps.decision !== "rembourser" && corps.decision !== "refuser")) {
    return NextResponse.json({ erreur: "Demande incomplète." }, { status: 400 });
  }
  const reponse = (corps.reponse ?? "").trim().slice(0, 300) || null;


  // On relit le signalement DANS LA BASE, et on vérifie qu'il concerne CE bar.
  const { data: signalement } = await supabaseAdmin
    .from("signalements")
    .select("id, commande_id, bar_id, statut")
    .eq("id", corps.signalementId)
    .maybeSingle();
  if (!signalement || String(signalement.bar_id) !== bar.id) {
    return NextResponse.json({ erreur: "Signalement introuvable." }, { status: 404 });
  }
  if (signalement.statut !== "ouvert") {
    return NextResponse.json({ erreur: "Ce signalement a déjà été traité." }, { status: 409 });
  }


  // Refus : on note la décision, rien d'autre.
  if (corps.decision === "refuser") {
    await supabaseAdmin
      .from("signalements")
      .update({ statut: "refuse", reponse, traite_le: new Date().toISOString() })
      .eq("id", signalement.id);
    return NextResponse.json({ ok: true, resultat: "refuse" });
  }


  // Remboursement : on relit la commande.
  const { data: commande } = await supabaseAdmin
    .from("commandes")
    .select("id, statut, prix_paye, stripe_payment_intent_id, rembourse_le")
    .eq("id", signalement.commande_id)
    .maybeSingle();
  if (!commande) {
    return NextResponse.json({ erreur: "Commande introuvable." }, { status: 404 });
  }
  if (commande.rembourse_le) {
    return NextResponse.json({ erreur: "Cette commande est déjà remboursée." }, { status: 409 });
  }
  if (!commande.stripe_payment_intent_id) {
    return NextResponse.json({ erreur: "Aucun paiement Stripe lié à cette commande (commande de test ?)." }, { status: 400 });
  }


  // On demande le remboursement à Stripe. L'argent est repris au bar,
  //    et la commission de Happyvo est rendue aussi.
  //    La clé d'idempotence empêche un double remboursement si on clique deux fois.
  let idRemboursement: string;
  try {
    const remboursement = await stripe.refunds.create(
      {
        payment_intent: commande.stripe_payment_intent_id as string,
        reverse_transfer: true,
        refund_application_fee: true,
        metadata: { commande_id: String(commande.id), signalement_id: String(signalement.id) },
      },
      { idempotencyKey: "remboursement-" + commande.id }
    );
    idRemboursement = remboursement.id;
  } catch (erreur) {
    const message = erreur instanceof Error ? erreur.message : "erreur inconnue";
    await signalerProbleme("Remboursement refusé par Stripe", { commande_id: String(commande.id), message });
    return NextResponse.json({ erreur: "Stripe a refusé le remboursement : " + message }, { status: 502 });
  }


  // On note tout dans la base. Une commande pas encore récupérée devient inutilisable.
  const { error: erreurMaj } = await supabaseAdmin
    .from("commandes")
    .update({
      rembourse_le: new Date().toISOString(),
      stripe_refund_id: idRemboursement,
      statut: commande.statut === "payee" ? "expiree" : commande.statut,
    })
    .eq("id", commande.id);
  if (erreurMaj) {
    await signalerProbleme("Remboursement effectué chez Stripe mais commande non mise à jour", {
      commande_id: String(commande.id),
      remboursement: idRemboursement,
      message: erreurMaj.message,
    });
  }


  await supabaseAdmin
    .from("signalements")
    .update({ statut: "rembourse", reponse, traite_le: new Date().toISOString() })
    .eq("id", signalement.id);


  return NextResponse.json({ ok: true, resultat: "rembourse" });
}
