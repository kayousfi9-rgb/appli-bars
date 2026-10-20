"use client";

import { useState, type FormEvent } from "react";

import { supabase } from "../../lib/supabase";

const champ = "w-full rounded border border-gray-300 bg-white p-2 text-gray-900";

export default function MotDePasseOublie() {

  const [email, setEmail] = useState("");

  const [message, setMessage] = useState<string | null>(null);

  const [chargement, setChargement] = useState(false);

  async function envoyer(e: FormEvent) {

    e.preventDefault();

    setChargement(true);

    setMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {

      redirectTo: window.location.origin + "/nouveau-mot-de-passe",

    });

    setChargement(false);

    // On affiche le même message dans tous les cas : ça évite de révéler

    // si une adresse est inscrite ou non.

    if (error) setMessage("Erreur : " + error.message);

    else

      setMessage(

        "Si un compte existe avec cette adresse, un lien vient d'être envoyé. Pense à regarder dans les spams."

      );

  }

  return (

    <form

      onSubmit={envoyer}

      className="space-y-4 rounded-xl border border-gray-200 bg-white p-5"

    >

      <h2 className="text-lg font-semibold">Mot de passe oublié</h2>

      <p className="text-sm text-gray-600">

        Indique ton adresse e-mail : tu recevras un lien pour choisir un nouveau

        mot de passe. Ça marche pour les comptes clients comme pour les comptes

        gérants.

      </p>

      <label className="block text-sm">

        <span className="mb-1 block font-medium">E-mail</span>

        <input

          type="email"

          required

          className={champ}

          value={email}

          onChange={(e) => setEmail(e.target.value)}

        />

      </label>

      {message && (

        <p className="rounded bg-amber-50 p-2 text-sm text-amber-800">{message}</p>

      )}

      <button

        type="submit"

        disabled={chargement}

        className="w-full rounded-full bg-rose-600 px-4 py-2 font-medium text-white disabled:opacity-50"

      >

        {chargement ? "Envoi…" : "Envoyer le lien"}

      </button>

    </form>

  );

}
