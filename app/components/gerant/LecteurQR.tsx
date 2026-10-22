"use client";

import { useEffect, useRef, useState } from "react";

import type { Html5Qrcode } from "html5-qrcode";

// L'identifiant de la zone où s'affiche l'image de la caméra.

const ID_ZONE = "zone-lecteur-qr";

type Props = {

  onLecture: (texte: string) => void;

};

export default function LecteurQR({ onLecture }: Props) {

  const [erreur, setErreur] = useState<string | null>(null);

  // On garde toujours la dernière version de onLecture sous la main.

  const rappel = useRef(onLecture);

  useEffect(() => {

    rappel.current = onLecture;

  }, [onLecture]);

  // Empêche de lire deux fois le même QR code pendant qu'il reste devant la caméra.

  const dejaLu = useRef(false);

  useEffect(() => {

    let annule = false;

    let lecteur: Html5Qrcode | null = null;

    (async () => {

      // On charge la bibliothèque seulement ici, dans le navigateur.

      const { Html5Qrcode } = await import("html5-qrcode");

      if (annule) return;

      const instance = new Html5Qrcode(ID_ZONE);

      lecteur = instance;

      try {

        await instance.start(

          { facingMode: "environment" },

          { fps: 10, qrbox: { width: 240, height: 240 } },

          (texte) => {

            if (dejaLu.current) return;

            dejaLu.current = true;

            rappel.current(texte);

          },

          () => {

            // Aucun QR code dans l'image pour l'instant : on ne fait rien.

          }

        );

        // Si la page a été quittée pendant l'allumage, on éteint tout de suite.

        if (annule) {

          await instance.stop().catch(() => {});

          instance.clear();

        }

      } catch {

        if (!annule) {

          setErreur(

            "Impossible d'ouvrir la caméra. Vérifie que tu as autorisé l'accès à la caméra pour ce site, puis réessaie. Tu peux aussi taper le code à la main en dessous."

          );

        }

      }

    })();

    // Quand le composant disparaît : on éteint la caméra.

    return () => {

      annule = true;

      const l = lecteur;

      if (l && l.isScanning) {

        l.stop()

          .then(() => l.clear())

          .catch(() => {});

      }

    };

  }, []);

  return (

    <div className="space-y-2">

      <div

        id={ID_ZONE}

        className="mx-auto w-full max-w-sm overflow-hidden rounded-xl border border-gray-300 bg-black"

        style={{ minHeight: 280 }}

      />

      {erreur ? (

        <p className="rounded bg-amber-50 p-3 text-sm text-amber-900">{erreur}</p>

      ) : (

        <p className="text-center text-sm text-gray-500">

          {"Place le QR code du client dans le carré."}

        </p>

      )}

    </div>

  );

}
