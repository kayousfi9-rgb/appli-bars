import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { signalerProbleme } from "../../../lib/alertes";


// Contrôle quotidien des tâches automatiques de la base :
// planning des offres récurrentes, notifications de nouvelles offres.
// En cas de problème, un message part vers Sentry, qui t'envoie un e-mail.


type Etat = {
  cron_echecs: { tache: string; debut: string; message: string }[];
  planning_derniere_execution: string | null;
  webhooks_echecs: number;
};


const MINUTES_MAX_SANS_PLANNING = 30;


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


  const { data, error } = await supabaseAdmin.rpc("etat_taches_automatiques");
  if (error || !data) {
    await signalerProbleme("Contrôle des tâches automatiques impossible", { message: error?.message ?? "pas de réponse" });
    return NextResponse.json({ erreur: "Lecture de l'état impossible." }, { status: 500 });
  }
  const etat = data as Etat;
  const problemes: string[] = [];


  if (etat.cron_echecs.length > 0) {
    problemes.push("Tâches automatiques en échec");
    await signalerProbleme("Tâches automatiques en échec (24 h)", { echecs: etat.cron_echecs });
  }


  if (etat.planning_derniere_execution) {
    const ecart = (Date.now() - new Date(etat.planning_derniere_execution).getTime()) / 60000;
    if (ecart > MINUTES_MAX_SANS_PLANNING) {
      problemes.push("Planning à l'arrêt");
      await signalerProbleme("Le planning des offres récurrentes ne tourne plus", {
        derniere_execution: etat.planning_derniere_execution,
        minutes_depuis: Math.round(ecart),
      });
    }
  }


  if (etat.webhooks_echecs > 0) {
    problemes.push("Notifications de nouvelles offres en échec");
    await signalerProbleme("Appels de notification en échec (24 h)", { nombre: etat.webhooks_echecs });
  }


  return NextResponse.json({ ok: problemes.length === 0, problemes, etat });
}
