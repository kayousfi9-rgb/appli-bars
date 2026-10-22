import { NextRequest, NextResponse } from "next/server";

import { stripe } from "../../../lib/stripe";

import { supabase } from "../../../lib/supabase";

export async function POST(request: NextRequest) {

  const { offreId } = await request.json();

  if (!offreId) {

    return NextResponse.json({ erreur: "offreId manquant" }, { status: 400 });

  }

  // 1. On relit l'offre et son prix DANS LA BASE, jamais depuis le navigateur.

  const { data: offre, error: erreurOffre } = await supabase

    .from("offres")

    .select("id, produit, nom_plat, categorie, prix_reduit, quantite, fin, bars(id, nom, stripe_account_id, stripe_onboarding_complete)")

    .eq("id", offreId)

    .single();

  if (erreurOffre || !offre) {

    return NextResponse.json({ erreur: "Offre introuvable" }, { status: 404 });

  }

  const bar = Array.isArray(offre.bars) ? offre.bars[0] : offre.bars;

  // 2. On vérifie que le bar peut bien encaisser.

  if (!bar || !bar.stripe_account_id || !bar.stripe_onboarding_complete) {

    return NextResponse.json({ erreur: "Ce bar ne peut pas encore encaisser de paiement" }, { status: 400 });

  }

  // 3. On vérifie que l'offre est encore valable et qu'il reste du stock.

  if (new Date(offre.fin) < new Date()) {

    return NextResponse.json({ erreur: "Cette offre est terminée" }, { status: 400 });

  }

  if (offre.quantite <= 0) {

    return NextResponse.json({ erreur: "Il n'y a plus de stock pour cette offre" }, { status: 400 });

  }

  // 4. On calcule le prix en centimes (Stripe travaille toujours en centimes) et la commission.

  const prixEnCentimes = Math.round(offre.prix_reduit * 100);

  const commissionEnCentimes = Math.round(prixEnCentimes * 0.10);

  const nomAffiche = offre.categorie === "plat" ? offre.nom_plat : offre.produit;

  // 5. On récupère l'utilisateur connecté.

  const authHeader = request.headers.get("authorization");

  const { data: { user } } = await supabase.auth.getUser(authHeader?.replace("Bearer ", ""));

  if (!user) {

    return NextResponse.json({ erreur: "Tu dois être connecté pour acheter" }, { status: 401 });

  }

  // 6. On crée la session de paiement Stripe Checkout.

  const session = await stripe.checkout.sessions.create({

    mode: "payment",


    line_items: [

      {

        price_data: {

          currency: "eur",

          product_data: { name: nomAffiche || "Offre" },

          unit_amount: prixEnCentimes,

        },

        quantity: 1,

      },

    ],

    payment_intent_data: {

      application_fee_amount: commissionEnCentimes,

      transfer_data: {

        destination: bar.stripe_account_id,

      },

    },

    metadata: {

      offre_id: offre.id,

      client_id: user.id,

      bar_id: bar.id,

    },

    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/paiement-succes`,

    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/paiement-annule`,

  });

  return NextResponse.json({ url: session.url });

}
