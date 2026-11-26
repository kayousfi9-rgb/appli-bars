"use client";

import { useEffect, useState } from "react";

type EvenementInstallation = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Mode = "inconnu" | "installee" | "ios" | "autre";

// Propose d'installer Happyvo sur l'écran d'accueil du téléphone.
// - Android et Chrome : un bouton « Installer Happyvo ».
// - iPhone : les gestes à faire dans Safari (iPhone n'autorise pas de bouton automatique).
// - Déjà installée : un simple message.
export default function InviteInstallation() {
  const [mode, setMode] = useState<Mode>("inconnu");
  const [evenement, setEvenement] = useState<EvenementInstallation | null>(null);

  useEffect(() => {
    const installee =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setMode(installee ? "installee" : ios ? "ios" : "autre");

    function avantInstallation(e: Event) {
      e.preventDefault();
      setEvenement(e as EvenementInstallation);
    }

    function apresInstallation() {
      setMode("installee");
      setEvenement(null);
    }

    window.addEventListener("beforeinstallprompt", avantInstallation);
    window.addEventListener("appinstalled", apresInstallation);
    return () => {
      window.removeEventListener("beforeinstallprompt", avantInstallation);
      window.removeEventListener("appinstalled", apresInstallation);
    };
  }, []);

  async function installer() {
    if (!evenement) return;
    await evenement.prompt();
    await evenement.userChoice;
    setEvenement(null);
  }

  if (mode === "inconnu") return null;

  if (mode === "installee") {
    return (
      <p className="mx-auto max-w-md px-4 pt-4 text-sm font-semibold text-[#007F77]">
        ✓ Happyvo est installée sur cet appareil.
      </p>
    );
  }

  return (
    <section className="mx-auto mt-4 max-w-md rounded-2xl border border-[#DDE0EE] p-4 text-[#14193C]">
      <h2 className="text-lg font-bold">Installer Happyvo</h2>
      {evenement ? (
        <>
          <p className="mt-1 text-base">Ajoute Happyvo à l'écran d'accueil pour l'ouvrir comme une vraie appli.</p>
          <button
            type="button"
            onClick={installer}
            className="mt-3 w-full rounded-full bg-[#00AAA0] px-4 py-3 text-base font-bold text-white"
          >
            Installer Happyvo
          </button>
        </>
      ) : mode === "ios" ? (
        <ol className="mt-1 list-decimal space-y-1 pl-5 text-base">
          <li>Ouvre Happyvo dans Safari.</li>
          <li>Touche le bouton Partager (le carré avec une flèche vers le haut).</li>
          <li>Choisis « Sur l'écran d'accueil », puis « Ajouter ».</li>
          <li>Ouvre ensuite Happyvo depuis son icône : c'est là que les notifications fonctionnent sur iPhone.</li>
        </ol>
      ) : (
        <p className="mt-1 text-base">
          Dans le menu de ton navigateur, choisis « Installer l'application » ou « Ajouter à l'écran d'accueil ».
        </p>
      )}
    </section>
  );
}
