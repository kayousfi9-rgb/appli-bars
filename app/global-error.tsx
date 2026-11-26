"use client";


import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";


// Dernier filet de sécurité : si toute l'application plante, on prévient Sentry
// et on affiche un message simple à la place d'une page blanche.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);


  return (
    <html lang="fr">
      <body style={{ fontFamily: "sans-serif", padding: "2rem", color: "#14193C" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Oups, un problème est survenu</h1>
        <p style={{ marginTop: "0.75rem" }}>
          Nous avons été prévenus. Recharge la page ; si le problème continue, réessaie dans quelques minutes.
        </p>
        <p style={{ marginTop: "1.5rem" }}>
          <a href="/" style={{ color: "#007F77", fontWeight: 700 }}>
            Retour à l'accueil
          </a>
        </p>
      </body>
    </html>
  );
}
