"use client";


import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { formatPrix } from "../../lib/utils";


type Props = { barId: string | number };


type OffreVivante = {
  id: string;
  produit: string;
  prix_reduit: number;
  debut: string;
  fin: string;
  categorie: string | null;
  nom_plat: string | null;
};


function formatJourHeure(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}


const REPONSES: Record<string, string> = {
  arretee: "L'offre est arrêtée : elle a disparu de la carte. Les clients qui ont déjà payé gardent leur QR code.",
  supprimee: "L'offre n'avait pas commencé : elle est supprimée.",
  deja_terminee: "Cette offre était déjà terminée.",
  introuvable: "Offre introuvable (ou ce n'est pas la tienne).",
  non_connecte: "Tu n'es plus connecté.",
};


export default function OffresEnCours({ barId }: Props) {
  const [offres, setOffres] = useState<OffreVivante[]>([]);
  const [chargement, setChargement] = useState(true);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  const [aArreter, setAArreter] = useState<string | null>(null);


  const recharger = useCallback(async () => {
    const { data, error } = await supabase
      .from("offres")
      .select("id, produit, prix_reduit, debut, fin, categorie, nom_plat")
      .eq("bar_id", barId)
      .gt("fin", new Date().toISOString())
      .order("debut", { ascending: true });
    if (error) {
      setMessage({ ok: false, texte: "Impossible de lire tes offres : " + error.message });
    } else {
      setOffres((data ?? []) as OffreVivante[]);
    }
    setChargement(false);
  }, [barId]);


  useEffect(() => {
    recharger();
  }, [recharger]);


  async function arreter(id: string) {
    setMessage(null);
    const { data, error } = await supabase.rpc("arreter_offre", { p_offre: id });
    setAArreter(null);
    if (error) {
      setMessage({ ok: false, texte: "Impossible d'arrêter l'offre : " + error.message });
    } else {
      const resultat = (data as { resultat?: string } | null)?.resultat ?? "";
      setMessage({ ok: resultat === "arretee" || resultat === "supprimee", texte: REPONSES[resultat] ?? "Fait." });
    }
    recharger();
  }


  return (
    <section className="mt-6">
      <h2 className="text-xl font-bold">Offres en cours et à venir</h2>
      <p className="mt-1 text-sm text-[#5B607E]">
        Un souci (rupture, erreur de prix) ? « Masquer » arrête l'offre tout de suite : elle disparaît de la carte et personne ne peut plus l'acheter.
      </p>


      {message && (
        <p className={"mt-3 rounded-lg p-2 text-sm " + (message.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700")}>{message.texte}</p>
      )}


      <div className="mt-3 space-y-2">
        {chargement && <p className="text-sm">Chargement…</p>}
        {!chargement && offres.length === 0 && (
          <p className="rounded-xl border border-[#E7DDC8] bg-[#FFF4E2] p-3 text-sm">Aucune offre en cours ni programmée.</p>
        )}
        {offres.map((o) => (
          <div key={o.id} className="rounded-xl border border-[#E7DDC8] bg-[#FFF4E2] p-3">
            <p className="font-bold">{(o.categorie === "plat" || o.categorie === "activite") && o.nom_plat ? o.nom_plat : o.produit}</p>
            <p className="text-sm">{formatPrix(o.prix_reduit)}</p>
            <p className="text-sm text-[#5B607E]">{formatJourHeure(o.debut) + " → " + formatJourHeure(o.fin)}</p>
            <div className="mt-2 flex gap-2 text-sm">
              {aArreter === o.id ? (
                <>
                  <button type="button" onClick={() => arreter(o.id)} className="rounded-full bg-[#E2372D] px-3 py-1 font-semibold text-white">
                    Confirmer : masquer maintenant
                  </button>
                  <button type="button" onClick={() => setAArreter(null)} className="rounded-full border border-gray-400 px-3 py-1">
                    Annuler
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => setAArreter(o.id)} className="rounded-full border border-[#E2372D] px-3 py-1 font-semibold text-[#E2372D]">
                  Masquer
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
