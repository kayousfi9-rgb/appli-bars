import { NextRequest, NextResponse } from "next/server";
import { stripe } from "../../../lib/stripe";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { signalerProbleme } from "../../../lib/alertes";


// Cette route cherche les paiements Stripe réussis qui n'ont aucune commande dans Happyvo
// (client débité, commande jamais créée). Elle ne corrige rien toute seule : elle écrit
// une ligne dans la table alertes_systeme pour que tu puisses rembourser à la main.
// Vercel l'appelle une fois par jour (fichier vercel.json) avec le mot de passe CRON_SECRET.


const MAX_SESSIONS = 500;


export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ erreur: "CRON_SECRET n'est pas défini." }, { status: 500 });
  }
  const entete = request.headers.get("authorization") ?? "";
  const cle = request.nextUrl.searchParams.get("cle") ?? "";
  if (entete !== "Bearer " + secret && cle !== secret) {
    return NextResponse.json({ erreur: "Accès refusé." }, { status: 401 });
  }


  // On ignore les paiements des dernières minutes : le temps que la commande se crée.
  const delaiBrut = Number(request.nextUrl.searchParams.get("delai") ?? "15");
  const delaiMinutes = Number.isFinite(delaiBrut) && delaiBrut >= 0 ? delaiBrut : 15;
  const maintenant = Math.floor(Date.now() / 1000);
  const depuis = maintenant - 48 * 3600;
  const jusqua = maintenant - Math.round(delaiMinutes * 60);


  const payees: { id: string; montant: number | null; email: string | null; paiement: string | null; cree: number }[] = [];
  let vues = 0;
  for await (const session of stripe.checkout.sessions.list({ created: { gte: depuis, lte: jusqua }, limit: 100 })) {
    vues += 1;
    if (vues > MAX_SESSIONS) break;
    if (session.payment_status !== "paid") continue;
    const paiement = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
    payees.push({
      id: session.id,
      montant: session.amount_total,
      email: session.customer_details?.email ?? null,
      paiement,
      cree: session.created,
    });
  }


  if (payees.length === 0) {
    return NextResponse.json({ verifiees: 0, orphelines: 0 });
  }


  const { data: lignes, error } = await supabaseAdmin
    .from("commandes")
    .select("stripe_session_id")
    .in("stripe_session_id", payees.map((s) => s.id));
  if (error) {
    await signalerProbleme("Contrôle des paiements : lecture des commandes impossible", { message: error.message });
    return NextResponse.json({ erreur: "Lecture des commandes impossible : " + error.message }, { status: 500 });
  }
  const connues = new Set((lignes ?? []).map((l) => String(l.stripe_session_id)));
  const orphelines = payees.filter((s) => !connues.has(s.id));


  if (orphelines.length > 0) {
    const { error: erreurAlerte } = await supabaseAdmin.from("alertes_systeme").upsert(
      orphelines.map((s) => ({
        type: "paiement_sans_commande",
        reference: s.id,
        details: {
          montant_centimes: s.montant,
          email: s.email,
          payment_intent: s.paiement,
          cree_le: new Date(s.cree * 1000).toISOString(),
        },
      })),
      { onConflict: "reference", ignoreDuplicates: true }
    );
    if (erreurAlerte) {
      await signalerProbleme("Contrôle des paiements : écriture de l'alerte impossible", { message: erreurAlerte.message });
      return NextResponse.json({ erreur: "Écriture de l'alerte impossible : " + erreurAlerte.message }, { status: 500 });
    }
    await signalerProbleme("Paiement(s) Stripe réussi(s) sans commande", {
      nombre: orphelines.length,
      references: orphelines.map((s) => s.id),
    });
  }


  return NextResponse.json({ verifiees: payees.length, orphelines: orphelines.length });
}

