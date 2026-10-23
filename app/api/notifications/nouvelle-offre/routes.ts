import { NextRequest, NextResponse } from "next/server";

import webpush from "web-push";

import { supabaseAdmin } from "../../../lib/supabaseAdmin";

import { distanceKm } from "../../../lib/distance";

// Ce que Supabase nous envoie quand une offre est créée.

type OffreRecue = {

  id: string;

  bar_id: string;

  produit: string | null;

  nom_plat: string | null;

  categorie: string | null;

  prix_reduit: number | null;

  fin: string | null;

};

// Un même client ne reçoit pas plus d'une notification par bar pendant ce délai.

const DELAI_ANTI_SPAM_HEURES = 2;

export async function POST(request: NextRequest) {

  // 1) On vérifie que c'est bien Supabase qui appelle, avec le bon mot de passe.

  const secretAttendu = process.env.NOTIFICATIONS_WEBHOOK_SECRET;

  const secretRecu = request.headers.get("x-secret-webhook");

  if (!secretAttendu || secretRecu !== secretAttendu) {

    return NextResponse.json({ erreur: "Non autorisé" }, { status: 401 });

  }

  // 2) On lit l'offre qui vient d'être créée.

  const corps = await request.json();

  if (corps?.type !== "INSERT" || corps?.table !== "offres" || !corps?.record) {

    return NextResponse.json({ ignore: true });

  }

  const offre = corps.record as OffreRecue;

  // 3) On relit le bar dans la base (nom et position).

  const { data: bar } = await supabaseAdmin

    .from("bars")

    .select("id, nom, latitude, longitude")

    .eq("id", offre.bar_id)

    .single();

  if (!bar) {

    return NextResponse.json({ erreur: "Bar introuvable" }, { status: 404 });

  }

  const destinataires = new Set<string>();

  // 4) Les clients qui ont ce bar en favori (sauf ceux qui ont décoché « favoris »).

  const { data: fans } = await supabaseAdmin

    .from("favoris")

    .select("client_id")

    .eq("bar_id", bar.id);

  const idsFans: string[] = (fans ?? []).map((f) => f.client_id);

  if (idsFans.length > 0) {

    const { data: refus } = await supabaseAdmin

      .from("preferences_notifications")

      .select("client_id")

      .in("client_id", idsFans)

      .eq("favoris", false);

    const ontRefuse = new Set((refus ?? []).map((r) => r.client_id));

    for (const id of idsFans) {

      if (!ontRefuse.has(id)) destinataires.add(id);

    }

  }

  // 5) Les clients dont la zone est assez proche du bar.

  if (bar.latitude !== null && bar.longitude !== null) {

    const { data: voisins } = await supabaseAdmin

      .from("preferences_notifications")

      .select("client_id, latitude, longitude, rayon_km")

      .eq("proximite", true)

      .not("latitude", "is", null)

      .not("longitude", "is", null);

    for (const v of voisins ?? []) {

      const distance = distanceKm(

        Number(v.latitude),

        Number(v.longitude),

        Number(bar.latitude),

        Number(bar.longitude)

      );

      if (distance <= Number(v.rayon_km ?? 1)) destinataires.add(v.client_id);

    }

  }

  // 6) L'anti-spam : on retire ceux déjà prévenus pour ce bar récemment.

  if (destinataires.size > 0) {

    const depuis = new Date(Date.now() - DELAI_ANTI_SPAM_HEURES * 3600 * 1000).toISOString();

    const { data: recentes } = await supabaseAdmin

      .from("notifications")

      .select("client_id")

      .eq("bar_id", bar.id)

      .gte("cree_le", depuis)

      .in("client_id", Array.from(destinataires));

    for (const r of recentes ?? []) destinataires.delete(r.client_id);

  }

  if (destinataires.size === 0) {

    return NextResponse.json({ destinataires: 0, push: 0 });

  }

  // 7) Le texte de la notification.

  const nomOffre = offre.categorie === "plat" ? offre.nom_plat : offre.produit;

  const prix =

    offre.prix_reduit !== null

      ? Number(offre.prix_reduit).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })

      : "";

  // Le serveur Vercel est à l'heure anglaise : on force l'heure de Paris.

  const heureFin = offre.fin

    ? new Date(offre.fin).toLocaleTimeString("fr-FR", {

        hour: "2-digit",

        minute: "2-digit",

        timeZone: "Europe/Paris",

      })

    : "";

  const titre = bar.nom as string;

  const texte =

    "Nouvelle offre : " +

    (nomOffre || "offre du moment") +

    (prix ? " à " + prix : "") +

    (heureFin ? ", jusqu'à " + heureFin : "");

  const lien = "/";

  const liste = Array.from(destinataires);

  // 8) La notification dans l'appli, pour chaque client concerné.

  await supabaseAdmin.from("notifications").insert(

    liste.map((clientId) => ({

      client_id: clientId,

      bar_id: bar.id,

      offre_id: offre.id,

      titre,

      texte,

      lien,

    }))

  );

  // 9) L'alerte sur les téléphones et ordinateurs abonnés.

  const clePublique = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  const clePrivee = process.env.VAPID_PRIVATE_KEY;

  const contact = process.env.VAPID_SUBJECT;

  let envoyees = 0;

  if (clePublique && clePrivee && contact) {

    webpush.setVapidDetails(contact, clePublique, clePrivee);

    const { data: abonnements } = await supabaseAdmin

      .from("abonnements_push")

      .select("id, endpoint, p256dh, auth")

      .in("client_id", liste);

    await Promise.all(

      (abonnements ?? []).map(async (a) => {

        try {

          await webpush.sendNotification(

            { endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } },

            JSON.stringify({ titre, corps: texte, lien })

          );

          envoyees += 1;

        } catch (erreur) {

          // 404 ou 410 : cet appareil s'est désabonné, on l'oublie.

          const code = (erreur as { statusCode?: number }).statusCode;

          if (code === 404 || code === 410) {

            await supabaseAdmin.from("abonnements_push").delete().eq("id", a.id);

          }

        }

      })

    );

  }

  return NextResponse.json({ destinataires: liste.length, push: envoyees });

}

