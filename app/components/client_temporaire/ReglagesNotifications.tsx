"use client";

import { useEffect, useState } from "react";

import { supabase } from "../../lib/supabase";

import type { PreferencesNotifications } from "../../lib/types";

const RAYONS = [

  { valeur: 0.5, libelle: "500 m" },

  { valeur: 1, libelle: "1 km" },

  { valeur: 2, libelle: "2 km" },

  { valeur: 5, libelle: "5 km" },

];

// On arrondit la position à environ 100 mètres : assez précis pour trouver

// les bars du quartier, sans enregistrer l'adresse exacte du client.

function arrondir(x: number): number {

  return Math.round(x * 1000) / 1000;

}

export default function ReglagesNotifications() {

  const [prefs, setPrefs] = useState<PreferencesNotifications | null>(null);

  const [connecte, setConnecte] = useState<boolean | null>(null);

  const [message, setMessage] = useState<string | null>(null);

  const [localisation, setLocalisation] = useState(false);

  // 1) Lire les préférences (ou partir des valeurs par défaut).

  useEffect(() => {

    let annule = false;

    (async () => {

      const { data: session } = await supabase.auth.getSession();

      const id = session.session?.user.id;

      if (annule) return;

      if (!id) {

        setConnecte(false);

        return;

      }

      setConnecte(true);

      const { data } = await supabase

        .from("preferences_notifications")

        .select("client_id, favoris, proximite, latitude, longitude, rayon_km")

        .eq("client_id", id)

        .maybeSingle();

      if (annule) return;

      setPrefs(

        (data as PreferencesNotifications | null) ?? {

          client_id: id,

          favoris: true,

          proximite: false,

          latitude: null,

          longitude: null,

          rayon_km: 1,

        }

      );

    })();

    return () => {

      annule = true;

    };

  }, []);

  // 2) Enregistrer dans la base (création la première fois, mise à jour ensuite).

  async function enregistrer(nouvelles: PreferencesNotifications) {

    setPrefs(nouvelles);

    setMessage(null);

    const { error } = await supabase.from("preferences_notifications").upsert(

      {

        client_id: nouvelles.client_id,

        favoris: nouvelles.favoris,

        proximite: nouvelles.proximite,

        latitude: nouvelles.latitude,

        longitude: nouvelles.longitude,

        rayon_km: nouvelles.rayon_km,

        modifie_le: new Date().toISOString(),

      },

      { onConflict: "client_id" }

    );

    if (error) {

      setMessage(

        "Enregistrement impossible. Si tu viens de créer ton compte, ouvre « Mon compte » pour terminer ton inscription. (" +

          error.message +

          ")"

      );

    } else {

      setMessage("Préférences enregistrées.");

    }

  }

  // 3) Demander la position au téléphone, puis activer « près de chez moi ».

  function utiliserMaPosition() {

    if (!prefs) return;

    if (!("geolocation" in navigator)) {

      setMessage("Ton appareil ne permet pas de partager ta position.");

      return;

    }

    setLocalisation(true);

    navigator.geolocation.getCurrentPosition(

      (position) => {

        setLocalisation(false);

        enregistrer({

          ...prefs,

          proximite: true,

          latitude: arrondir(position.coords.latitude),

          longitude: arrondir(position.coords.longitude),

        });

      },

      () => {

        setLocalisation(false);

        setMessage(

          "Position refusée ou indisponible. Autorise la localisation pour ce site dans les réglages de ton navigateur, puis réessaie."

        );

      },

      { enableHighAccuracy: false, timeout: 10000 }

    );

  }

  if (connecte === null || (connecte && !prefs)) {

    return <p className="text-gray-500">Chargement…</p>;

  }

  if (!connecte || !prefs) {

    return (

      <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-900">

        <p className="font-semibold">{"Connecte-toi pour régler tes notifications."}</p>

        <p className="mt-2 text-sm">

          <a href="/compte" className="underline">

            Aller sur Mon compte

          </a>

        </p>

      </div>

    );

  }

  const zoneEnregistree = prefs.latitude !== null && prefs.longitude !== null;

  return (

    <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">

      <h2 className="text-lg font-semibold">{"Quand me prévenir ?"}</h2>

      {/* FAVORIS */}

      <label className="flex items-start gap-3 text-sm">

        <input

          type="checkbox"

          className="mt-1"

          checked={prefs.favoris}

          onChange={(e) => enregistrer({ ...prefs, favoris: e.target.checked })}

        />

        <span>

          <span className="block font-medium">Mes bars favoris</span>

          <span className="block text-xs text-gray-500">

            {"Quand un bar que tu as mis en favori publie une nouvelle offre."}

          </span>

        </span>

      </label>

      {/* PROXIMITÉ */}

      <label className="flex items-start gap-3 text-sm">

        <input

          type="checkbox"

          className="mt-1"

          checked={prefs.proximite}

          onChange={(e) => {

            if (e.target.checked && !zoneEnregistree) {

              utiliserMaPosition();

            } else {

              enregistrer({ ...prefs, proximite: e.target.checked });

            }

          }}

        />

        <span>

          <span className="block font-medium">Les bars près de chez moi</span>

          <span className="block text-xs text-gray-500">

            {"Quand n'importe quel bar de ta zone publie une nouvelle offre."}

          </span>

        </span>

      </label>

      {prefs.proximite && (

        <div className="space-y-3 rounded-lg bg-gray-50 p-3 text-sm">

          <label className="block">

            <span className="mb-1 block font-medium">Rayon</span>

            <select

              className="w-full rounded border border-gray-300 bg-white p-2"

              value={String(prefs.rayon_km)}

              onChange={(e) => enregistrer({ ...prefs, rayon_km: Number(e.target.value) })}

            >

              {RAYONS.map((r) => (

                <option key={r.valeur} value={String(r.valeur)}>

                  {r.libelle}

                </option>

              ))}

            </select>

          </label>

          <p className="text-xs text-gray-600">

            {zoneEnregistree

              ? "Ta zone est enregistrée (à environ 100 m près)."

              : "Ta zone n'est pas encore enregistrée."}

          </p>

          <button

            type="button"

            onClick={utiliserMaPosition}

            disabled={localisation}

            className="w-full rounded-full border border-gray-300 bg-white px-4 py-2 text-sm disabled:opacity-50"

          >

            {localisation ? "Localisation…" : "Utiliser ma position actuelle comme zone"}

          </button>

          <p className="text-xs text-gray-500">

            {"Astuce : fais-le depuis chez toi ou depuis ton quartier préféré. Ta position n'est jamais suivie en continu."}

          </p>

        </div>

      )}

      {message && <p className="rounded bg-amber-50 p-2 text-sm text-amber-900">{message}</p>}

    </section>

  );

}
