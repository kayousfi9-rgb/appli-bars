"use client";


import { useCallback, useEffect, useState, type FormEvent } from "react";
import { supabase } from "../../lib/supabase";
import { formaterEuros } from "../../lib/commandes";
import { nomOffreLiee, premierLie, type Lie, type OffreLiee } from "../../lib/equipe";


type CommandeRecente = {
  id: string;
  prix_paye: number;
  statut: string;
  created_at: string;
  rembourse_le: string | null;
  offres: Lie<OffreLiee>;
  bars: Lie<{ nom: string }>;
};


type SignalementClient = { commande_id: string; statut: "ouvert" | "rembourse" | "refuse"; reponse: string | null };


const MOTIFS = [
  { id: "non_servi", texte: "Je n'ai pas été servi" },
  { id: "mauvais_produit", texte: "Mauvais produit servi" },
  { id: "qualite", texte: "Problème de qualité" },
  { id: "autre", texte: "Autre problème" },
];


const ETATS = { ouvert: "En cours d'examen", rembourse: "Remboursé", refuse: "Refusé" };


function dateHeure(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}


export default function SignalerProbleme() {
  const [pret, setPret] = useState(false);
  const [connecte, setConnecte] = useState(false);
  const [commandes, setCommandes] = useState<CommandeRecente[]>([]);
  const [signalements, setSignalements] = useState<Record<string, SignalementClient>>({});
  const [ouverte, setOuverte] = useState<string | null>(null);
  const [motif, setMotif] = useState("non_servi");
  const [details, setDetails] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);


  const charger = useCallback(async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      setConnecte(false);
      setPret(true);
      return;
    }
    setConnecte(true);
    const depuis = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const { data } = await supabase
      .from("commandes")
      .select("id, prix_paye, statut, created_at, rembourse_le, offres(produit, nom_plat, categorie), bars(nom)")
      .gt("created_at", depuis)
      .order("created_at", { ascending: false })
      .limit(20);
    setCommandes((data ?? []) as unknown as CommandeRecente[]);


    const { data: sigs } = await supabase.from("signalements").select("commande_id, statut, reponse");
    const table: Record<string, SignalementClient> = {};
    for (const s of (sigs ?? []) as SignalementClient[]) table[s.commande_id] = s;
    setSignalements(table);
    setPret(true);
  }, []);


  useEffect(() => {
    charger();
  }, [charger]);


  async function envoyer(e: FormEvent, commandeId: string) {
    e.preventDefault();
    setMessage(null);
    const { data: session } = await supabase.auth.getSession();
    const idClient = session.session?.user.id;
    if (!idClient) {
      setMessage({ ok: false, texte: "Tu n'es plus connecté." });
      return;
    }
    setEnvoi(true);
    const { error } = await supabase.from("signalements").insert({
      commande_id: commandeId,
      client_id: idClient,
      motif,
      details: details.trim() === "" ? null : details.trim().slice(0, 500),
    });
    setEnvoi(false);
    if (error) {
      setMessage({ ok: false, texte: "Envoi impossible : " + error.message });
      return;
    }
    setMessage({ ok: true, texte: "Merci, ton signalement est envoyé au gérant. Tu verras sa réponse ici." });
    setOuverte(null);
    setDetails("");
    charger();
  }


  if (!pret) return <p className="text-sm">Chargement…</p>;


  if (!connecte) {
    return (
      <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm">
        Connecte-toi d'abord à ton compte client, puis reviens sur cette page.
      </p>
    );
  }


  return (
    <div className="space-y-3">
      <p className="text-sm text-[#5B607E]">
        Un problème avec une commande des 7 derniers jours ? Signale-le : le gérant examine ta demande et peut te rembourser.
      </p>


      {message && (
        <p className={"rounded-lg p-2 text-sm " + (message.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700")}>{message.texte}</p>
      )}


      {commandes.length === 0 && (
        <p className="rounded-xl border border-[#E7DDC8] bg-[#FFF4E2] p-3 text-sm">Aucune commande dans les 7 derniers jours.</p>
      )}


      {commandes.map((c) => {
        const sig = signalements[c.id];
        return (
          <div key={c.id} className="rounded-xl border border-[#E7DDC8] bg-[#FFF4E2] p-3">
            <p className="font-bold">{nomOffreLiee(c.offres)}</p>
            <p className="text-sm">
              {(premierLie(c.bars)?.nom ?? "") + " · " + formaterEuros(c.prix_paye) + " · " + dateHeure(c.created_at)}
            </p>
            {c.rembourse_le && <p className="text-sm font-semibold text-[#007F77]">Commande remboursée</p>}


            {sig ? (
              <p className="mt-2 text-sm">
                {"Signalement : " + ETATS[sig.statut]}
                {sig.reponse ? " · « " + sig.reponse + " »" : ""}
              </p>
            ) : ouverte === c.id ? (
              <form onSubmit={(e) => envoyer(e, c.id)} className="mt-3 space-y-2">
                <label className="block text-sm font-semibold">
                  Que s'est-il passé ?
                  <select
                    className="mt-1 w-full rounded-lg border border-[#E7DDC8] bg-white px-3 py-2 text-base font-normal"
                    value={motif}
                    onChange={(e) => setMotif(e.target.value)}
                  >
                    {MOTIFS.map((m) => (
                      <option key={m.id} value={m.id}>{m.texte}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold">
                  Détails (facultatif)
                  <textarea
                    className="mt-1 w-full rounded-lg border border-[#E7DDC8] bg-white px-3 py-2 text-base font-normal"
                    rows={3}
                    maxLength={500}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                  />
                </label>
                <div className="flex gap-2">
                  <button type="submit" disabled={envoi} className="flex-1 rounded-full bg-[#007F77] px-4 py-2 font-bold text-white disabled:opacity-60">
                    {envoi ? "Envoi…" : "Envoyer"}
                  </button>
                  <button type="button" onClick={() => setOuverte(null)} className="rounded-full border border-gray-400 px-4 py-2">
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMessage(null);
                  setOuverte(c.id);
                }}
                className="mt-2 rounded-full border border-[#007F77] px-3 py-1 text-sm font-semibold text-[#007F77]"
              >
                Signaler un problème
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
