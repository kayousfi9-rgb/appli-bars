import * as Sentry from "@sentry/nextjs";
import { inject } from "@vercel/analytics";


// Suivi des erreurs dans le navigateur de l'utilisateur.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0,
  // Bruits connus sans gravité, qui consommeraient le quota gratuit pour rien.
  ignoreErrors: ["ResizeObserver loop limit exceeded", "ResizeObserver loop completed with undelivered notifications"],
});


// Mesure d'audience anonyme de Vercel (gratuite, sans cookie). Inactive tant que tu ne l'actives pas dans Vercel.
inject();


export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
