"use client";

import { useEffect, useState, type FormEvent } from "react";

import { supabase } from "../../lib/supabase";

const champ = "w-full rounded border border-gray-300 bg-white p-2 text-gray-900";

export default function NouveauMotDePasse() {

  const [pret, setPret] = useState(false);

  const [autorise, setAutorise] = useState(false);

  const [motDePasse, setMotDePasse] = useState("");

  const [confirmation, setConfirmation] = useState("");

  const [message, setMessage] = useState<string | null>(null);

  const [fini, setFini] = useState(false);

  // En arrivant par le lien du mail, Supabase ouvre une session temporaire.

  useEffect(() => {

    supabase.auth.getSession().then(({ data }) => {

      setAutorise(Boolean(data.session));

      setPret(true);

    });

    const { data: abonnement } = supabase.auth.onAuthStateChange(

      (_evenement, session) => {

        setAutorise(Boolean(session));

        setPret(true);

      }

    );

    return () => abonnement.subscription.unsubscribe();

  }, []);

  async function envoyer(e: FormEvent) {

    e.preventDefault();

    setMessage(null);

    if (motDePasse.length < 6) {

      setMessage("6 caractères minimum.");

      return;

    }

    if (motDePasse !== confirmation) {

      setMessage("Les deux mots de passe ne sont pas identiques.");

      return;

    }

    const { error } = await supabase.auth.updateUser({ password: motDePasse });

    if (error) {

      setMessage("Erreur : " + error.message);

      return;

    }

    setFini(true);

  }

  if (!pret) return <p className="text-gray-500">Chargement…</p>;

  if (fini) {

    return (

      <div className="rounded-xl border border-green-300 bg-green-50 p-5 text-green-900">

        <p className="font-semibold">Mot de passe modifié.</p>

        <p className="mt-2 text-sm">

          Tu peux maintenant aller sur{" "}

          <a href="/compte" className="underline">

            Mon compte

          </a>{" "}

          ou sur{" "}

          <a href="/gerant" className="underline">

            l&apos;espace gérant

          </a>

          .

        </p>

      </div>

    );

  }

  if (!autorise) {

    return (

      <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-900">

        <p className="font-semibold">Ce lien n&apos;est plus valable.</p>

        <p className="mt-2 text-sm">

          Les liens expirent au bout d&apos;une heure.{" "}

          <a href="/mot-de-passe-oublie" className="underline">

            Demande un nouveau lien

          </a>

          .

        </p>

      </div>

    );

  }

  return (

    <form

      onSubmit={envoyer}

      className="space-y-4 rounded-xl border border-gray-200 bg-white p-5"

    >

      <h2 className="text-lg font-semibold">Choisir un nouveau mot de passe</h2>

      <label className="block text-sm">

        <span className="mb-1 block font-medium">Nouveau mot de passe</span>

        <input

          type="password"

          required

          minLength={6}

          className={champ}

          value={motDePasse}

          onChange={(e) => setMotDePasse(e.target.value)}

        />

      </label>

      <label className="block text-sm">

        <span className="mb-1 block font-medium">Confirmer</span>

        <input

          type="password"

          required

          minLength={6}

          className={champ}

          value={confirmation}

          onChange={(e) => setConfirmation(e.target.value)}

        />

      </label>

      {message && (

        <p className="rounded bg-amber-50 p-2 text-sm text-amber-800">{message}</p>

      )}

      <button

        type="submit"

        className="w-full rounded-full bg-rose-600 px-4 py-2 font-medium text-white"

      >

        Enregistrer

      </button>

    </form>

  );

}

