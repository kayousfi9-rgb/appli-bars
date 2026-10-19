"use client";

import { useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import type { BarGerant } from "../../lib/types";

const champ = "w-full rounded border border-gray-300 bg-white p-2 text-gray-900";

type Props = { utilisateur: User; onCree: (bar: BarGerant) => void };

export default function CreerBar({ utilisateur, onCree }: Props) {
  const [nom, setNom] = useState("");
  const [adresse, setAdresse] = useState("");
  const [siret, setSiret] = useState("");
  const [licence, setLicence] = useState("Licence IV");
  const [typeBar, setTypeBar] = useState("pub");
  const [ambiance, setAmbiance] = useState("conviviale");
  const [terrasse, setTerrasse] = useState(false);
  const [horaires, setHoraires] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function envoyer(e: FormEvent) {
    e.preventDefault();
    setMessage(null);

    const siretPropre = siret.replace(/\s/g, "");
    if (!/^\d{14}$/.test(siretPropre)) {
      setMessage("Le SIRET doit contenir exactement 14 chiffres.");
      return;
    }
    if (!nom.trim() || !adresse.trim()) {
      setMessage("Le nom et l'adresse sont obligatoires.");
      return;
    }

    setChargement(true);
    try {
      // 1) On transforme l'adresse en coordonnées GPS (service public gratuit, sans clé)
      const reponse = await fetch(
        `https://data.geopf.fr/geocodage/search?q=${encodeURIComponent(adresse)}&limit=1`
      );
      const json = await reponse.json();
      const resultat = json.features?.[0];
      if (!resultat) {
        setMessage("Adresse introuvable. Essaie avec le numéro, la rue, le code postal et la ville.");
        return;
      }
      const [lng, lat] = resultat.geometry.coordinates as [number, number];

      // 2) On enregistre le bar (non vérifié par défaut)
      const { data, error } = await supabase
        .from("bars")
        .insert({
          owner_id: utilisateur.id,
          nom: nom.trim(),
          adresse: resultat.properties?.label ?? adresse,
          latitude: lat,
          longitude: lng,
          siret: siretPropre,
          licence,
          verifie: false,
          type_bar: typeBar,
          terrasse,
          ambiance,
          horaires: horaires.trim() || null,
        })
        .select("id, nom, adresse, verifie")
        .single();

      if (error) {
        setMessage("Enregistrement impossible : " + error.message);
        return;
      }

      onCree(data as BarGerant);
    } catch {
      setMessage("Problème de connexion. Réessaie dans un instant.");
    } finally {
      setChargement(false);
    }
  }

  return (
    <form onSubmit={envoyer} className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="text-lg font-semibold">Ma fiche de bar</h2>
      <p className="text-sm text-gray-600">
        Ces informations sont vérifiées avant ta mise en ligne (SIRET et licence de débit de boissons).
      </p>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Nom du bar</span>
        <input className={champ} value={nom} onChange={(e) => setNom(e.target.value)} required />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Adresse complète</span>
        <input
          className={champ}
          placeholder="12 rue du Commerce, 75015 Paris"
          value={adresse}
          onChange={(e) => setAdresse(e.target.value)}
          required
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">SIRET (14 chiffres)</span>
        <input
          className={champ}
          inputMode="numeric"
          value={siret}
          onChange={(e) => setSiret(e.target.value)}
          required
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Licence</span>
        <select className={champ} value={licence} onChange={(e) => setLicence(e.target.value)}>
          <option>Licence IV</option>
          <option>Licence III</option>
          <option>Licence II</option>
          <option>Licence restaurant</option>
          <option>Petite licence restaurant</option>
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Type de bar</span>
          <select className={champ} value={typeBar} onChange={(e) => setTypeBar(e.target.value)}>
            <option>pub</option>
            <option>brasserie</option>
            <option>bar à cocktails</option>
            <option>sport bar</option>
            <option>bar à vins</option>
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">Ambiance</span>
          <select className={champ} value={ambiance} onChange={(e) => setAmbiance(e.target.value)}>
            <option>conviviale</option>
            <option>animée</option>
            <option>chic</option>
            <option>sportive</option>
            <option>calme</option>
          </select>
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Horaires</span>
        <input
          className={champ}
          placeholder="17h – 2h"
          value={horaires}
          onChange={(e) => setHoraires(e.target.value)}
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={terrasse} onChange={(e) => setTerrasse(e.target.checked)} />
        J'ai une terrasse
      </label>

      {message && <p className="rounded bg-amber-50 p-2 text-sm text-amber-800">{message}</p>}

      <button
        type="submit"
        disabled={chargement}
        className="w-full rounded-full bg-rose-600 px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {chargement ? "Enregistrement…" : "Enregistrer mon bar"}
      </button>
    </form>
  );
}
