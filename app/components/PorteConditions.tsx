"use client";


import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { VERSION_CONDITIONS } from "../lib/conditions";


// Un écran qui bloque l'application tant que la personne connectée n'a pas accepté
// les conditions et la politique de confidentialité (version en cours).
// Il s'affiche une seule fois par version, et ne s'affiche jamais pour un visiteur non connecté.
export default function PorteConditions() {
  const [afficher, setAfficher] = useState(false);
  const [utilisateurId, setUtilisateurId] = useState<string | null>(null);
  const [accepte, setAccepte] = useState(false);
  const [majeur, setMajeur] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);


  const verifier = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (!session) {
      setAfficher(false);
      setUtilisateurId(null);
      return;
    }
    setUtilisateurId(session.user.id);
    const { data: lignes, error } = await supabase
      .from("consentements")
      .select("type, version")
      .eq("user_id", session.user.id)
      .eq("version", VERSION_CONDITIONS);
    if (error) {
      // La table n'existe pas encore (SQL non lancé) : on ne bloque personne.
      setAfficher(false);
      return;
    }
    const types = new Set((lignes ?? []).map((l) => String(l.type)));
    setAfficher(!(types.has("conditions") && types.has("confidentialite")));
  }, []);


  useEffect(() => {
    void verifier();
    const { data: abonnement } = supabase.auth.onAuthStateChange(() => {
      setTimeout(() => void verifier(), 0);
    });
    return () => abonnement.subscription.unsubscribe();
  }, [verifier]);


  async function valider() {
    if (!utilisateurId || !accepte) return;
    setEnvoi(true);
    setErreur(null);
    const lignes = [
      { user_id: utilisateurId, type: "conditions", version: VERSION_CONDITIONS },
      { user_id: utilisateurId, type: "confidentialite", version: VERSION_CONDITIONS },
    ];
    if (majeur) lignes.push({ user_id: utilisateurId, type: "majorite", version: VERSION_CONDITIONS });
    const { error } = await supabase
      .from("consentements")
      .upsert(lignes, { onConflict: "user_id,type,version", ignoreDuplicates: true });
    setEnvoi(false);
    if (error) {
      setErreur("Enregistrement impossible : " + error.message);
      return;
    }
    setAfficher(false);
  }


  if (!afficher) return null;


  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titre-conditions"
      className="fixed inset-0 z-[3000] flex items-end justify-center bg-black/60 p-3 sm:items-center"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-5 text-[#14193C] shadow-xl">
        <h2 id="titre-conditions" className="text-xl font-extrabold">
          Avant de continuer
        </h2>
        <p className="mt-2 text-base">
          Pour utiliser Happyvo, merci de lire et d'accepter nos conditions.
        </p>
        <p className="mt-3 text-base">
          <a href="/conditions" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#007F77] underline">
            Conditions générales d'utilisation et de vente
          </a>
          <br />
          <a href="/confidentialite" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#007F77] underline">
            Politique de confidentialité
          </a>
        </p>
        <label className="mt-4 flex items-start gap-3 text-base">
          <input
            type="checkbox"
            checked={accepte}
            onChange={(e) => setAccepte(e.target.checked)}
            className="mt-1 h-5 w-5 shrink-0"
          />
          <span>J'ai lu et j'accepte les conditions générales et la politique de confidentialité.</span>
        </label>
        <label className="mt-3 flex items-start gap-3 text-base">
          <input
            type="checkbox"
            checked={majeur}
            onChange={(e) => setMajeur(e.target.checked)}
            className="mt-1 h-5 w-5 shrink-0"
          />
          <span>
            J'ai 18 ans ou plus <span className="text-sm text-[#5A6080]">(obligatoire pour acheter de l'alcool, facultatif sinon)</span>.
          </span>
        </label>
        {erreur && <p className="mt-3 text-sm font-semibold text-[#B3261E]">{erreur}</p>}
        <button
          type="button"
          onClick={valider}
          disabled={!accepte || envoi}
          className="mt-4 w-full rounded-full bg-[#00AAA0] px-4 py-3 text-base font-bold text-white disabled:opacity-40"
        >
          {envoi ? "Enregistrement…" : "Continuer"}
        </button>
        <button
          type="button"
          onClick={() => void supabase.auth.signOut()}
          className="mt-2 w-full px-4 py-2 text-sm font-semibold text-[#5A6080] underline"
        >
          Je refuse et je me déconnecte
        </button>
      </div>
    </div>
  );
}
