"use client";

import { useEffect, useState } from "react";

import { supabase } from "../../lib/supabase";

import { activerPush, desactiverPush, etatPush } from "../../lib/push";

type Etat =

  | "chargement"

  | "non_connecte"

  | "iphone_a_installer"

  | "non_supporte"

  | "refuse"

  | "actif"

  | "inactif"

  | "erreur";

// Sur iPhone, les notifications ne marchent que si l'appli est ouverte

// depuis l'écran d'accueil.

function iphoneSansInstallation(): boolean {

  const iphone = /iphone|ipad|ipod/i.test(navigator.userAgent);

  const depuisEcranAccueil = window.matchMedia("(display-mode: standalone)").matches;

  return iphone && !depuisEcranAccueil;

}

export default function ActivationPush() {

  const [etat, setEtat] = useState<Etat>("chargement");

  const [idClient, setIdClient] = useState<string | null>(null);

  const [occupe, setOccupe] = useState(false);

  useEffect(() => {

    let annule = false;

    (async () => {

      const { data: session } = await supabase.auth.getSession();

      const id = session.session?.user.id ?? null;

      if (annule) return;

      setIdClient(id);

      if (!id) {

        setEtat("non_connecte");

        return;

      }

      if (iphoneSansInstallation()) {

        setEtat("iphone_a_installer");

        return;

      }

      const resultat = await etatPush();

      if (!annule) setEtat(resultat);

    })();

    return () => {

      annule = true;

    };

  }, []);

  async function activer() {

    if (!idClient) return;

    setOccupe(true);

    const resultat = await activerPush(idClient);

    setEtat(resultat);

    setOccupe(false);

  }

  async function desactiver() {

    setOccupe(true);

    await desactiverPush();

    setEtat("inactif");

    setOccupe(false);

  }

  if (etat === "chargement" || etat === "non_connecte") return null;

  return (

    <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-5">

      <h2 className="text-lg font-semibold">Alertes sur cet appareil</h2>

      {etat === "actif" && (

        <>

          <p className="rounded bg-green-50 p-3 text-sm text-green-900">

            {"Les alertes sont activées sur cet appareil."}

          </p>

          <button

            type="button"

            onClick={desactiver}

            disabled={occupe}

            className="w-full rounded-full border border-gray-300 px-4 py-2 text-sm disabled:opacity-50"

          >

            Couper les alertes sur cet appareil

          </button>

        </>

      )}

      {etat === "inactif" && (

        <>

          <p className="text-sm text-gray-600">

            {"Reçois une alerte sur ton écran dès qu'une offre correspond à tes réglages, même quand l'appli est fermée."}

          </p>

          <button

            type="button"

            onClick={activer}

            disabled={occupe}

            className="w-full rounded-full bg-rose-600 px-4 py-3 font-semibold text-white disabled:opacity-50"

          >

            {occupe ? "Activation…" : "Activer les alertes sur cet appareil"}

          </button>

        </>

      )}

      {etat === "iphone_a_installer" && (

        <div className="space-y-2 rounded bg-amber-50 p-3 text-sm text-amber-900">

          <p className="font-semibold">{"Sur iPhone, une étape en plus :"}</p>

          <ol className="list-decimal space-y-1 pl-5">

            <li>{"Dans Safari, appuie sur le bouton Partager (le carré avec une flèche)."}</li>

            <li>{"Choisis « Sur l'écran d'accueil », puis « Ajouter »."}</li>

            <li>{"Ouvre l'appli depuis la nouvelle icône, et reviens sur cette page."}</li>

          </ol>

        </div>

      )}

      {etat === "refuse" && (

        <p className="rounded bg-amber-50 p-3 text-sm text-amber-900">

          {"Les alertes ont été bloquées pour ce site. Pour les réactiver : appuie sur le cadenas à gauche de l'adresse (ou va dans les réglages du navigateur), autorise les notifications, puis recharge la page."}

        </p>

      )}

      {etat === "non_supporte" && (

        <p className="rounded bg-gray-50 p-3 text-sm text-gray-700">

          {"Ce navigateur ne sait pas recevoir d'alertes. Tu retrouveras quand même toutes tes notifications dans la liste en dessous."}

        </p>

      )}

      {etat === "erreur" && (

        <>

          <p className="rounded bg-amber-50 p-3 text-sm text-amber-900">

            {"L'activation n'a pas marché. Réessaie dans un instant."}

          </p>

          <button

            type="button"

            onClick={activer}

            disabled={occupe}

            className="w-full rounded-full border border-gray-300 px-4 py-2 text-sm disabled:opacity-50"

          >

            Réessayer

          </button>

        </>

      )}

    </section>

  );

}
