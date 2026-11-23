"use client";


import { useState } from "react";
import type { ItemCeSoir } from "../lib/cesoir";
import { formatPrix } from "../lib/utils";


type Props = {
  items: ItemCeSoir[];
  erreur: string | null;
  maintenant: number | null;
};


type Filtre = "tout" | "bars" | "loisirs";


// « dans 45 min », « dans 2 h 10 »
function dans(debutMs: number, maintenant: number | null): string | null {
  if (maintenant === null) return null;
  const min = Math.max(1, Math.round((debutMs - maintenant) / 60000));
  if (min < 60) return "dans " + min + " min";
  const h = Math.floor(min / 60);
  const reste = min % 60;
  return "dans " + h + " h" + (reste > 0 ? " " + String(reste).padStart(2, "0") : "");
}


function lienItineraire(item: ItemCeSoir): string {
  return "https://www.google.com/maps/dir/?api=1&destination=" + item.latitude + "," + item.longitude;
}


export default function CeSoir({ items, erreur, maintenant }: Props) {
  const [filtre, setFiltre] = useState<Filtre>("tout");


  const affiches = items.filter((i) => {
    if (filtre === "bars") return i.categorieEtab !== "loisir";
    if (filtre === "loisirs") return i.categorieEtab === "loisir";
    return true;
  });


  const pastilles: { id: Filtre; texte: string }[] = [
    { id: "tout", texte: "Tout" },
    { id: "bars", texte: "Bars" },
    { id: "loisirs", texte: "Loisirs" },
  ];


  return (
    <div
      className="absolute inset-0 z-[1300] overflow-y-auto px-4 pt-5"
      style={{
        background: "var(--hv-fond)",
        color: "var(--hv-texte)",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 96px)",
      }}
    >
      <h1 className="text-2xl font-extrabold">Ce soir</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--hv-texte-doux)" }}>
        Les offres qui arrivent dans les prochaines heures. Reviens quand elles démarrent pour en profiter.
      </p>


      <div className="mt-4 flex gap-2">
        {pastilles.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setFiltre(p.id)}
            className="rounded-full border px-4 py-1.5 text-sm font-semibold"
            style={{
              borderColor: filtre === p.id ? "var(--hv-bouton-fond)" : "var(--hv-bord)",
              background: filtre === p.id ? "var(--hv-bouton-fond)" : "var(--hv-fond)",
              color: filtre === p.id ? "var(--hv-bouton-texte)" : "var(--hv-texte)",
            }}
          >
            {p.texte}
          </button>
        ))}
      </div>


      {erreur && (
        <p className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {"Impossible de charger les offres à venir : " + erreur}
        </p>
      )}


      {!erreur && affiches.length === 0 && (
        <p
          className="mt-6 rounded-2xl border p-4 text-center text-sm"
          style={{ borderColor: "var(--hv-bord)", background: "var(--hv-carte)" }}
        >
          Aucune offre programmée pour les prochaines heures. Regarde l'onglet Carte pour les offres en cours.
        </p>
      )}


      <ul className="mt-4 space-y-3">
        {affiches.map((item) => {
          const compte = dans(item.debutMs, maintenant);
          const loisir = item.categorieEtab === "loisir";
          return (
            <li
              key={item.cle}
              className="rounded-2xl border p-4"
              style={{ borderColor: "var(--hv-bord)", background: "var(--hv-carte)" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-bold">{item.titre}</p>
                  <p className="truncate text-sm" style={{ color: "var(--hv-texte-doux)" }}>
                    {(loisir ? "🎯 " : "🍻 ") + item.barNom}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-extrabold" style={{ color: "var(--hv-accent)" }}>
                    {formatPrix(item.prixReduit)}
                  </p>
                  <p className="text-xs line-through" style={{ color: "var(--hv-texte-doux)" }}>
                    {formatPrix(item.prixNormal)}
                  </p>
                </div>
              </div>


              <p className="mt-2 text-sm font-semibold">
                {"🕒 De " + item.debutTexte + " à " + item.finTexte}
                {compte ? " · " + compte : ""}
              </p>


              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                {item.recurrence && (
                  <span
                    className="rounded-full border px-2 py-0.5"
                    style={{ borderColor: "var(--hv-bord)", color: "var(--hv-texte-doux)" }}
                  >
                    {"🔁 " + item.recurrence}
                  </span>
                )}
                {item.quantite !== null && (
                  <span
                    className="rounded-full border px-2 py-0.5"
                    style={{ borderColor: "var(--hv-bord)", color: "var(--hv-texte-doux)" }}
                  >
                    {item.quantite + " disponible" + (item.quantite > 1 ? "s" : "")}
                  </span>
                )}
                <a
                  href={lienItineraire(item)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto font-semibold underline"
                  style={{ color: "var(--hv-accent)" }}
                >
                  Y aller
                </a>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
