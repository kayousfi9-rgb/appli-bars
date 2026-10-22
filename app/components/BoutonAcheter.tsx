"use client";

import { useState } from "react";

type Props = {

  offreId: string;

};

export default function BoutonAcheter({ offreId }: Props) {

  const [chargement, setChargement] = useState(false);

  async function acheter() {

    setChargement(true);

    const reponse = await fetch("/api/stripe/creer-paiement", {

      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({ offreId }),

    });

    const donnees = await reponse.json();

    setChargement(false);

    if (donnees.url) {

      window.location.href = donnees.url;

    } else {

      alert(donnees.erreur || "Une erreur est survenue, réessaie.");

    }

  }

  return (

    <button onClick={acheter} disabled={chargement}>

      {chargement ? "Un instant…" : "Acheter"}

    </button>

  );

}
