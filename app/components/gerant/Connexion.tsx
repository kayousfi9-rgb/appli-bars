"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "../../lib/supabase";

const champ = "w-full rounded border border-gray-300 bg-white p-2 text-gray-900";

export default function Connexion() {
  const [mode, setMode] = useState<"connexion" | "inscription">("connexion");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function envoyer(e: FormEvent) {
    e.preventDefault();
    setChargement(true);
    setMessage(null);

    if (mode === "connexion") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: motDePasse,
      });
      if (error) setMessage("Connexion impossible : " + error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password: motDePasse });
      if (error) {
        setMessage("Inscription impossible : " + error.message);
      } else if (!data.session) {
        setMessage(
          "Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse, puis reviens te connecter."
        );
      }
    }

    setChargement(false);
  }

  return (
    <form onSubmit={envoyer} className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="text-lg font-semibold">
        {mode === "connexion" ? "Connexion gérant" : "Créer mon compte gérant"}
      </h2>

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
        <span className="mb-1 block font-medium">Mot de passe (6 caractères minimum)</span>
        <input
          type="password"
          required
          minLength={6}
          className={champ}
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
        />
      </label>

      {message && <p className="rounded bg-amber-50 p-2 text-sm text-amber-800">{message}</p>}

      <button
        type="submit"
        disabled={chargement}
        className="w-full rounded-full bg-rose-600 px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {chargement ? "…" : mode === "connexion" ? "Me connecter" : "Créer mon compte"}
      </button>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "connexion" ? "inscription" : "connexion");
          setMessage(null);
        }}
        className="w-full text-sm text-gray-600 underline"
      >
        {mode === "connexion" ? "Pas encore de compte ? Créer mon compte" : "J'ai déjà un compte"}
      </button>
    </form>
  );
}
