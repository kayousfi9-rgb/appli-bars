import { NextRequest, NextResponse } from "next/server";
import { stripe } from "../../../lib/stripe";
import { supabase } from "../../../lib/supabase";

export async function POST(request: NextRequest) {
  try {
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
      return NextResponse.json(
        { erreur: "Bar introuvable" + (erreurBar ? " (" + erreurBar.message + ")" : "") },
        { status: 404 }
      );
    }

    // Si NEXT_PUBLIC_SITE_URL n'est pas défini dans .env.local, on prend l'adresse du site en cours.
    const base = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;

    let accountId = bar.stripe_account_id;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "standard",
      });
      accountId = account.id;

      await supabase.from("bars").update({ stripe_account_id: accountId }).eq("id", barId);
    }

    const lienOnboarding = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: base + "/gerant?stripe=retry",
      return_url: base + "/gerant?stripe=retour",
      type: "account_onboarding",
    });

    return NextResponse.json({ url: lienOnboarding.url });
  } catch (erreur) {
    // On renvoie toujours du JSON, avec le vrai message de Stripe ou du serveur.
    const message = erreur instanceof Error ? erreur.message : "Erreur inconnue";
    console.error("creer-compte-connect :", message);
    return NextResponse.json({ erreur: message }, { status: 500 });
  }
}