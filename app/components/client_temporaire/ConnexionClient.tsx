"use client";

import { useState, type FormEvent } from "react";

import { supabase } from "../../lib/supabase";

import { aAuMoins18Ans, dateMaximaleInscription } from "../../lib/age";

const champ = "w-full rounded border border-gray-300 bg-white p-2 text-gray-900";

export default function ConnexionClient() {

  const [mode, setMode] = useState<"connexion" | "inscription">("connexion");

  const [prenom, setPrenom] = useState("");

  const [dateNaissance, setDateNaissance] = useState("");

  const [email, setEmail] = useState("");

  const [motDePasse, setMotDePasse] = useState("");

  const [cgu, setCgu] = useState(false);

  const [message, setMessage] = useState<string | null>(null);

  const [chargement, setChargement] = useState(false);

  async function envoyer(e: FormEvent) {

    e.preventDefault();

    setMessage(null);

    if (mode === "connexion") {

      setChargement(true);

      const { error } = await supabase.auth.signInWithPassword({

        email,

        password: motDePasse,

      });

      if (error) setMessage("Connexion impossible : " + error.message);

      setChargement(false);

      return;

    }

    if (!prenom.trim()) {

      setMessage("Indique ton prénom.");

      return;

    }

    if (!dateNaissance) {

      setMessage("Indique ta date de naissance.");

      return;

    }

    if (!aAuMoins18Ans(dateNaissance)) {

      setMessage("L'inscription est réservée aux personnes majeures (18 ans).");

      return;

    }

    if (!cgu) {

      setMessage("Tu dois accepter les conditions d'utilisation.");

      return;

    }

    setChargement(true);

    // Le prénom et la date de naissance voyagent avec le compte :

    // la fiche client sera créée à la première connexion confirmée.

    const { data, error } = await supabase.auth.signUp({

      email,

      password: motDePasse,

      options: {

        data: {

          prenom: prenom.trim(),

          date_naissance: dateNaissance,

          cgu_acceptees: true,

        },

      },

    });

    if (error) {

      setMessage("Inscription impossible : " + error.message);

    } else if (!data.session) {

      setMessage(

        "Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse, puis reviens te connecter."

      );

    }

    setChargement(false);

  }

  return (

    <form

      onSubmit={envoyer}

      className="space-y-4 rounded-xl border border-gray-200 bg-white p-5"

    >

      <h2 className="text-lg font-semibold">

        {mode === "connexion" ? "Connexion" : "Créer mon compte"}

      </h2>

      {mode === "inscription" && (

        <>

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

            <span className="mt-1 block text-xs text-gray-500">

              Réservé aux personnes majeures (18 ans).

            </span>

          </label>

        </>

      )}

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

      <label className="block text-sm">

        <span className="mb-1 block font-medium">

          Mot de passe (6 caractères minimum)

        </span>

        <input

          type="password"

          required

          minLength={6}

          className={champ}

          value={motDePasse}

          onChange={(e) => setMotDePasse(e.target.value)}

        />

      </label>

      {mode === "inscription" && (

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

      )}

      {message && (

        <p className="rounded bg-amber-50 p-2 text-sm text-amber-800">{message}</p>

      )}

      <button

        type="submit"

        disabled={chargement}

        className="w-full rounded-full bg-rose-600 px-4 py-2 font-medium text-white disabled:opacity-50"

      >

        {chargement

          ? "…"

          : mode === "connexion"

            ? "Me connecter"

            : "Créer mon compte"}

      </button>

      <button

        type="button"

        onClick={() => {

          setMode(mode === "connexion" ? "inscription" : "connexion");

          setMessage(null);

        }}

        className="w-full text-sm text-gray-600 underline"

      >

        {mode === "connexion"

          ? "Pas encore de compte ? Créer mon compte"

          : "J'ai déjà un compte"}

      </button>

      <a

        href="/mot-de-passe-oublie"

        className="block text-center text-sm text-gray-500 underline"

      >

        Mot de passe oublié ?

      </a>

    </form>

  );

}
