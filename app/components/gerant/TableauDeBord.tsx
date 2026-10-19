"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { supabase } from "../../lib/supabase";
import type { BarGerant } from "../../lib/types";
import { dateHeureParis, formatPrix } from "../../lib/utils";

const champ = "w-full rounded border border-gray-300 bg-white p-2 text-gray-900";

type OffreGerant = {
  id: string | number;
  produit: string;
  prix_normal: number;
  prix_reduit: number;
  fin: string;
  quantite: number | null;
};

type MatchGerant = { id: string | number; intitule: string; date_heure: string };

export default function TableauDeBord({ bar }: { bar: BarGerant }) {
  const [offres, setOffres] = useState<OffreGerant[]>([]);
  const [matchs, setMatchs] = useState<MatchGerant[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const [produit, setProduit] = useState("");
  const [typeBoisson, setTypeBoisson] = useState("bière");
  const [prixNormal, setPrixNormal] = useState("");
  const [prixReduit, setPrixReduit] = useState("");
  const [duree, setDuree] = useState("2");
  const [quantite, setQuantite] = useState("20");

  const [intitule, setIntitule] = useState("");
  const [dateHeure, setDateHeure] = useState("");

  const charger = useCallback(async () => {
    const maintenant = new Date().toISOString();
    const [o, m] = await Promise.all([
      supabase
        .from("offres")
        .select("id, produit, prix_normal, prix_reduit, fin, quantite")
        .eq("bar_id", bar.id)
        .gt("fin", maintenant)
        .order("fin"),
      supabase
        .from("matchs")
        .select("id, intitule, date_heure")
        .eq("bar_id", bar.id)
        .gt("date_heure", maintenant)
        .order("date_heure"),
    ]);
    if (o.error) setMessage("Erreur : " + o.error.message);
    setOffres((o.data as OffreGerant[]) ?? []);
    setMatchs((m.data as MatchGerant[]) ?? []);
  }, [bar.id]);

  useEffect(() => {
    if (bar.verifie) charger();
  }, [bar.verifie, charger]);

  if (!bar.verifie) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-900">
        <h2 className="font-semibold">⏳ Ton bar « {bar.nom} » est en cours de vérification</h2>
        <p className="mt-2 text-sm">
          On vérifie ton SIRET et ta licence. Dès que c'est validé, tu pourras publier tes offres ici.
          Reviens sur cette page un peu plus tard.
        </p>
      </div>
    );
  }

  async function publierOffre(e: FormEvent) {
    e.preventDefault();
    setMessage(null);

    const normal = parseFloat(prixNormal.replace(",", "."));
    const reduit = parseFloat(prixReduit.replace(",", "."));
    const qte = parseInt(quantite, 10);

    if (!produit.trim()) return setMessage("Indique le produit.");
    if (isNaN(normal) || isNaN(reduit)) return setMessage("Les prix doivent être des nombres.");
    if (reduit >= normal) return setMessage("Le prix réduit doit être inférieur au prix normal.");
    if (isNaN(qte) || qte < 1) return setMessage("La quantité doit être d'au moins 1.");

    // On recule le début d'une minute pour éviter les décalages d'horloge
    const debut = new Date(Date.now() - 60000);
    const fin = new Date(Date.now() + parseFloat(duree) * 3600 * 1000);

    const { error } = await supabase.from("offres").insert({
      bar_id: bar.id,
      produit: produit.trim(),
      type_boisson: typeBoisson,
      prix_normal: normal,
      prix_reduit: reduit,
      debut: debut.toISOString(),
      fin: fin.toISOString(),
      quantite: qte,
    });

    if (error) return setMessage(error.message);

    setProduit("");
    setPrixNormal("");
    setPrixReduit("");
    setMessage("✅ Offre publiée !");
    charger();
  }

  async function arreterOffre(id: string | number) {
    setMessage(null);
    const { data, error } = await supabase
      .from("offres")
      .update({ fin: new Date().toISOString() })
      .eq("id", id)
      .select();
    if (error) return setMessage(error.message);
    if (!data || data.length === 0) return setMessage("Action refusée par les règles de sécurité.");
    charger();
  }

  async function publierMatch(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!intitule.trim() || !dateHeure) return setMessage("Indique le match et l'heure.");

    const { error } = await supabase.from("matchs").insert({
      bar_id: bar.id,
      intitule: intitule.trim(),
      date_heure: new Date(dateHeure).toISOString(),
    });

    if (error) return setMessage(error.message);

    setIntitule("");
    setDateHeure("");
    setMessage("✅ Match ajouté !");
    charger();
  }

  async function supprimerMatch(id: string | number) {
    setMessage(null);
    const { data, error } = await supabase.from("matchs").delete().eq("id", id).select();
    if (error) return setMessage(error.message);
    if (!data || data.length === 0) return setMessage("Action refusée par les règles de sécurité.");
    charger();
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-gray-600">
        Bar : <strong>{bar.nom}</strong> · {bar.adresse}
      </p>

      {message && <p className="rounded bg-amber-50 p-3 text-sm text-amber-900">{message}</p>}

      {/* ---------- OFFRES EN COURS ---------- */}
      <section>
        <h2 className="mb-2 text-lg font-semibold">Mes offres en cours ({offres.length}/3)</h2>
        {offres.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune offre en cours.</p>
        ) : (
          <ul className="space-y-2">
            {offres.map((o) => (
              <li
                key={o.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white p-3 text-sm"
              >
                <span>
                  {o.produit} · <strong>{formatPrix(o.prix_reduit)}</strong>{" "}
                  <span className="text-gray-400 line-through">{formatPrix(o.prix_normal)}</span>
                  <span className="block text-xs text-gray-500">
                    jusqu'au {dateHeureParis(o.fin)} · {o.quantite ?? "?"} dispo
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => arreterOffre(o.id)}
                  className="shrink-0 rounded-full border border-red-300 px-3 py-1 text-xs text-red-600"
                >
                  Arrêter
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---------- NOUVELLE OFFRE ---------- */}
      <section>
        <h2 className="mb-2 text-lg font-semibold">Publier une offre</h2>
        <form onSubmit={publierOffre} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Produit</span>
            <input
              className={champ}
              placeholder="Pinte blonde"
              value={produit}
              onChange={(e) => setProduit(e.target.value)}
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Type de boisson</span>
            <select className={champ} value={typeBoisson} onChange={(e) => setTypeBoisson(e.target.value)}>
              <option>bière</option>
              <option>cocktail</option>
              <option>vin</option>
              <option>sans alcool</option>
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Prix normal (€)</span>
              <input
                className={champ}
                inputMode="decimal"
                value={prixNormal}
                onChange={(e) => setPrixNormal(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Prix réduit (€)</span>
              <input
                className={champ}
                inputMode="decimal"
                value={prixReduit}
                onChange={(e) => setPrixReduit(e.target.value)}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Durée</span>
              <select className={champ} value={duree} onChange={(e) => setDuree(e.target.value)}>
                <option value="1">1 heure</option>
                <option value="2">2 heures</option>
                <option value="3">3 heures</option>
                <option value="4">4 heures</option>
                <option value="6">6 heures</option>
                <option value="12">12 heures</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Quantité</span>
              <input
                className={champ}
                inputMode="numeric"
                value={quantite}
                onChange={(e) => setQuantite(e.target.value)}
              />
            </label>
          </div>

          <button type="submit" className="w-full rounded-full bg-rose-600 px-4 py-2 font-medium text-white">
            Publier l'offre
          </button>
        </form>
      </section>

      {/* ---------- MATCHS ---------- */}
      <section>
        <h2 className="mb-2 text-lg font-semibold">Mes matchs diffusés</h2>
        {matchs.length > 0 && (
          <ul className="mb-3 space-y-2">
            {matchs.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white p-3 text-sm"
              >
                <span>
                  ⚽ {m.intitule} · {dateHeureParis(m.date_heure)}
                </span>
                <button
                  type="button"
                  onClick={() => supprimerMatch(m.id)}
                  className="shrink-0 rounded-full border border-red-300 px-3 py-1 text-xs text-red-600"
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={publierMatch} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Match</span>
            <input
              className={champ}
              placeholder="PSG – OM"
              value={intitule}
              onChange={(e) => setIntitule(e.target.value)}
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Date et heure du coup d'envoi</span>
            <input
              type="datetime-local"
              className={champ}
              value={dateHeure}
              onChange={(e) => setDateHeure(e.target.value)}
            />
          </label>

          <button type="submit" className="w-full rounded-full bg-green-600 px-4 py-2 font-medium text-white">
            Ajouter le match
          </button>
        </form>
      </section>
    </div>
  );
}
