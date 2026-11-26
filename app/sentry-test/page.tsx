"use client";


import * as Sentry from "@sentry/nextjs";
import { useState } from "react";


// Page de test, à supprimer quand Sentry est validé.
export default function PageTestSentry() {
  const [envoye, setEnvoye] = useState(false);


  async function envoyer() {
    Sentry.captureException(new Error("Test navigateur Happyvo"));
    await Sentry.flush(2000);
    setEnvoye(true);
  }


  return (
    <main className="mx-auto min-h-screen max-w-md bg-white p-4 text-[#14193C]">
      <h1 className="mb-3 text-2xl font-extrabold">Test de Sentry</h1>
      <p className="mb-4 text-base">Ce bouton envoie une fausse erreur à Sentry, depuis ton navigateur.</p>
      <button
        type="button"
        onClick={envoyer}
        className="w-full rounded-full bg-[#00AAA0] px-4 py-3 text-base font-bold text-white"
      >
        Envoyer une erreur de test
      </button>
      {envoye && <p className="mt-3 text-base font-semibold text-[#007F77]">Envoyée. Regarde dans Sentry, rubrique Issues.</p>}
    </main>
  );
}
