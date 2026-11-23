"use client";


import { useState, type FormEvent } from "react";
import { supabase } from "../../lib/supabase";


type Props = { onConnecte: () => void };


const CHAMP = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900";


export default function ConnexionEquipe({ onConnecte }: Props) {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);


  async function seConnecter(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnvoi(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: motDePasse });
    setEnvoi(false);
    if (error) {
      setErreur("Connexion impossible : vérifie l'e-mail et le mot de passe.");
      return;
    }
    onConnecte();
  }


  return (
    <form onSubmit={seConnecter} className="space-y-3 rounded-xl border border-gray-200 p-4">
      <p className="font-semibold">Connexion équipe (gérant ou serveur)</p>
      <label className="block text-sm font-semibold">
        E-mail
        <input
          className={CHAMP + " mt-1 font-normal"}
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="block text-sm font-semibold">
        Mot de passe
        <input
          className={CHAMP + " mt-1 font-normal"}
          type="password"
          autoComplete="current-password"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
        />
      </label>
      <button
        type="submit"
        disabled={envoi || !email || !motDePasse}
        className="w-full rounded-full bg-[#007F77] px-4 py-3 font-bold text-white disabled:opacity-60"
      >
        {envoi ? "Connexion…" : "Me connecter"}
      </button>
      {erreur && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{erreur}</p>}
    </form>
  );
}
