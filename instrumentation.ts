import * as Sentry from "@sentry/nextjs";


// Next.js lit ce fichier au démarrage du serveur : il branche Sentry.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}


// Envoie à Sentry les erreurs qui surviennent pendant l'affichage d'une page sur le serveur.
export const onRequestError = Sentry.captureRequestError;
