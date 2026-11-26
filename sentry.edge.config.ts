import * as Sentry from "@sentry/nextjs";


// Même réglage pour l'environnement « edge » de Next.js (si une partie de l'appli l'utilise).
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0,
});
