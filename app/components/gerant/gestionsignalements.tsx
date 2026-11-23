"use client";


import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { formaterEuros } from "../../lib/commandes";
import {
  chargerMonEtablissement,
  jetonSession,
  nomOffreLiee,
  premierLie,
  type Lie,
  type MonEtablissement,
  type OffreLiee,
} from "../../lib/equipe";
import LiensGerant from "./liensgerant";

type Ligne = {
  id: string;
  motif: string;
  details: string | null;
  statut: "ouvert" | "rembourse" | "refuse";
  reponse: string | null;
  cree_le: string;
  commandes: Lie<{ prix_paye: number; created_at: string; rembourse_le: string | null; offres: Lie<OffreLiee> }>;
};


type Etat =
  | { statut: "chargement" }
  | { statut: "interdit"; message: string }
  | { statut: "pret"; bar: MonEtablissement };


const MOTIFS: Record<string, string> = {
  non_servi: "Je n'ai pas été servi",
  mauvais_produit: "Mauvais produit servi",
  qualite: "Problème de qualité",
  autre: "Autre problème",
};


const STATUTS: Record<Ligne["statut"], string> = {
  ouvert: "À traiter",
  rembourse: "Remboursé",
  refuse: "Refusé",
};


function dateHeure(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}


export default function GestionSignalements() {
  const [etat, setEtat] = useState<Etat>({ statut: "chargement" });
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  const [reponses, setReponses] = useState<Record<string, string>>({});
  const [aConfirmer, setAConfirmer] = useState<string | null>(null);
  const [enCours, setEnCours] = useState<string | null>(null);


  const charger = useCallback(async (barId: string) => {
    const { data, error } = await supabase
      .from("signalements")
      .select(
        "id, motif, details, statut, reponse, cree_le, commandes(prix_paye, created_at, rembourse_le, offres(produit, nom_plat, categorie))"
      )
      .eq("bar_id", barId)
      .order("cree_le", { ascending: false })
      .limit(50);
    if (error) {
      setMessage({ ok: false, texte: "Impossible de lire les signalements : " + error.message });
      return;
    }
    setLignes((data ?? []) as unknown as Ligne[]);
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
      charger(bar.id);
    })();
  }, [charger]);


  async function decider(id: string, decision: "rembourser" | "refuser") {
    if (etat.statut !== "pret") return;
    setMessage(null);
    setEnCours(id);
    const jeton = await jetonSession();
    if (!jeton) {
      setEnCours(null);
      setMessage({ ok: false, texte: "Tu n'es plus connecté." });
      return;
    }
    const reponse = await fetch("/api/stripe/rembourser", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + jeton },
      body: JSON.stringify({ signalementId: id, decision, reponse: reponses[id] ?? "" }),
    });
    const donnees = (await reponse.json().catch(() => ({}))) as { erreur?: string };
    setEnCours(null);
    setAConfirmer(null);
    if (!reponse.ok) {
      setMessage({ ok: false, texte: donnees.erreur ?? "Erreur inconnue." });
    } else {
      setMessage({ ok: true, texte: decision === "rembourser" ? "Remboursement effectué." : "Signalement refusé." });
    }
    charger(etat.bar.id);
  }


  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-white p-4 pb-16 text-[#14193C]">
      <Link href="/gerant" className="text-sm font-semibold text-[#007F77] underline">
        ← Retour à mon espace
      </Link>
      <h1 className="mt-3 text-2xl font-extrabold">Signalements des clients</h1>
      <LiensGerant />


      {etat.statut === "chargement" && <p className="mt-4 text-sm">Chargement…</p>}
      {etat.statut === "interdit" && (
        <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm">{etat.message}</p>
      )}


      {message && (
        <p className={"mt-3 rounded-lg p-2 text-sm " + (message.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700")}>
          {message.texte}
        </p>
      )}


      {etat.statut === "pret" && (
        <div className="mt-4 space-y-3">
          {lignes.length === 0 && (
            <p className="rounded-xl border border-[#E7DDC8] bg-[#FFF4E2] p-3 text-sm">Aucun signalement pour le moment.</p>
          )}
          {lignes.map((l) => {
            const commande = premierLie(l.commandes);
            return (
              <div key={l.id} className="rounded-xl border border-[#E7DDC8] bg-[#FFF4E2] p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">{commande ? nomOffreLiee(commande.offres) : "Commande"}</p>
                    <p className="text-sm">
                      {(commande ? formaterEuros(commande.prix_paye) + " · acheté le " + dateHeure(commande.created_at) : "")}
                    </p>
                  </div>
                  <span
                    className={
                      "rounded-full px-2 py-0.5 text-xs font-semibold " +
                      (l.statut === "ouvert" ? "bg-[#E2372D] text-white" : "bg-gray-300 text-gray-800")
                    }
                  >
                    {STATUTS[l.statut]}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold">{MOTIFS[l.motif] ?? l.motif}</p>
                {l.details && <p className="text-sm">{"« " + l.details + " »"}</p>}
                <p className="text-xs text-[#5B607E]">{"Signalé le " + dateHeure(l.cree_le)}</p>
                {l.reponse && <p className="mt-1 text-sm">{"Ta réponse : " + l.reponse}</p>}


                {l.statut === "ouvert" && (
                  <div className="mt-3 space-y-2">
                    <input
                      className="w-full rounded-lg border border-[#E7DDC8] bg-white px-3 py-2 text-sm"
                      placeholder="Un mot pour le client (facultatif)"
                      maxLength={300}
                      value={reponses[l.id] ?? ""}
                      onChange={(e) => setReponses((avant) => ({ ...avant, [l.id]: e.target.value }))}
                    />
                    <div className="flex flex-wrap gap-2 text-sm">
                      {aConfirmer === l.id ? (
                        <>
                          <button
                            type="button"
                            disabled={enCours === l.id}
                            onClick={() => decider(l.id, "rembourser")}
                            className="rounded-full bg-[#E2372D] px-3 py-1 font-semibold text-white disabled:opacity-60"
                          >
                            {enCours === l.id ? "En cours…" : "Confirmer le remboursement"}
                          </button>
                          <button type="button" onClick={() => setAConfirmer(null)} className="rounded-full border border-gray-400 px-3 py-1">
                            Annuler
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setAConfirmer(l.id)}
                            className="rounded-full bg-[#007F77] px-3 py-1 font-semibold text-white"
                          >
                            Rembourser
                          </button>
                          <button
                            type="button"
                            disabled={enCours === l.id}
                            onClick={() => decider(l.id, "refuser")}
                            className="rounded-full border border-gray-500 px-3 py-1 font-semibold"
                          >
                            Refuser
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
