import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { adresseAppelant, limiteAtteinte, reponseTropDeDemandes } from "../../lib/limiteur";


// Une adresse que ton outil de surveillance (UptimeRobot) appelle toutes les 5 minutes.
// Elle répond 200 si l'appli ET la base de données répondent, 503 sinon.
export async function GET(request: NextRequest) {
  if (await limiteAtteinte("sante:ip:" + adresseAppelant(request), 60, 60)) {
    return reponseTropDeDemandes();
  }
  const { error } = await supabaseAdmin.from("bars").select("id", { count: "exact", head: true }).limit(1);
  const entetes = { "Cache-Control": "no-store" };
  if (error) {
    return NextResponse.json({ etat: "panne", base: false }, { status: 503, headers: entetes });
  }
  return NextResponse.json({ etat: "ok", base: true }, { headers: entetes });
}
