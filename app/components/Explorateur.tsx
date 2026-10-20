"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CarteDynamique from "./CarteDynamique";
import BoutonFavori from "./client_temporaire/BoutonFavori";

import type { Bar, BarAffiche, Position } from "../lib/types";
import { dateCourteParis, dateParis, distanceKm, formatPrix, heureParis } from "../lib/utils";

type Props = {
  bars: Bar[];
  aujourdhui: string; // ex : 2026-10-19 (date du jour à Paris)
  erreur: string | null;
};

const champ = "w-full rounded border border-gray-300 bg-white p-2 text-gray-900";

function libelleFin(iso: string, aujourdhui: string): string {
  return dateParis(iso) === aujourdhui
    ? `jusqu'à ${heureParis(iso)}`
    : `jusqu'au ${dateCourteParis(iso)}`;
}

export default function Explorateur({ bars, aujourdhui, erreur }: Props) {
  const router = useRouter();

  const [boisson, setBoisson] = useState("toutes");
  const [ambiance, setAmbiance] = useState("toutes");
  const [prixMax, setPrixMax] = useState<number | null>(null);
  const [matchSoir, setMatchSoir] = useState(false);
  const [rayon, setRayon] = useState(0); // 0 = partout
  const [position, setPosition] = useState<Position | null>(null);
  const [messageGeo, setMessageGeo] = useState<string | null>(null);
  const [selectionId, setSelectionId] = useState<string | number | null>(null);

  // Actualisation automatique toutes les 60 secondes (offres « en direct »)
  useEffect(() => {
    const minuteur = setInterval(() => router.refresh(), 60000);
    return () => clearInterval(minuteur);
  }, [router]);

  const boissons = useMemo(() => {
    const toutes = bars.flatMap((b) => b.offres.map((o) => o.type_boisson));
    return Array.from(new Set(toutes.filter((t): t is string => Boolean(t)))).sort();
  }, [bars]);

  const ambiances = useMemo(() => {
    const toutes = bars.map((b) => b.ambiance);
    return Array.from(new Set(toutes.filter((a): a is string => Boolean(a)))).sort();
  }, [bars]);

  const prixPlafond = useMemo(() => {
    const prix = bars.flatMap((b) => b.offres.map((o) => o.prix_reduit));
    return Math.max(5, Math.ceil(Math.max(0, ...prix)));
  }, [bars]);

  const barsAffiches: BarAffiche[] = useMemo(() => {
    const resultat: BarAffiche[] = [];

    for (const bar of bars) {
      if (ambiance !== "toutes" && bar.ambiance !== ambiance) continue;

      const matchCeSoir = bar.matchs.some((m) => dateParis(m.date_heure) === aujourdhui);
      if (matchSoir && !matchCeSoir) continue;

      const distance = position
        ? distanceKm(position, { lat: bar.latitude, lng: bar.longitude })
        : null;
      if (rayon > 0 && distance !== null && distance > rayon) continue;

      const offres = bar.offres
        .filter(
          (o) =>
            (boisson === "toutes" || o.type_boisson === boisson) &&
            o.prix_reduit <= (prixMax ?? Infinity)
        )
        .sort((a, b) => a.prix_reduit - b.prix_reduit);
      if (offres.length === 0) continue;

      resultat.push({ ...bar, offres, distanceKm: distance, matchSoir: matchCeSoir });
    }

    return resultat.sort((a, b) =>
      a.distanceKm !== null && b.distanceKm !== null
        ? a.distanceKm - b.distanceKm
        : a.offres[0].prix_reduit - b.offres[0].prix_reduit
    );
  }, [bars, boisson, ambiance, prixMax, matchSoir, rayon, position, aujourdhui]);

  function localiser() {
    if (!("geolocation" in navigator)) {
      setMessageGeo("Ton navigateur ne gère pas la localisation.");
      return;
    }
    setMessageGeo("Localisation en cours…");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPosition({ lat: p.coords.latitude, lng: p.coords.longitude });
        setMessageGeo(null);
      },
      () =>
        setMessageGeo(
          "Impossible de te localiser. Vérifie que tu as autorisé la localisation pour ce site."
        ),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function reinitialiser() {
    setBoisson("toutes");
    setAmbiance("toutes");
    setPrixMax(null);
    setMatchSoir(false);
    setRayon(0);
    setSelectionId(null);
  }

  function voirSurLaCarte(id: string | number) {
    setSelectionId(id);
    document.getElementById("carte")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div>
      {erreur && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          Impossible de charger les offres : {erreur}
        </div>
      )}

      {/* ---------- FILTRES ---------- */}
      <section className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-4">
        <label className="text-sm">
          <span className="mb-1 block font-medium">Boisson</span>
          <select className={champ} value={boisson} onChange={(e) => setBoisson(e.target.value)}>
            <option value="toutes">Toutes</option>
            {boissons.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium">Ambiance</span>
          <select className={champ} value={ambiance} onChange={(e) => setAmbiance(e.target.value)}>
            <option value="toutes">Toutes</option>
            {ambiances.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium">
            Prix max : {formatPrix(prixMax ?? prixPlafond)}
          </span>
          <input
            type="range"
            min={1}
            max={prixPlafond}
            step={0.5}
            value={prixMax ?? prixPlafond}
            onChange={(e) => setPrixMax(parseFloat(e.target.value))}
            className="w-full"
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium">Distance</span>
          <select
            className={champ}
            value={rayon}
            disabled={!position}
            onChange={(e) => setRayon(parseFloat(e.target.value))}
          >
            <option value={0}>{position ? "Partout" : "Active « Autour de moi »"}</option>
            <option value={0.5}>500 m</option>
            <option value={1}>1 km</option>
            <option value={2}>2 km</option>
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
          </select>
        </label>

        <div className="col-span-2 flex flex-wrap items-center gap-3 md:col-span-4">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={matchSoir}
              onChange={(e) => setMatchSoir(e.target.checked)}
            />
            ⚽ Match ce soir
          </label>

          <button
            type="button"
            onClick={localiser}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white"
          >
            📍 Autour de moi
          </button>

          <button
            type="button"
            onClick={reinitialiser}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm"
          >
            Réinitialiser
          </button>

          <button
            type="button"
            onClick={() => router.refresh()}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm"
          >
            🔄 Actualiser
          </button>

          {messageGeo && <span className="text-sm text-gray-600">{messageGeo}</span>}
        </div>
      </section>

      {/* ---------- CARTE ---------- */}
      <p className="mb-2 text-sm text-gray-600">
        {barsAffiches.length} bar{barsAffiches.length > 1 ? "s" : ""} avec une offre en cours
      </p>

      <div
        id="carte"
        className="h-[55vh] min-h-[320px] w-full overflow-hidden rounded-xl border border-gray-200"
      >
        <CarteDynamique
          bars={barsAffiches}
          position={position}
          selectionId={selectionId}
          onSelect={setSelectionId}
        />
      </div>

      {/* ---------- LISTE ---------- */}
      {barsAffiches.length === 0 ? (
        <p className="mt-6 text-center text-gray-500">
          {bars.length === 0
            ? "Aucune offre en cours pour le moment."
            : "Aucun bar ne correspond à ces filtres. Essaie d'en enlever un."}
        </p>
      ) : (
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {barsAffiches.map((bar) => {
            const matchCeSoir = bar.matchs.find((m) => dateParis(m.date_heure) === aujourdhui);
            return (
              <li
                key={bar.id}
                className={`rounded-xl border bg-white p-4 ${
                  bar.id === selectionId
                    ? "border-rose-500 ring-2 ring-rose-200"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{bar.nom}</h3>
                    <p className="text-xs text-gray-500">{bar.adresse}</p>
                  </div>
                  {bar.distanceKm !== null && (
                    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-xs">
                      {bar.distanceKm.toFixed(1).replace(".", ",")} km
                    </span>
                  )}
                </div>

                <ul className="mt-3 space-y-1 text-sm">
                  {bar.offres.map((o) => (
                    <li key={o.id}>
                      {o.produit} · <strong>{formatPrix(o.prix_reduit)}</strong>{" "}
                      <span className="text-gray-400 line-through">{formatPrix(o.prix_normal)}</span>
                      <span className="ml-1 text-xs text-gray-500">
                        ({libelleFin(o.fin, aujourdhui)})
                      </span>
                    </li>
                  ))}
                </ul>

                {matchCeSoir && (
                  <p className="mt-2 text-sm font-medium text-green-700">
                    ⚽ Match ce soir : {matchCeSoir.intitule} à {heureParis(matchCeSoir.date_heure)}
                  </p>
                )}

                <div className="mt-3 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => voirSurLaCarte(bar.id)}
                    className="text-sm font-medium text-rose-600"
                  >
                    Voir sur la carte
                  </button>
                  <BoutonFavori barId={bar.id} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}