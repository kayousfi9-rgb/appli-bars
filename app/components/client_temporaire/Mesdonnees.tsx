"use client";


import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";


export default function MesDonnees() {
  const [pret, setPret] = useState(false);
  const [connecte, setConnecte] = useState(false);
  const [exportEnCours, setExportEnCours] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);


  useEffect(() => {
    let actif = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!actif) return;
      setConnecte(Boolean(data.session));
      setPret(true);
    })();
    return () => {
      actif = false;
    };
  }, []);


  async function jeton(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }


  async function exporter() {
    setMessage(null);
    setExportEnCours(true);
    const sesame = await jeton();
    if (!sesame) {
      setExportEnCours(false);
      setMessage({ ok: false, texte: "Tu dois être connecté." });
      return;
    }
    try {
      const reponse = await fetch("/api/compte/exporter", { headers: { Authorization: "Bearer " + sesame } });
      if (!reponse.ok) {
        const corps = (await reponse.json().catch(() => null)) as { erreur?: string } | null;
        setMessage({ ok: false, texte: corps?.erreur ?? "Export impossible (erreur " + reponse.status + ")." });
        setExportEnCours(false);
        return;
      }
      const blob = await reponse.blob();
      const adresse = URL.createObjectURL(blob);
      const lien = document.createElement("a");
      lien.href = adresse;
      lien.download = "mes-donnees-happyvo.json";
      document.body.appendChild(lien);
      lien.click();
      lien.remove();
      URL.revokeObjectURL(adresse);
      setMessage({ ok: true, texte: "Le fichier mes-donnees-happyvo.json a été téléchargé." });
    } catch {
      setMessage({ ok: false, texte: "Export impossible : problème de connexion." });
    }
    setExportEnCours(false);
  }


  async function supprimer() {
    setMessage(null);
    setSuppressionEnCours(true);
    const sesame = await jeton();
    if (!sesame) {
      setSuppressionEnCours(false);
      setMessage({ ok: false, texte: "Tu dois être connecté." });
      return;
    }
    try {
      const reponse = await fetch("/api/compte/supprimer", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + sesame },
        body: JSON.stringify({ confirmation }),
      });
      const corps = (await reponse.json().catch(() => null)) as { erreur?: string } | null;
      if (!reponse.ok) {
        setMessage({ ok: false, texte: corps?.erreur ?? "Suppression impossible (erreur " + reponse.status + ")." });
        setSuppressionEnCours(false);
        return;
      }
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch {
      setMessage({ ok: false, texte: "Suppression impossible : problème de connexion." });
      setSuppressionEnCours(false);
    }
  }


  if (!pret) return <p className="text-sm text-[#5A6080]">Chargement…</p>;


  return (
    <div className="space-y-6">
      {!connecte && (
        <p className="rounded-xl border border-[#DDE0EE] p-3 text-base">
          Connecte-toi pour télécharger ou supprimer tes données.
        </p>
      )}


      <section className="rounded-2xl border border-[#DDE0EE] p-4">
        <h2 className="text-lg font-bold">Télécharger mes données</h2>
        <p className="mt-1 text-base">
          Tu reçois un fichier avec ton compte, tes commandes, tes favoris, tes notifications et tes signalements.
        </p>
        <button
          type="button"
          onClick={exporter}
          disabled={!connecte || exportEnCours}
          className="mt-3 w-full rounded-full bg-[#00AAA0] px-4 py-3 text-base font-bold text-white disabled:opacity-40"
        >
          {exportEnCours ? "Préparation…" : "Télécharger mes données"}
        </button>
      </section>


      <section className="rounded-2xl border border-[#E6B8B4] p-4">
        <h2 className="text-lg font-bold text-[#B3261E]">Supprimer mon compte</h2>
        <p className="mt-1 text-base">
          Ton compte ne pourra plus être utilisé et tes données d'identification seront effacées. Tes favoris, notifications
          et appareils enregistrés sont supprimés. Tes commandes passées sont conservées sans ton identité, car la loi
          impose de garder les pièces comptables. Cette action est définitive.
        </p>
        <p className="mt-2 text-sm text-[#5A6080]">
          Impossible tant que tu as une commande payée à récupérer. Les comptes d'établissement et d'équipe se suppriment
          en nous contactant.
        </p>
        <label className="mt-3 block text-sm font-semibold" htmlFor="confirmation">
          Pour confirmer, écris SUPPRIMER en majuscules :
        </label>
        <input
          id="confirmation"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          autoComplete="off"
          className="mt-1 w-full rounded-xl border border-[#DDE0EE] px-3 py-2 text-base"
        />
        <button
          type="button"
          onClick={supprimer}
          disabled={!connecte || confirmation !== "SUPPRIMER" || suppressionEnCours}
          className="mt-3 w-full rounded-full bg-[#B3261E] px-4 py-3 text-base font-bold text-white disabled:opacity-40"
        >
          {suppressionEnCours ? "Suppression…" : "Supprimer définitivement mon compte"}
        </button>
      </section>


      {message && (
        <p className={"text-sm font-semibold " + (message.ok ? "text-[#007F77]" : "text-[#B3261E]")}>{message.texte}</p>
      )}


      <nav aria-label="Documents légaux" className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-[#007F77]">
        <Link href="/conditions" className="underline">Conditions générales</Link>
        <Link href="/confidentialite" className="underline">Confidentialité</Link>
        <Link href="/mentions-legales" className="underline">Mentions légales</Link>
      </nav>
    </div>
  );
}
