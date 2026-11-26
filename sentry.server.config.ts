import * as Sentry from "@sentry/nextjs";


// Suivi des erreurs côté serveur (les routes api, les pages rendues sur le serveur).
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  // Pas de suivi de performance : on ne surveille que les erreurs (plus léger, et gratuit plus longtemps).
  tracesSampleRate: 0,
});
