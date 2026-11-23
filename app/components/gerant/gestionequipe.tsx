"use client";


import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { chargerMonEtablissement, jetonSession, type MonEtablissement } from "../../lib/equipe";
import LiensGerant from "./liensgerant";

type Serveur = { id: string; prenom: string; email: string; actif: boolean; cree_le: string };


type Etat =
  | { statut: "chargement" }
  | { statut: "interdit"; message: string }
  | { statut: "pret"; bar: MonEtablissement };


const CHAMP = "w-full rounded-lg border border-[#E7DDC8] bg-white px-3 py-2 text-base text-[#14193C]";


export default function GestionEquipe() {
  const [etat, setEtat] = useState<Etat>({ statut: "chargement" });
  const [serveurs, setServeurs] = useState<Serveur[]>([]);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [aRetirer, setARetirer] = useState<string | null>(null);


  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");


  const chargerServeurs = useCallback(async (barId: string) => {
    const { data, error } = await supabase
      .from("serveurs")
      .select("id, prenom, email, actif, cree_le")
      .eq("bar_id", barId)
      .order("cree_le", { ascending: true });
    if (error) {
      setMessage({ ok: false, texte: "Impossible de lire l'équipe : " + error.message });
      return;
    }
    setServeurs((data ?? []) as Serveur[]);
  }, []);


  useEffect(() => {
    (async () => {
      const bar = await chargerMonEtablissement();
      if (!bar) {
        setEtat({ statut: "interdit", message: "Connecte-toi d'abord avec ton compte gérant (page /equipe)." });
        return;
      }
      if (bar.role !== "gerant") {
        setEtat({ statut: "interdit", message: "Cette page est réservée au gérant." });
        return;
      }
      setEtat({ statut: "pret", bar });
      chargerServeurs(bar.id);
    })();
  }, [chargerServeurs]);


  async function appeler(adresse: string, corps: object): Promise<{ ok: boolean; erreur?: string }> {
    const jeton = await jetonSession();
    if (!jeton) return { ok: false, erreur: "Tu n'es plus connecté." };
    const reponse = await fetch(adresse, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + jeton },
      body: JSON.stringify(corps),
    });
    const donnees = (await reponse.json().catch(() => ({}))) as { ok?: boolean; erreur?: string };
    return reponse.ok ? { ok: true } : { ok: false, erreur: donnees.erreur ?? "Erreur inconnue." };
  }


  async function ajouter(e: FormEvent) {
    e.preventDefault();
    if (etat.statut !== "pret") return;
    setMessage(null);
    setEnvoi(true);
    const resultat = await appeler("/api/equipe/creer-serveur", { prenom, email, motDePasse });
    setEnvoi(false);
    if (!resultat.ok) {
      setMessage({ ok: false, texte: resultat.erreur ?? "Erreur." });
      return;
    }
    setMessage({ ok: true, texte: "Compte créé. Donne-lui son e-mail et son mot de passe : il se connecte sur /equipe." });
    setPrenom("");
    setEmail("");
    setMotDePasse("");
    chargerServeurs(etat.bar.id);
  }


  async function retirer(id: string) {
    if (etat.statut !== "pret") return;
    setMessage(null);
    const resultat = await appeler("/api/equipe/retirer-serveur", { serveurId: id });
    setARetirer(null);
    if (!resultat.ok) setMessage({ ok: false, texte: resultat.erreur ?? "Erreur." });
    chargerServeurs(etat.bar.id);
  }


  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-white p-4 pb-16 text-[#14193C]">
      <Link href="/gerant" className="text-sm font-semibold text-[#007F77] underline">
        ← Retour à mon espace
      </Link>
      <h1 className="mt-3 text-2xl font-extrabold">Mon équipe</h1>
      <LiensGerant />


      {etat.statut === "chargement" && <p className="mt-4 text-sm">Chargement…</p>}
      {etat.statut === "interdit" && (
        <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm">{etat.message}</p>
      )}


      {etat.statut === "pret" && (
        <>
          <p className="mt-3 text-sm text-[#5B607E]">
            Un serveur peut scanner les QR codes et voir les commandes à servir. Il ne voit ni les statistiques, ni les remboursements, ni la banque.
          </p>


          <div className="mt-4 space-y-2">
            {serveurs.length === 0 && (
              <p className="rounded-xl border border-[#E7DDC8] bg-[#FFF4E2] p-3 text-sm">Aucun serveur pour le moment.</p>
            )}
            {serveurs.map((s) => (
              <div key={s.id} className="rounded-xl border border-[#E7DDC8] bg-[#FFF4E2] p-3">
                <p className="font-bold">{s.prenom}</p>
                <p className="text-sm text-[#5B607E]">{s.email}</p>
                <div className="mt-2 flex gap-2 text-sm">
                  {aRetirer === s.id ? (
                    <>
                      <button type="button" onClick={() => retirer(s.id)} className="rounded-full bg-[#E2372D] px-3 py-1 font-semibold text-white">
                        Confirmer : supprimer son compte
                      </button>
                      <button type="button" onClick={() => setARetirer(null)} className="rounded-full border border-gray-400 px-3 py-1">
                        Annuler
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={() => setARetirer(s.id)} className="rounded-full border border-[#E2372D] px-3 py-1 font-semibold text-[#E2372D]">
                      Retirer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>


          <form onSubmit={ajouter} className="mt-5 space-y-3 rounded-2xl border border-[#E7DDC8] p-3">
            <h2 className="font-bold">Créer un compte serveur</h2>
            <label className="block text-sm font-semibold">
              Prénom
              <input className={CHAMP + " mt-1 font-normal"} value={prenom} onChange={(e) => setPrenom(e.target.value)} />
            </label>
            <label className="block text-sm font-semibold">
              E-mail du serveur
              <input className={CHAMP + " mt-1 font-normal"} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="block text-sm font-semibold">
              Mot de passe (8 caractères minimum)
              <input className={CHAMP + " mt-1 font-normal"} type="text" autoComplete="off" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />
            </label>
            <button type="submit" disabled={envoi} className="w-full rounded-full bg-[#007F77] px-4 py-3 font-bold text-white disabled:opacity-60">
              {envoi ? "Création…" : "Créer le compte"}
            </button>
          </form>


          {message && (
            <p className={"mt-3 rounded-lg p-2 text-sm " + (message.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700")}>
              {message.texte}
            </p>
          )}
        </>
      )}
    </main>
  );
}
