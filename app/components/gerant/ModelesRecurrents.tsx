"use client";


import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { formatPrix } from "../../lib/utils";
import {
  JOURS_COURTS,
  heureCourte,
  libelleJours,
  nomModele,
  type OffreRecurrente,
} from "../../lib/recurrence";


type Props = { barId: string | number };


const TYPES_BOISSON = ["bière", "vin", "cocktail", "sans alcool"];
const CHAMP =
  "w-full rounded-lg border border-[#E7DDC8] bg-white px-3 py-2 text-base text-[#14193C]";


// « 4,50 » ou « 4.5 » devient 4.5 ; NaN si ce n'est pas un nombre
function lireNombre(texte: string): number {
  return Number(texte.replace(",", ".").trim());
}


export default function ModelesRecurrents({ barId }: Props) {
  const [modeles, setModeles] = useState<OffreRecurrente[]>([]);
  const [chargement, setChargement] = useState(true);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [aSupprimer, setASupprimer] = useState<string | null>(null);


  // Le formulaire
  const [categorie, setCategorie] = useState<"boisson" | "plat" | "activite">("boisson");
  const [nom, setNom] = useState("");
  const [typeBoisson, setTypeBoisson] = useState("bière");
  const [prixNormal, setPrixNormal] = useState("");
  const [prixReduit, setPrixReduit] = useState("");
  const [quantite, setQuantite] = useState("");
  const [jours, setJours] = useState<number[]>([]);
  const [debut, setDebut] = useState("18:00");
  const [fin, setFin] = useState("20:00");


  const recharger = useCallback(async () => {
    const { data, error } = await supabase
      .from("offres_recurrentes")
      .select("*")
      .eq("bar_id", barId)
      .order("heure_debut", { ascending: true });
    if (error) {
      setMessage({ ok: false, texte: "Impossible de lire tes offres récurrentes : " + error.message });
    } else {
      setModeles((data ?? []) as OffreRecurrente[]);
    }
    setChargement(false);
  }, [barId]);


  useEffect(() => {
    recharger();
  }, [recharger]);


  function basculerJour(j: number) {
    setJours((avant) => (avant.includes(j) ? avant.filter((x) => x !== j) : [...avant, j]));
  }


  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);


    const normal = lireNombre(prixNormal);
    const reduit = lireNombre(prixReduit);
    const qte = quantite.trim() === "" ? null : Math.floor(lireNombre(quantite));


    if (nom.trim() === "") return setMessage({ ok: false, texte: "Donne un nom à l'offre." });
    if (!(normal > 0) || !(reduit > 0)) return setMessage({ ok: false, texte: "Les deux prix doivent être des nombres positifs." });
    if (reduit >= normal) return setMessage({ ok: false, texte: "Le prix réduit doit être plus petit que le prix normal." });
    if (qte !== null && !(qte >= 1)) return setMessage({ ok: false, texte: "La quantité doit être 1 ou plus (ou laisse vide)." });
    if (jours.length === 0) return setMessage({ ok: false, texte: "Choisis au moins un jour." });
    if (debut === "" || fin === "" || debut === fin) return setMessage({ ok: false, texte: "Les heures de début et de fin doivent être différentes." });


    setEnvoi(true);
    const { error } = await supabase.from("offres_recurrentes").insert({
      bar_id: barId,
      categorie,
      produit: nom.trim(),
      nom_plat: categorie !== "boisson" ? nom.trim() : null,
      type_boisson: categorie === "boisson" ? typeBoisson : null,
      prix_normal: normal,
      prix_reduit: reduit,
      quantite: qte,
      jours: [...jours].sort((a, b) => a - b),
      heure_debut: debut,
      heure_fin: fin,
      actif: true,
    });
    setEnvoi(false);


    if (error) {
      setMessage({ ok: false, texte: "Enregistrement impossible : " + error.message });
      return;
    }
    setMessage({ ok: true, texte: "C'est enregistré. L'offre se créera toute seule aux jours et heures choisis." });
    setNom("");
    setPrixNormal("");
    setPrixReduit("");
    setQuantite("");
    setJours([]);
    recharger();
  }


  async function changerActif(m: OffreRecurrente) {
    setMessage(null);
    const { error } = await supabase.from("offres_recurrentes").update({ actif: !m.actif }).eq("id", m.id);
    if (error) setMessage({ ok: false, texte: "Modification impossible : " + error.message });
    recharger();
  }


  async function supprimer(id: string) {
    setMessage(null);
    const { error } = await supabase.from("offres_recurrentes").delete().eq("id", id);
    setASupprimer(null);
    if (error) setMessage({ ok: false, texte: "Suppression impossible : " + error.message });
    recharger();
  }


  return (
    <section className="mt-6">
      <h2 className="text-xl font-bold">Offres récurrentes</h2>
      <p className="mt-1 text-sm text-[#5B607E]">
        Par exemple : « Pinte à 4 € tous les jeudis et vendredis de 18h à 20h ». L'offre se publie toute seule, environ 30 minutes avant l'heure de début.
      </p>


      <div className="mt-3 space-y-2">
        {chargement && <p className="text-sm">Chargement…</p>}
        {!chargement && modeles.length === 0 && (
          <p className="rounded-xl border border-[#E7DDC8] bg-[#FFF4E2] p-3 text-sm">Aucune offre récurrente pour le moment.</p>
        )}
        {modeles.map((m) => (
          <div key={m.id} className="rounded-xl border border-[#E7DDC8] bg-[#FFF4E2] p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold">{nomModele(m)}</p>
                <p className="text-sm">
                  {formatPrix(m.prix_reduit) + " au lieu de " + formatPrix(m.prix_normal)}
                  {m.quantite !== null ? " · " + m.quantite + " dispo" : ""}
                </p>
                <p className="text-sm text-[#5B607E]">
                  {libelleJours(m.jours) + " · de " + heureCourte(m.heure_debut) + " à " + heureCourte(m.heure_fin)}
                </p>
              </div>
              <span
                className={"rounded-full px-2 py-0.5 text-xs font-semibold " + (m.actif ? "bg-[#007F77] text-white" : "bg-gray-300 text-gray-700")}
              >
                {m.actif ? "Active" : "En pause"}
              </span>
            </div>
            <div className="mt-2 flex gap-2 text-sm">
              <button type="button" onClick={() => changerActif(m)} className="rounded-full border border-[#007F77] px-3 py-1 font-semibold text-[#007F77]">
                {m.actif ? "Mettre en pause" : "Réactiver"}
              </button>
              {aSupprimer === m.id ? (
                <>
                  <button type="button" onClick={() => supprimer(m.id)} className="rounded-full bg-[#E2372D] px-3 py-1 font-semibold text-white">
                    Confirmer la suppression
                  </button>
                  <button type="button" onClick={() => setASupprimer(null)} className="rounded-full border border-gray-400 px-3 py-1">
                    Annuler
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => setASupprimer(m.id)} className="rounded-full border border-[#E2372D] px-3 py-1 font-semibold text-[#E2372D]">
                  Supprimer
                </button>
              )}
            </div>
          </div>
        ))}
      </div>


      <form onSubmit={ajouter} className="mt-4 space-y-3 rounded-2xl border border-[#E7DDC8] p-3">
        <h3 className="font-bold">Ajouter une offre récurrente</h3>


        <div className="flex gap-2">
          {(["boisson", "plat", "activite"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategorie(c)}
              className={"flex-1 rounded-full border px-3 py-2 text-sm font-semibold " + (categorie === c ? "border-[#007F77] bg-[#007F77] text-white" : "border-[#E7DDC8] bg-white")}
            >
              {c === "boisson" ? "Boisson" : c === "plat" ? "Plat" : "Activité"}
            </button>
          ))}
        </div>


        <label className="block text-sm font-semibold">
          {categorie === "boisson" ? "Nom de la boisson" : categorie === "plat" ? "Nom du plat" : "Nom de l'activité"}
          <input className={CHAMP + " mt-1 font-normal"} value={nom} onChange={(e) => setNom(e.target.value)} placeholder={categorie === "boisson" ? "Pinte de blonde" : categorie === "plat" ? "Burger du jour" : "Partie de laser game"} />
        </label>


        {categorie === "boisson" && (
          <label className="block text-sm font-semibold">
            Type
            <select className={CHAMP + " mt-1 font-normal"} value={typeBoisson} onChange={(e) => setTypeBoisson(e.target.value)}>
              {TYPES_BOISSON.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
        )}


        <div className="grid grid-cols-3 gap-2">
          <label className="block text-sm font-semibold">
            Prix normal (€)
            <input className={CHAMP + " mt-1 font-normal"} inputMode="decimal" value={prixNormal} onChange={(e) => setPrixNormal(e.target.value)} placeholder="7" />
          </label>
          <label className="block text-sm font-semibold">
            Prix réduit (€)
            <input className={CHAMP + " mt-1 font-normal"} inputMode="decimal" value={prixReduit} onChange={(e) => setPrixReduit(e.target.value)} placeholder="4" />
          </label>
          <label className="block text-sm font-semibold">
            Quantité
            <input className={CHAMP + " mt-1 font-normal"} inputMode="numeric" value={quantite} onChange={(e) => setQuantite(e.target.value)} placeholder="20" />
          </label>
        </div>


        <div>
          <p className="text-sm font-semibold">Jours</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {JOURS_COURTS.map((libelle, i) => {
              const numero = i + 1;
              const choisi = jours.includes(numero);
              return (
                <button
                  key={libelle}
                  type="button"
                  onClick={() => basculerJour(numero)}
                  aria-pressed={choisi}
                  className={"w-12 rounded-full border py-2 text-sm font-semibold " + (choisi ? "border-[#007F77] bg-[#007F77] text-white" : "border-[#E7DDC8] bg-white")}
                >
                  {libelle}
                </button>
              );
            })}
          </div>
        </div>


        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm font-semibold">
            De
            <input type="time" className={CHAMP + " mt-1 font-normal"} value={debut} onChange={(e) => setDebut(e.target.value)} />
          </label>
          <label className="block text-sm font-semibold">
            À
            <input type="time" className={CHAMP + " mt-1 font-normal"} value={fin} onChange={(e) => setFin(e.target.value)} />
          </label>
        </div>


        <button type="submit" disabled={envoi} className="w-full rounded-full bg-[#007F77] px-4 py-3 text-base font-bold text-white disabled:opacity-60">
          {envoi ? "Enregistrement…" : "Enregistrer l'offre récurrente"}
        </button>


        {message && (
          <p className={"rounded-lg p-2 text-sm " + (message.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700")}>{message.texte}</p>
        )}
      </form>
    </section>
  );
}
