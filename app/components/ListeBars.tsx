"use client";

import BoutonFavori from "./client_temporaire/BoutonFavori";

import type { BarAffiche } from "../lib/types";

import { dateCourteParis, dateParis, formatPrix, heureParis } from "../lib/utils";

type Props = {

  bars: BarAffiche[];

  aucuneOffre: boolean;

  aujourdhui: string;

  onVoirSurCarte: (id: string | number) => void;

};

function libelleFin(iso: string, aujourdhui: string): string {

  return dateParis(iso) === aujourdhui

    ? "jusqu'à " + heureParis(iso)

    : "jusqu'au " + dateCourteParis(iso);

}

export default function ListeBars({ bars, aucuneOffre, aujourdhui, onVoirSurCarte }: Props) {

  return (

    <div

      className="absolute inset-0 z-[1300] overflow-y-auto"

      style={{

        background: "var(--hv-fond)",

        color: "var(--hv-texte)",

        paddingTop: "calc(env(safe-area-inset-top) + 150px)",

        paddingBottom: "calc(env(safe-area-inset-bottom) + 96px)",

      }}

    >

      <div className="mx-auto max-w-md px-4">

        <p className="mb-3 text-sm font-semibold" style={{ color: "var(--hv-texte-doux)" }}>

          {bars.length + (bars.length > 1 ? " bars" : " bar") + " avec une offre en cours"}

        </p>

        {bars.length === 0 ? (

          <p className="mt-8 text-center" style={{ color: "var(--hv-texte-doux)" }}>

            {aucuneOffre

              ? "Aucune offre en cours pour le moment. Reviens vite !"

              : "Aucun bar ne correspond à ces filtres. Essaie d'en enlever un."}

          </p>

        ) : (

          <ul className="space-y-3">

            {bars.map((bar) => {

              const matchCeSoir = bar.matchs.find((m) => dateParis(m.date_heure) === aujourdhui);

              return (

                <li

                  key={bar.id}

                  className="rounded-2xl border p-4"

                  style={{ background: "var(--hv-carte)", borderColor: "var(--hv-bord)" }}

                >

                  <div className="flex items-start justify-between gap-2">

                    <div>

                      <h3 className="text-lg font-bold">{bar.nom}</h3>

                      <p className="text-xs" style={{ color: "var(--hv-texte-doux)" }}>

                        {bar.adresse}

                      </p>

                    </div>

                    {bar.distanceKm !== null && (

                      <span

                        className="shrink-0 rounded-full px-2 py-1 text-xs font-semibold"

                        style={{ background: "var(--hv-fond)" }}

                      >

                        {bar.distanceKm.toFixed(1).replace(".", ",") + " km"}

                      </span>

                    )}

                  </div>

                  <ul className="mt-3 space-y-1 text-sm">

                    {bar.offres.map((o) => (

                      <li key={o.id}>

                        {o.produit + " · "}

                        <strong>{formatPrix(o.prix_reduit)}</strong>{" "}

                        <span className="line-through" style={{ color: "var(--hv-texte-doux)" }}>

                          {formatPrix(o.prix_normal)}

                        </span>

                        <span className="ml-1 text-xs" style={{ color: "var(--hv-texte-doux)" }}>

                          {"(" + libelleFin(o.fin, aujourdhui) + ")"}

                        </span>

                      </li>

                    ))}

                  </ul>

                  {matchCeSoir && (

                    <p className="mt-2 text-sm font-semibold" style={{ color: "var(--hv-accent)" }}>

                      {"⚽ Match ce soir : " +

                        matchCeSoir.intitule +

                        " à " +

                        heureParis(matchCeSoir.date_heure)}

                    </p>

                  )}

                  <div className="mt-3 flex items-center justify-between gap-2">

                    <button

                      type="button"

                      onClick={() => onVoirSurCarte(bar.id)}

                      className="text-sm font-semibold"

                      style={{ color: "var(--hv-accent)" }}

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

        <p className="mt-8 text-center text-xs" style={{ color: "var(--hv-texte-doux)" }}>

          {"L'abus d'alcool est dangereux pour la santé, à consommer avec modération. Vente d'alcool interdite aux mineurs."}

        </p>

      </div>

    </div>

  );

}

