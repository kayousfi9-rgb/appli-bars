"use client";

import { useState, type FormEvent } from "react";

import { supabase } from "../../lib/supabase";

import type { ProfilClient } from "../../lib/types";

import { aAuMoins18Ans, dateMaximaleInscription } from "../../lib/age";

const champ = "w-full rounded border border-gray-300 bg-white p-2 text-gray-900";

type Props = {

  idUtilisateur: string;

  onCree: (profil: ProfilClient) => void;

};

export default function CompleterProfil({ idUtilisateur, onCree }: Props) {

  const [prenom, setPrenom] = useState("");

  const [dateNaissance, setDateNaissance] = useState("");

  const [cgu, setCgu] = useState(false);

  const [message, setMessage] = useState<string | null>(null);

  const [chargement, setChargement] = useState(false);

  async function envoyer(e: FormEvent) {

    e.preventDefault();

    setMessage(null);

    if (!prenom.trim()) {

      setMessage("Indique ton prénom.");

      return;

    }

    if (!aAuMoins18Ans(dateNaissance)) {

      setMessage("Ce service est réservé aux personnes majeures (18 ans).");

      return;

    }

    if (!cgu) {

      setMessage("Tu dois accepter les conditions d'utilisation.");

      return;

    }

    setChargement(true);

    const { data, error } = await supabase

      .from("clients")

      .insert({

        id: idUtilisateur,

        prenom: prenom.trim(),

        date_naissance: dateNaissance,

        cgu_acceptees: true,

      })

      .select("id, prenom, date_naissance, cgu_acceptees")

      .single();

    setChargement(false);

    if (error) {

      setMessage("Enregistrement impossible : " + error.message);

      return;

    }

    onCree(data as ProfilClient);

  }

  return (

    <form

      onSubmit={envoyer}

      className="space-y-4 rounded-xl border border-gray-200 bg-white p-5"

    >

      <h2 className="text-lg font-semibold">Terminer mon inscription</h2>

      <p className="text-sm text-gray-600">

        Il manque juste deux informations pour activer ton compte.

      </p>

      <label className="block text-sm">

        <span className="mb-1 block font-medium">Prénom</span>

        <input

          className={champ}

          value={prenom}

          onChange={(e) => setPrenom(e.target.value)}

          required

        />

      </label>

      <label className="block text-sm">

        <span className="mb-1 block font-medium">Date de naissance</span>

        <input

          type="date"

          className={champ}

          max={dateMaximaleInscription()}

          value={dateNaissance}

          onChange={(e) => setDateNaissance(e.target.value)}

          required

        />

      </label>

      <label className="flex items-start gap-2 text-sm">

        <input

          type="checkbox"

          className="mt-1"

          checked={cgu}

          onChange={(e) => setCgu(e.target.checked)}

        />

        <span>

          Je certifie avoir 18 ans ou plus et j&apos;accepte les conditions

          d&apos;utilisation.

        </span>

      </label>

      {message && (

        <p className="rounded bg-amber-50 p-2 text-sm text-amber-800">{message}</p>

      )}

      <button

        type="submit"

        disabled={chargement}

        className="w-full rounded-full bg-rose-600 px-4 py-2 font-medium text-white disabled:opacity-50"

      >

        {chargement ? "Enregistrement…" : "Activer mon compte"}

      </button>

    </form>

  );

}
