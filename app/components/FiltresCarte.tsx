"use client";

import { useState } from "react";

import { formatPrix } from "../lib/utils";

type Panneau = "boisson" | "prix" | "ambiance" | "rayon" | null;

type Props = {

  recherche: string;

  onRecherche: (valeur: string) => void;

  boissonsDispo: string[];

  boissons: string[];

  onToggleBoisson: (boisson: string) => void;

  ambiances: string[];

  ambiance: string;

  onAmbiance: (ambiance: string) => void;

  prixPlafond: number;

  prixMax: number | null;

  onPrixMax: (prix: number | null) => void;

  matchSoir: boolean;

  onMatchSoir: (valeur: boolean) => void;

  avecPosition: boolean;

  onLocaliser: () => void;

  messageGeo: string | null;

  rayon: number;

  onRayon: (rayon: number) => void;

  filtresActifs: boolean;

  onReinitialiser: () => void;

};

const RAYONS = [

  { valeur: 0, libelle: "Partout" },

  { valeur: 0.5, libelle: "500 m" },

  { valeur: 1, libelle: "1 km" },

  { valeur: 2, libelle: "2 km" },

  { valeur: 5, libelle: "5 km" },

  { valeur: 10, libelle: "10 km" },

];

function emojiBoisson(boisson: string): string {

  const emojis: Record<string, string> = {

    "bière": "🍺",

    vin: "🍷",

    cocktail: "🍹",

    "sans alcool": "🥤",

  };

  return emojis[boisson] ?? "🍴";

}

function majuscule(texte: string): string {

  return texte.charAt(0).toUpperCase() + texte.slice(1);

}

function Pastille({

  libelle,

  actif,

  onClick,

}: {

  libelle: string;

  actif: boolean;

  onClick: () => void;

}) {

  return (

    <button

      type="button"

      onClick={onClick}

      className="shrink-0 rounded-full border px-3 py-2 text-sm font-semibold shadow-sm"

      style={{

        background: actif ? "var(--hv-bouton-fond)" : "var(--hv-fond)",

        color: actif ? "var(--hv-bouton-texte)" : "var(--hv-texte)",

        borderColor: actif ? "var(--hv-bouton-fond)" : "var(--hv-bord)",

      }}

    >

      {libelle}

    </button>

  );

}

export default function FiltresCarte({

  recherche,

  onRecherche,

  boissonsDispo,

  boissons,

  onToggleBoisson,

  ambiances,

  ambiance,

  onAmbiance,

  prixPlafond,

  prixMax,

  onPrixMax,

  matchSoir,

  onMatchSoir,

  avecPosition,

  onLocaliser,

  messageGeo,

  rayon,

  onRayon,

  filtresActifs,

  onReinitialiser,

}: Props) {

  const [ouvert, setOuvert] = useState<Panneau>(null);

  function basculer(panneau: Exclude<Panneau, null>) {

    setOuvert(ouvert === panneau ? null : panneau);

  }

  const libelleRayon = RAYONS.find((r) => r.valeur === rayon)?.libelle ?? "";

  return (

    <div

      className="pointer-events-none absolute inset-x-0 top-0 z-[1350] px-3 pb-2"

      style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}

    >

      {/* LA BARRE DE RECHERCHE */}

      <div

        className="pointer-events-auto flex items-center gap-3 rounded-full border px-4 py-3 shadow-md"

        style={{

          background: "var(--hv-fond)",

          borderColor: "var(--hv-bord)",

          color: "var(--hv-texte)",

        }}

      >

        <span aria-hidden="true">🔍</span>

        <input

          type="text"

          value={recherche}

          onChange={(e) => onRecherche(e.target.value)}

          placeholder="Rechercher un bar ou une adresse"

          className="w-full bg-transparent text-base outline-none"

          style={{ color: "var(--hv-texte)" }}

        />

        {recherche !== "" && (

          <button

            type="button"

            onClick={() => onRecherche("")}

            aria-label="Effacer la recherche"

            className="shrink-0 text-sm"

            style={{ color: "var(--hv-texte-doux)" }}

          >

            ✕

          </button>

        )}

      </div>

      {/* LES PASTILLES DE FILTRES */}

      <div className="hv-defile pointer-events-auto mt-2 flex gap-2 overflow-x-auto pb-1">

        <Pastille

          libelle={boissons.length > 0 ? "🍹 Boisson · " + boissons.length : "🍹 Boisson"}

          actif={boissons.length > 0 || ouvert === "boisson"}

          onClick={() => basculer("boisson")}

        />

        <Pastille

          libelle={prixMax !== null ? "💶 Prix ≤ " + formatPrix(prixMax) : "💶 Prix"}

          actif={prixMax !== null || ouvert === "prix"}

          onClick={() => basculer("prix")}

        />

        <Pastille

          libelle={ambiance !== "toutes" ? "✨ " + majuscule(ambiance) : "✨ Ambiance"}

          actif={ambiance !== "toutes" || ouvert === "ambiance"}

          onClick={() => basculer("ambiance")}

        />

        <Pastille

          libelle="⚽ Match ce soir"

          actif={matchSoir}

          onClick={() => onMatchSoir(!matchSoir)}

        />

        <Pastille libelle="📍 Autour de moi" actif={avecPosition} onClick={onLocaliser} />

        {avecPosition && (

          <Pastille

            libelle={rayon > 0 ? "Rayon " + libelleRayon : "Rayon"}

            actif={rayon > 0 || ouvert === "rayon"}

            onClick={() => basculer("rayon")}

          />

        )}

        {filtresActifs && (

          <Pastille libelle="✕ Effacer" actif={false} onClick={onReinitialiser} />

        )}

      </div>

      {/* LE PETIT PANNEAU QUI S'OUVRE SOUS LES PASTILLES */}

      {ouvert !== null && (

        <div

          className="pointer-events-auto mt-2 rounded-2xl border p-4 shadow-lg"

          style={{

            background: "var(--hv-fond)",

            borderColor: "var(--hv-bord)",

            color: "var(--hv-texte)",

          }}

        >

          {ouvert === "boisson" && (

            <>

              <p className="mb-3 text-sm font-semibold">Quelle boisson ?</p>

              <div className="flex flex-wrap gap-2">

                {boissonsDispo.map((b) => (

                  <Pastille

                    key={b}

                    libelle={emojiBoisson(b) + " " + majuscule(b)}

                    actif={boissons.includes(b)}

                    onClick={() => onToggleBoisson(b)}

                  />

                ))}

              </div>

              <p className="mt-3 text-xs" style={{ color: "var(--hv-texte-doux)" }}>

                {"Tu peux en choisir plusieurs."}

              </p>

            </>

          )}

          {ouvert === "prix" && (

            <>

              <label className="block text-sm font-semibold">

                {"Prix max : " + formatPrix(prixMax ?? prixPlafond)}

                <input

                  type="range"

                  min={1}

                  max={prixPlafond}

                  step={0.5}

                  value={prixMax ?? prixPlafond}

                  onChange={(e) => onPrixMax(parseFloat(e.target.value))}

                  className="mt-3 w-full"

                  style={{ accentColor: "var(--hv-accent)" }}

                />

              </label>

              <button

                type="button"

                onClick={() => {

                  onPrixMax(null);

                  setOuvert(null);

                }}

                className="mt-3 text-sm underline"

                style={{ color: "var(--hv-texte-doux)" }}

              >

                Pas de limite

              </button>

            </>

          )}

          {ouvert === "ambiance" && (

            <>

              <p className="mb-3 text-sm font-semibold">Quelle ambiance ?</p>

              <div className="flex flex-wrap gap-2">

                <Pastille

                  libelle="Toutes"

                  actif={ambiance === "toutes"}

                  onClick={() => {

                    onAmbiance("toutes");

                    setOuvert(null);

                  }}

                />

                {ambiances.map((a) => (

                  <Pastille

                    key={a}

                    libelle={majuscule(a)}

                    actif={ambiance === a}

                    onClick={() => {

                      onAmbiance(a);

                      setOuvert(null);

                    }}

                  />

                ))}

              </div>

            </>

          )}

          {ouvert === "rayon" && (

            <>

              <p className="mb-3 text-sm font-semibold">Jusqu'où ?</p>

              <div className="flex flex-wrap gap-2">

                {RAYONS.map((r) => (

                  <Pastille

                    key={r.valeur}

                    libelle={r.libelle}

                    actif={rayon === r.valeur}

                    onClick={() => {

                      onRayon(r.valeur);

                      setOuvert(null);

                    }}

                  />

                ))}

              </div>

            </>

          )}

        </div>

      )}

      {messageGeo && (

        <p

          className="pointer-events-auto mt-2 rounded-xl px-3 py-2 text-sm shadow"

          style={{ background: "var(--hv-fond)", color: "var(--hv-texte)" }}

        >

          {messageGeo}

        </p>

      )}

    </div>

  );

}

