import { NextRequest, NextResponse } from "next/server";

import { stripe } from "../../../lib/stripe";
import { supabase } from "../../../lib/supabase";

export async function POST(request: NextRequest) {

  const { barId } = await request.json();

  if (!barId) {

    return NextResponse.json({ erreur: "barId manquant" }, { status: 400 });

  }

  const { data: bar, error: erreurBar } = await supabase

    .from("bars")

    .select("id, nom, stripe_account_id")

    .eq("id", barId)

    .single();

  if (erreurBar || !bar) {

    return NextResponse.json({ erreur: "Bar introuvable" }, { status: 404 });

  }

  let accountId = bar.stripe_account_id;

  if (!accountId) {

    const account = await stripe.accounts.create({

      type: "standard",

    });

    accountId = account.id;

    await supabase

      .from("bars")

      .update({ stripe_account_id: accountId })

      .eq("id", barId);

  }

  const lienOnboarding = await stripe.accountLinks.create({

    account: accountId,

    refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/gerant?stripe=retry`,

    return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/gerant?stripe=retour`,

    type: "account_onboarding",

  });

  return NextResponse.json({ url: lienOnboarding.url });

}
