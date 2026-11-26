import * as Sentry from "@sentry/nextjs";


// Envoie un problème à Sentry (qui te prévient par e-mail), puis attend que l'envoi soit terminé :
// sur Vercel, le serveur peut s'arrêter juste après la réponse, avant que le message soit parti.
export async function signalerProbleme(titre: string, details?: Record<string, unknown>): Promise<void> {
  Sentry.captureMessage(titre, { level: "error", extra: details });
  await Sentry.flush(2000);
}
