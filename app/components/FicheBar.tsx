"use client";


import { useState, type ReactNode } from "react";
import AcheterAvecAge from "./client_temporaire/AcheterAvecAge";
import BoutonFavori from "./client_temporaire/BoutonFavori";
import { nomOffre, type EtablissementAffiche } from "../lib/etablissements";
import { libelleCategorie, statutHoraires, stockLibelle, tempsRestant } from "../lib/horaires";
import { boissonAvecAlcool, infosFamille } from "../lib/familles";
import { dateParis, formatPrix, heureParis } from "../lib/utils";


type Props = {
  bar: EtablissementAffiche;
  maintenant: number | null;
  aujourdhui: string;
  onFermer: () => void;
};


function majuscule(texte: string): string {
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}


// Une petite étiquette (rouge si c'est urgent)
function Etiquette({ urgent, children }: { urgent: boolean; children: ReactNode }) {
  return (
    <span
      className="rounded-full border px-2 py-1 text-xs font-bold"
      style={{
        background: urgent ? "var(--hv-tomate)" : "var(--hv-fond)",
        color: urgent ? "#FFFFFF" : "var(--hv-texte)",
        borderColor: urgent ? "var(--hv-tomate)" : "var(--hv-bord)",
      }}
    >
      {children}
    </span>
  );
}


export default function FicheBar({ bar, maintenant, aujourdhui, onFermer }: Props) {
  const [photoCassee, setPhotoCassee] = useState(false);
  const [menuYAller, setMenuYAller] = useState(false);


  const statut = statutHoraires(bar.horaires_semaine, maintenant);
  const matchCeSoir = bar.matchs.find((m) => dateParis(m.date_heure) === aujourdhui);
  const famille = infosFamille(bar.categorie_etab);
  const alcool = bar.offres.some((o) => boissonAvecAlcool(o));
  const destination = bar.latitude + "," + bar.longitude;


  const liensItineraire = [
    { nom: "Google Maps", url: "https://www.google.com/maps/dir/?api=1&destination=" + destination },
    { nom: "Waze", url: "https://waze.com/ul?ll=" + destination + "&navigate=yes" },
    { nom: "Plans (Apple)", url: "https://maps.apple.com/?daddr=" + destination },
  ];


  const tags: string[] = [libelleCategorie(bar.categorie_etab)];
  if (bar.etiquette) tags.push(majuscule(bar.etiquette));
  if (bar.type_bar) tags.push(majuscule(bar.type_bar));
  if (bar.ambiance) tags.push(majuscule(bar.ambiance));
  if (bar.terrasse) tags.push("Terrasse");


  return (
    <div
      className="hv-fiche absolute inset-x-0 z-[1380] flex max-h-[62vh] flex-col overflow-hidden rounded-t-3xl border-t shadow-2xl"
      style={{
        bottom: "calc(env(safe-area-inset-bottom) + 64px)",
        background: "var(--hv-fond)",
        color: "var(--hv-texte)",
        borderColor: "var(--hv-bord)",
      }}
    >
      <button
        type="button"
        onClick={onFermer}
        aria-label="Fermer la fiche"
        className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold shadow-md"
        style={{ background: "var(--hv-fond)", color: "var(--hv-texte)" }}
      >
        ✕
      </button>


      <div className="overflow-y-auto">
        {/* LA PHOTO */}
        {bar.photo_url && !photoCassee ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bar.photo_url}
            alt={"Photo de " + bar.nom}
            loading="lazy"
            onError={() => setPhotoCassee(true)}
            className="h-40 w-full object-cover"
          />
        ) : (
          <div
            className="flex h-24 w-full items-center justify-center text-5xl"
            style={{ background: famille.couleur }}
            aria-hidden="true"
          >
            {famille.emoji}
          </div>
        )}


        <div className="space-y-4 p-4">
          {/* LE NOM, LE FAVORI, LES ÉTIQUETTES */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-2xl font-bold">{bar.nom}</h2>
              <BoutonFavori barId={bar.id} />
            </div>
            <p className="mt-1 text-sm" style={{ color: "var(--hv-texte-doux)" }}>
              {tags.join(" · ")}
            </p>
            {bar.adresse && (
              <p className="mt-1 text-sm" style={{ color: "var(--hv-texte-doux)" }}>
                {bar.adresse}
                {bar.distanceKm !== null ? " · " + bar.distanceKm.toFixed(1).replace(".", ",") + " km" : ""}
              </p>
            )}
          </div>


          {/* OUVERT / FERMÉ */}
          {statut.etat !== "inconnu" ? (
            <p
              className="text-sm font-bold"
              style={{ color: statut.etat === "ouvert" ? "var(--hv-accent)" : "var(--hv-tomate)" }}
            >
              {"● " + statut.texte}
            </p>
          ) : (
            bar.horaires && (
              <p className="text-sm" style={{ color: "var(--hv-texte-doux)" }}>
                {"🕒 " + bar.horaires}
              </p>
            )
          )}


          {/* LE MATCH */}
          {matchCeSoir && (
            <p className="text-sm font-semibold" style={{ color: "var(--hv-accent)" }}>
              {"⚽ Match ce soir : " + matchCeSoir.intitule + " à " + heureParis(matchCeSoir.date_heure)}
            </p>
          )}


          {/* LES OFFRES */}
          <ul className="space-y-3">
            {bar.offres.map((offre) => {
              const reste = tempsRestant(offre.fin, maintenant);
              const stock = stockLibelle(offre.quantite);
              return (
                <li
                  key={offre.id}
                  className="rounded-2xl border p-3"
                  style={{ background: "var(--hv-carte)", borderColor: "var(--hv-bord)" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 font-bold">{nomOffre(offre)}</p>
                    <p className="shrink-0 text-right">
                      <strong className="text-lg">{formatPrix(offre.prix_reduit)}</strong>{" "}
                      <span className="text-sm line-through" style={{ color: "var(--hv-texte-doux)" }}>
                        {formatPrix(offre.prix_normal)}
                      </span>
                    </p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {stock && <Etiquette urgent={stock.urgent}>{stock.texte}</Etiquette>}
                    {reste && <Etiquette urgent={reste.urgent}>{"⏱ " + reste.texte}</Etiquette>}
                  </div>
                  <div className="hv-acheter mt-3">
                    <AcheterAvecAge offreId={String(offre.id)} avecAlcool={boissonAvecAlcool(offre)} />
                  </div>
                </li>
              );
            })}
          </ul>


          {/* Y ALLER */}
          <div>
            <button
              type="button"
              onClick={() => setMenuYAller(!menuYAller)}
              className="w-full rounded-full border px-4 py-3 text-base font-bold"
              style={{ borderColor: "var(--hv-accent)", color: "var(--hv-accent)" }}
            >
              {"📍 Y aller"}
            </button>
            {menuYAller && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {liensItineraire.map((lien) => (
                  <a
                    key={lien.nom}
                    href={lien.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border px-2 py-3 text-center text-sm font-semibold"
                    style={{ borderColor: "var(--hv-bord)", background: "var(--hv-carte)" }}
                  >
                    {lien.nom}
                  </a>
                ))}
              </div>
            )}
          </div>


          {alcool && (
            <p className="text-center text-xs" style={{ color: "var(--hv-texte-doux)" }}>
              {"L'abus d'alcool est dangereux pour la santé, à consommer avec modération. Vente d'alcool interdite aux mineurs."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
