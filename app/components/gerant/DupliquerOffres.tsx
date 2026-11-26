"use client";


import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { formatPrix } from "../../lib/utils";


type Props = { barId: string | number };


type OffrePassee = {
  id: string | number;
  produit: string;
  type_boisson: string | null;
  prix_normal: number;
  prix_reduit: number;
  debut: string;
  fin: string;
  quantite: number | null;
  categorie: string | null;
  nom_plat: string | null;
};


const CHAMP =
  "w-full rounded-lg border border-[#E7DDC8] bg-white px-3 py-2 text-base text-[#14193C]";


function formatJourHeure(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}


// Transforme un nombre de millisecondes en texte pour le champ date et heure (heure locale du téléphone)
function versChampLocal(ms: number): string {
  const d = new Date(ms);
  const deux = (n: number) => String(n).padStart(2, "0");
  return (
    d.getFullYear() + "-" + deux(d.getMonth() + 1) + "-" + deux(d.getDate()) + "T" + deux(d.getHours()) + ":" + deux(d.getMinutes())
  );
}


export default function DupliquerOffres({ barId }: Props) {
  const [offres, setOffres] = useState<OffrePassee[]>([]);
  const [chargement, setChargement] = useState(true);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);


  // Le formulaire de duplication (une seule offre à la fois)
  const [ouverte, setOuverte] = useState<string | number | null>(null);
  const [debut, setDebut] = useState("");
  const [duree, setDuree] = useState("120");
  const [quantite, setQuantite] = useState("");
  const [envoi, setEnvoi] = useState(false);


  const recharger = useCallback(async () => {
    const { data, error } = await supabase
      .from("offres")
      .select("id, produit, type_boisson, prix_normal, prix_reduit, debut, fin, quantite, categorie, nom_plat")
      .eq("bar_id", barId)
      .order("debut", { ascending: false })
      .limit(15);
    if (error) {
      setMessage({ ok: false, texte: "Impossible de lire tes offres : " + error.message });
    } else {
      setOffres((data ?? []) as OffrePassee[]);
    }
    setChargement(false);
  }, [barId]);


  useEffect(() => {
    recharger();
  }, [recharger]);


  function ouvrir(o: OffrePassee) {
    setMessage(null);
    setOuverte(o.id);
    const minutes = Math.round((new Date(o.fin).getTime() - new Date(o.debut).getTime()) / 60000);
    setDuree(String(Math.min(720, Math.max(15, minutes))));
    setQuantite(o.quantite !== null && o.quantite > 0 ? String(o.quantite) : "");
    setDebut(versChampLocal(Date.now() + 5 * 60 * 1000));
  }


  function demainMemeHeure(o: OffrePassee) {
    // même heure que l'offre d'origine, mais demain
    const heure = new Date(o.debut);
    const demain = new Date();
    demain.setDate(demain.getDate() + 1);
    demain.setHours(heure.getHours(), heure.getMinutes(), 0, 0);
    setDebut(versChampLocal(demain.getTime()));
  }


  async function publier(e: React.FormEvent, o: OffrePassee) {
    e.preventDefault();
    setMessage(null);


    const debutMs = new Date(debut).getTime();
    const minutes = Math.floor(Number(duree.replace(",", ".")));
    const qte = quantite.trim() === "" ? null : Math.floor(Number(quantite));


    if (Number.isNaN(debutMs)) return setMessage({ ok: false, texte: "Choisis une date et une heure de début." });
    if (debutMs < Date.now() - 60 * 1000) return setMessage({ ok: false, texte: "Le début est déjà passé. Choisis une heure à venir." });
    if (!(minutes >= 15 && minutes <= 720)) return setMessage({ ok: false, texte: "La durée doit être entre 15 et 720 minutes." });
    if (qte !== null && !(qte >= 1)) return setMessage({ ok: false, texte: "La quantité doit être 1 ou plus (ou laisse vide)." });


    setEnvoi(true);
    const { error } = await supabase.from("offres").insert({
      bar_id: barId,
      produit: o.produit,
      type_boisson: o.type_boisson,
      prix_normal: o.prix_normal,
      prix_reduit: o.prix_reduit,
      debut: new Date(debutMs).toISOString(),
      fin: new Date(debutMs + minutes * 60 * 1000).toISOString(),
      quantite: qte,
      categorie: o.categorie,
      nom_plat: o.nom_plat,
    });
    setEnvoi(false);


    if (error) {
      setMessage({ ok: false, texte: "Publication impossible : " + error.message });
      return;
    }
    setMessage({ ok: true, texte: "C'est publié. Si le début est dans le futur, l'offre apparaît dans l'onglet « Ce soir »." });
    setOuverte(null);
    recharger();
  }


  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold">Republier une offre</h2>
      <p className="mt-1 text-sm text-[#5B607E]">
        Reprends une de tes dernières offres : tu changes juste le moment (maintenant, ce soir, demain), la durée et la quantité.
      </p>


      {message && (
        <p className={"mt-3 rounded-lg p-2 text-sm " + (message.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700")}>{message.texte}</p>
      )}


      <div className="mt-3 space-y-2">
        {chargement && <p className="text-sm">Chargement…</p>}
        {!chargement && offres.length === 0 && (
          <p className="rounded-xl border border-[#E7DDC8] bg-[#FFF4E2] p-3 text-sm">Tu n'as pas encore publié d'offre.</p>
        )}


        {offres.map((o) => (
          <div key={o.id} className="rounded-xl border border-[#E7DDC8] bg-[#FFF4E2] p-3">
            <p className="font-bold">{(o.categorie === "plat" || o.categorie === "activite") && o.nom_plat ? o.nom_plat : o.produit}</p>
            <p className="text-sm">{formatPrix(o.prix_reduit) + " au lieu de " + formatPrix(o.prix_normal)}</p>
            <p className="text-sm text-[#5B607E]">{formatJourHeure(o.debut) + " → " + formatJourHeure(o.fin)}</p>


            {ouverte !== o.id ? (
              <button type="button" onClick={() => ouvrir(o)} className="mt-2 rounded-full border border-[#007F77] px-3 py-1 text-sm font-semibold text-[#007F77]">
                Republier
              </button>
            ) : (
              <form onSubmit={(e) => publier(e, o)} className="mt-3 space-y-2">
                <label className="block text-sm font-semibold">
                  Début
                  <input type="datetime-local" className={CHAMP + " mt-1 font-normal"} value={debut} onChange={(e) => setDebut(e.target.value)} />
                </label>
                <div className="flex gap-2 text-sm">
                  <button type="button" onClick={() => setDebut(versChampLocal(Date.now() + 5 * 60 * 1000))} className="rounded-full border border-[#E7DDC8] bg-white px-3 py-1">
                    Maintenant
                  </button>
                  <button type="button" onClick={() => demainMemeHeure(o)} className="rounded-full border border-[#E7DDC8] bg-white px-3 py-1">
                    Demain, même heure
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-sm font-semibold">
                    Durée (minutes)
                    <input className={CHAMP + " mt-1 font-normal"} inputMode="numeric" value={duree} onChange={(e) => setDuree(e.target.value)} />
                  </label>
                  <label className="block text-sm font-semibold">
                    Quantité
                    <input className={CHAMP + " mt-1 font-normal"} inputMode="numeric" value={quantite} onChange={(e) => setQuantite(e.target.value)} />
                  </label>
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={envoi} className="flex-1 rounded-full bg-[#007F77] px-4 py-2 font-bold text-white disabled:opacity-60">
                    {envoi ? "Publication…" : "Publier"}
                  </button>
                  <button type="button" onClick={() => setOuverte(null)} className="rounded-full border border-gray-400 px-4 py-2">
                    Annuler
                  </button>
                </div>
              </form>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
