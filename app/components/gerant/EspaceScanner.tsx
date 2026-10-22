"use client";

import { useEffect, useState, type FormEvent } from "react";

import { supabase } from "../../lib/supabase";

import { chargerMonBar, formaterDateHeure, formaterEuros } from "../../lib/commandes";

import type { MonBar, ResultatScan } from "../../lib/types";

import LecteurQR from "./LecteurQR";

const champ = "w-full rounded border border-gray-300 bg-white p-2 text-gray-900";

// Fait vibrer le téléphone, si l'appareil le permet (pas sur iPhone, c'est normal).

function vibrer(motif: number | number[]) {

  if (typeof navigator !== "undefined" && "vibrate" in navigator) {

    navigator.vibrate(motif);

  }

}

export default function EspaceScanner() {

  const [pret, setPret] = useState(false);

  const [bar, setBar] = useState<MonBar | null>(null);

  const [cameraActive, setCameraActive] = useState(false);

  const [verification, setVerification] = useState(false);

  const [resultat, setResultat] = useState<ResultatScan | null>(null);

  const [saisie, setSaisie] = useState("");

  // 1) Au chargement : quel est le bar du gérant connecté ?

  useEffect(() => {

    let annule = false;

    (async () => {

      const monBar = await chargerMonBar();

      if (annule) return;

      setBar(monBar);

      setPret(true);

    })();

    return () => {

      annule = true;

    };

  }, []);

  // 2) On envoie le jeton lu à la fonction valider_retrait de la base.

  async function valider(texte: string) {

    const jeton = texte.trim();

    if (!jeton) return;

    setCameraActive(false); // on éteint la caméra pendant la vérification

    setVerification(true);

    setResultat(null);

    const { data, error } = await supabase.rpc("valider_retrait", { jeton });

    setVerification(false);

    if (error) {

      setResultat({ resultat: "erreur", message: error.message });

      vibrer([100, 80, 100]);

      return;

    }

    const reponse = data as ResultatScan;

    setResultat(reponse);

    vibrer(reponse.resultat === "ok" ? 200 : [100, 80, 100]);

  }

  function scannerSuivant() {

    setResultat(null);

    setSaisie("");

    setCameraActive(true);

  }

  function envoyerSaisie(e: FormEvent) {

    e.preventDefault();

    valider(saisie);

  }

  if (!pret) return <p className="text-gray-500">Chargement…</p>;

  if (!bar) {

    return (

      <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-900">

        <p className="font-semibold">{"Tu n'es pas connecté en tant que gérant."}</p>

        <p className="mt-2 text-sm">

          {"Connecte-toi d'abord dans "}

          <a href="/gerant" className="underline">

            {"l'espace gérant"}

          </a>

          {", puis reviens sur cette page."}

        </p>

      </div>

    );

  }

  return (

    <div className="space-y-6">

      <p className="text-sm text-gray-600">

        Bar : <strong>{bar.nom}</strong>

      </p>

      {/* LE RÉSULTAT DU DERNIER SCAN */}

      {verification && (

        <div className="rounded-xl border border-gray-300 bg-gray-50 p-6 text-center text-lg">

          Vérification…

        </div>

      )}

      {resultat && <PanneauResultat resultat={resultat} />}

      {/* LA CAMÉRA */}

      {cameraActive ? (

        <div className="space-y-3">

          <LecteurQR onLecture={valider} />

          <button

            type="button"

            onClick={() => setCameraActive(false)}

            className="w-full rounded-full border border-gray-300 px-4 py-2 text-sm"

          >

            Arrêter la caméra

          </button>

        </div>

      ) : (

        <button

          type="button"

          onClick={scannerSuivant}

          disabled={verification}

          className="w-full rounded-full bg-rose-600 px-4 py-4 text-lg font-semibold text-white disabled:opacity-50"

        >

          {resultat ? "Scanner le QR code suivant" : "Scanner un QR code"}

        </button>

      )}

      {/* LA SAISIE MANUELLE, EN SECOURS */}

      <form

        onSubmit={envoyerSaisie}

        className="space-y-3 rounded-xl border border-gray-200 bg-white p-4"

      >

        <p className="text-sm font-medium">{"La caméra ne marche pas ?"}</p>

        <p className="text-xs text-gray-500">

          {"Demande au client le code écrit sous son QR code, et tape-le ici."}

        </p>

        <input

          className={champ}

          value={saisie}

          onChange={(e) => setSaisie(e.target.value)}

          placeholder="Code de la commande"

          autoComplete="off"

          autoCapitalize="off"

          spellCheck={false}

        />

        <button

          type="submit"

          disabled={verification || !saisie.trim()}

          className="w-full rounded-full border border-gray-300 px-4 py-2 text-sm font-medium disabled:opacity-50"

        >

          Valider ce code

        </button>

      </form>

    </div>

  );

}

// Le grand panneau de couleur, lisible de loin au comptoir.

function PanneauResultat({ resultat }: { resultat: ResultatScan }) {

  if (resultat.resultat === "ok") {

    return (

      <div className="rounded-xl border-4 border-green-500 bg-green-50 p-6 text-center text-green-900">

        <p className="text-2xl font-bold">COMMANDE VALIDÉE</p>

        <p className="mt-3 text-xl">

          {"À servir : "}

          <strong>{resultat.produit || "Offre"}</strong>

        </p>

        {resultat.prenom && <p className="mt-1 text-lg">{"Client : " + resultat.prenom}</p>}

        <p className="mt-1 text-sm">{"Payé : " + formaterEuros(resultat.prix)}</p>

        <p className="mt-4 rounded bg-white/70 p-2 text-sm">

          {"Alcool : vérifie la pièce d'identité en cas de doute sur l'âge."}

        </p>

      </div>

    );

  }

  if (resultat.resultat === "deja_recuperee") {

    return (

      <div className="rounded-xl border-4 border-red-500 bg-red-50 p-6 text-center text-red-900">

        <p className="text-2xl font-bold">DÉJÀ RÉCUPÉRÉE</p>

        <p className="mt-3">

          {"Ce QR code a déjà été utilisé le " + formaterDateHeure(resultat.recuperee_le) + "."}

        </p>

        <p className="mt-1 font-semibold">Ne pas servir.</p>

      </div>

    );

  }

  if (resultat.resultat === "expiree") {

    return (

      <div className="rounded-xl border-4 border-orange-500 bg-orange-50 p-6 text-center text-orange-900">

        <p className="text-2xl font-bold">COMMANDE EXPIRÉE</p>

        <p className="mt-3">

          {"Elle devait être récupérée avant le " + formaterDateHeure(resultat.expire_le) + "."}

        </p>

        <p className="mt-1 font-semibold">Ne pas servir.</p>

      </div>

    );

  }

  if (resultat.resultat === "introuvable") {

    return (

      <div className="rounded-xl border-4 border-red-500 bg-red-50 p-6 text-center text-red-900">

        <p className="text-2xl font-bold">QR CODE INCONNU</p>

        <p className="mt-3">{"Ce QR code ne correspond à aucune commande."}</p>

        <p className="mt-1 font-semibold">Ne pas servir.</p>

      </div>

    );

  }

  if (resultat.resultat === "autre_bar") {

    return (

      <div className="rounded-xl border-4 border-red-500 bg-red-50 p-6 text-center text-red-900">

        <p className="text-2xl font-bold">AUTRE ÉTABLISSEMENT</p>

        <p className="mt-3">{"Cette commande a été achetée dans un autre bar."}</p>

        <p className="mt-1 font-semibold">Ne pas servir.</p>

      </div>

    );

  }

  if (resultat.resultat === "non_connecte") {

    return (

      <div className="rounded-xl border-4 border-gray-400 bg-gray-50 p-6 text-center text-gray-900">

        <p className="text-xl font-bold">{"Tu n'es plus connecté"}</p>

        <p className="mt-3 text-sm">

          <a href="/gerant" className="underline">

            {"Reconnecte-toi dans l'espace gérant"}

          </a>

        </p>

      </div>

    );

  }

  return (

    <div className="rounded-xl border-4 border-gray-400 bg-gray-50 p-6 text-center text-gray-900">

      <p className="text-xl font-bold">Erreur technique</p>

      <p className="mt-3 text-sm">{resultat.message || "Réessaie dans un instant."}</p>

    </div>

  );

}
