import { NextRequest, NextResponse } from "next/server";
import { signalerProbleme } from "../../../lib/alertes";


// Route de test, à supprimer quand Sentry est validé. Même mot de passe que les autres contrôles.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const cle = request.nextUrl.searchParams.get("cle") ?? "";
  if (!secret || cle !== secret) {
    return NextResponse.json({ erreur: "Accès refusé." }, { status: 401 });
  }
  await signalerProbleme("Test serveur Happyvo", { origine: "route api/cron/test-sentry" });
  return NextResponse.json({ ok: true, message: "Message de test envoyé à Sentry." });
}
