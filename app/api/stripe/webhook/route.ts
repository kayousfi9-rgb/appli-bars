import { NextRequest, NextResponse } from "next/server";

import { stripe } from "../../../lib/stripe";

import { supabaseAdmin } from "../../../lib/supabaseAdmin";

import Stripe from "stripe";

import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {

  const corpsBrut = await request.text();

  const signature = request.headers.get("stripe-signature");

  let evenement: Stripe.Event;

  // 1. On vérifie que la notification vient bien de Stripe et pas d'un petit malin.

  try {

    evenement = stripe.webhooks.constructEvent(

      corpsBrut,

      signature!,

      process.env.STRIPE_WEBHOOK_SECRET!

    );

  } catch (err) {

    return NextResponse.json({ erreur: "Signature invalide" }, { status: 400 });

  }

  // 2. Un paiement confirmé : on crée la commande.

  if (evenement.type === "checkout.session.completed") {

    const session = evenement.data.object as Stripe.Checkout.Session;

    const offreId = session.metadata?.offre_id;

    const clientId = session.metadata?.client_id;

    const barId = session.metadata?.bar_id;

    if (!offreId || !clientId || !barId) {

      return NextResponse.json({ recu: true });

    }

    // Sécurité : on ignore si cette session a déjà créé une commande.

    const { data: dejaLa } = await supabaseAdmin

      .from("commandes")

      .select("id")

      .eq("stripe_session_id", session.id)

      .maybeSingle();

    if (dejaLa) {

      return NextResponse.json({ recu: true });

    }

    const prixPaye = (session.amount_total ?? 0) / 100;

    const commission = Math.round(prixPaye * 0.05 * 100) / 100;

    // Le jeton unique encodé dans le QR code : imprévisible, impossible à deviner.

    const qrToken = randomUUID();

    await supabaseAdmin.from("commandes").insert({

      offre_id: offreId,

      client_id: clientId,

      bar_id: barId,

      prix_paye: prixPaye,

      commission: commission,

      stripe_session_id: session.id,

      stripe_payment_intent_id: session.payment_intent as string,

      qr_token: qrToken,

      statut: "payee",

    });

    // On décrémente le stock de l'offre.

    await supabaseAdmin.rpc("decrementer_quantite", { offre: offreId });

  }

  // 3. Un bar a terminé son inscription Stripe.

  if (evenement.type === "account.updated") {

    const compte = evenement.data.object as Stripe.Account;

    if (compte.charges_enabled && compte.details_submitted) {

      await supabaseAdmin

        .from("bars")

        .update({ stripe_onboarding_complete: true })

        .eq("stripe_account_id", compte.id);

    }

  }

  return NextResponse.json({ recu: true });

}
