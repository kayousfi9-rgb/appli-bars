"use client";


import { useState, type FormEvent } from "react";
import { supabase } from "../../lib/supabase";


type Props = { barId: string | number; onPubliee: () => void };


type TypeOffre = "boisson" | "plat" | "activite";


const TYPES_BOISSON = ["bière", "vin", "cocktail", "sans alcool"];
const CHAMP =
  "w-full rounded-lg border border-[#E7DDC8] bg-white px-3 py-2 text-base text-[#14193C]";


function lireNombre(texte: string): number {
  return Number(texte.replace(",", ".").trim());
}


// Transforme un nombre de millisecondes en texte pour le champ date et heure (heure locale du téléphone)
function versChampLocal(ms: number): string {
  const d = new Date(ms);
  const deux = (n: number) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + deux(d.getMonth() + 1) + "-" + deux(d.getDate()) + "T" + deux(d.getHours()) + ":" + deux(d.getMinutes());
}


export default function NouvelleOffre({ barId, onPubliee }: Props) {
  const [ouvert, setOuvert] = useState(false);
  const [type, setType] = useState<TypeOffre>("boisson");
  const [nom, setNom] = useState("");
  const [typeBoisson, setTypeBoisson] = useState("bière");
  const [prixNormal, setPrixNormal] = useState("");
  const [prixReduit, setPrixReduit] = useState("");
  const [quantite, setQuantite] = useState("");
  const [debut, setDebut] = useState("");
  const [duree, setDuree] = useState("120");
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);


  function ouvrir() {
    setMessage(null);
    setDebut(versChampLocal(Date.now() + 5 * 60 * 1000));
    setOuvert(true);
  }


  async function publier(e: FormEvent) {
    e.preventDefault();
    setMessage(null);


    const normal = lireNombre(prixNormal);
    const reduit = lireNombre(prixReduit);
    const qte = quantite.trim() === "" ? null : Math.floor(lireNombre(quantite));
    const debutMs = new Date(debut).getTime();
    const minutes = Math.floor(lireNombre(duree));


    if (nom.trim() === "") return setMessage({ ok: false, texte: "Donne un nom à l'offre." });
    if (!(normal > 0) || !(reduit > 0)) return setMessage({ ok: false, texte: "Les deux prix doivent être des nombres positifs." });
    if (reduit >= normal) return setMessage({ ok: false, texte: "Le prix réduit doit être plus petit que le prix normal." });
    if (qte !== null && !(qte >= 1)) return setMessage({ ok: false, texte: "La quantité doit être 1 ou plus (ou laisse vide)." });
    if (Number.isNaN(debutMs)) return setMessage({ ok: false, texte: "Choisis une date et une heure de début." });
    if (debutMs < Date.now() - 60 * 1000) return setMessage({ ok: false, texte: "Le début est déjà passé. Choisis une heure à venir." });
    if (!(minutes >= 15 && minutes <= 720)) return setMessage({ ok: false, texte: "La durée doit être entre 15 et 720 minutes." });


    setEnvoi(true);
    const { error } = await supabase.from("offres").insert({
      bar_id: barId,
      produit: nom.trim(),
      nom_plat: type === "boisson" ? null : nom.trim(),
      type_boisson: type === "boisson" ? typeBoisson : null,
      categorie: type,
      prix_normal: normal,
      prix_reduit: reduit,
      quantite: qte,
      debut: new Date(debutMs).toISOString(),
      fin: new Date(debutMs + minutes * 60 * 1000).toISOString(),
    });
    setEnvoi(false);


    if (error) {
      setMessage({ ok: false, texte: "Publication impossible : " + error.message });
      return;
    }
    setMessage({ ok: true, texte: "C'est publié." });
    setNom("");
    setPrixNormal("");
    setPrixReduit("");
    setQuantite("");
    setOuvert(false);
    onPubliee();
  }


  return (
    <section className="mt-6">
      <h2 className="text-xl font-bold">Publier une offre</h2>
      <p className="mt-1 text-sm text-[#5B607E]">Une boisson, un plat ou une activité (une partie, une séance, une entrée…).</p>


      {message && (
        <p className={"mt-3 rounded-lg p-2 text-sm " + (message.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700")}>{message.texte}</p>
      )}


      {!ouvert ? (
        <button type="button" onClick={ouvrir} className="mt-3 rounded-full bg-[#007F77] px-5 py-2 font-bold text-white">
          Nouvelle offre
        </button>
      ) : (
        <form onSubmit={publier} className="mt-3 space-y-3 rounded-2xl border border-[#E7DDC8] p-3">
          <div className="flex gap-2">
            {(["boisson", "plat", "activite"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={"flex-1 rounded-full border px-3 py-2 text-sm font-semibold " + (type === t ? "border-[#007F77] bg-[#007F77] text-white" : "border-[#E7DDC8] bg-white")}
              >
                {t === "boisson" ? "Boisson" : t === "plat" ? "Plat" : "Activité"}
              </button>
            ))}
          </div>


          <label className="block text-sm font-semibold">
            {type === "boisson" ? "Nom de la boisson" : type === "plat" ? "Nom du plat" : "Nom de l'activité"}
            <input
              className={CHAMP + " mt-1 font-normal"}
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder={type === "boisson" ? "Pinte de blonde" : type === "plat" ? "Burger du jour" : "Partie de laser game"}
            />
          </label>


          {type === "boisson" && (
            <label className="block text-sm font-semibold">
              Type
              <select className={CHAMP + " mt-1 font-normal"} value={typeBoisson} onChange={(e) => setTypeBoisson(e.target.value)}>
                {TYPES_BOISSON.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {typeBoisson !== "sans alcool" && (
                <span className="mt-1 block text-xs font-normal text-[#5B607E]">
                  Une boisson alcoolisée demande une licence vérifiée (voir « Mon lieu »).
                </span>
              )}
            </label>
          )}


          <div className="grid grid-cols-3 gap-2">
            <label className="block text-sm font-semibold">
              Prix normal (€)
              <input className={CHAMP + " mt-1 font-normal"} inputMode="decimal" value={prixNormal} onChange={(e) => setPrixNormal(e.target.value)} />
            </label>
            <label className="block text-sm font-semibold">
              Prix réduit (€)
              <input className={CHAMP + " mt-1 font-normal"} inputMode="decimal" value={prixReduit} onChange={(e) => setPrixReduit(e.target.value)} />
            </label>
            <label className="block text-sm font-semibold">
              Quantité
              <input className={CHAMP + " mt-1 font-normal"} inputMode="numeric" value={quantite} onChange={(e) => setQuantite(e.target.value)} />
            </label>
          </div>


          <div className="grid grid-cols-2 gap-2">
            <label className="block text-sm font-semibold">
              Début
              <input type="datetime-local" className={CHAMP + " mt-1 font-normal"} value={debut} onChange={(e) => setDebut(e.target.value)} />
            </label>
            <label className="block text-sm font-semibold">
              Durée (minutes)
              <input className={CHAMP + " mt-1 font-normal"} inputMode="numeric" value={duree} onChange={(e) => setDuree(e.target.value)} />
            </label>
          </div>


          <div className="flex gap-2">
            <button type="submit" disabled={envoi} className="flex-1 rounded-full bg-[#007F77] px-4 py-3 font-bold text-white disabled:opacity-60">
              {envoi ? "Publication…" : "Publier"}
            </button>
            <button type="button" onClick={() => setOuvert(false)} className="rounded-full border border-gray-400 px-4 py-3">
              Annuler
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
