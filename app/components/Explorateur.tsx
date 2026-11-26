"use client";


import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import CarteDynamique from "./CarteDynamique";
import BarreOnglets, { type Onglet } from "./BarreOnglets";
import FiltresCarte, { type FiltreCategorie } from "./FiltresCarte";
import ListeBars from "./ListeBars";
import FicheBar from "./FicheBar";
import CeSoir from "./Cesoir";
import PageProfil, { type Reglage } from "./client_temporaire/PageProfil";
import PorteConditions from "./PorteConditions";
import LiensLegaux from "./LiensLegaux";
import type { Position } from "../lib/types";
import type { ItemCeSoir } from "../lib/cesoir";
import type { Etablissement, EtablissementAffiche } from "../lib/etablissements";
import { dateParis, distanceKm } from "../lib/utils";


type Props = {
  bars: Etablissement[];
  aujourdhui: string; // ex : 2026-11-22 (date du jour à Paris)
  erreur: string | null;
  ceSoir: ItemCeSoir[];
  erreurCeSoir: string | null;
};


const BOISSONS_DE_BASE = ["bière", "vin", "cocktail", "sans alcool"];
const CLE_AFFICHAGE = "happyvo-affichage";


// Les couleurs de Happyvo, en clair et en sombre.
const STYLE = `
.hv-racine {
  --hv-fond: #FFFFFF;
  --hv-carte: #FFF4E2;
  --hv-texte: #14193C;
  --hv-texte-doux: #5B607E;
  --hv-bord: #E7DDC8;
  --hv-accent: #007F77;
  --hv-bouton-fond: #007F77;
  --hv-bouton-texte: #FFFFFF;
  --hv-pastille: #007F77;
  --hv-tomate: #E2372D;
}
.hv-racine[data-theme="sombre"] {
  --hv-fond: #0F1330;
  --hv-carte: #1B2150;
  --hv-texte: #FFF4E2;
  --hv-texte-doux: #AEB3D6;
  --hv-bord: #2F366B;
  --hv-accent: #3DD6CB;
  --hv-bouton-fond: #19C3B8;
  --hv-bouton-texte: #0F1330;
  --hv-pastille: #007F77;
}
.hv-racine[data-theme="sombre"] .hv-carte .leaflet-tile-pane {
  filter: invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.9);
}
.hv-racine[data-theme="sombre"] .hv-carte .leaflet-container {
  background: #1b1f3a;
}
.hv-carte .leaflet-bottom {
  margin-bottom: calc(64px + env(safe-area-inset-bottom));
}
.hv-section > * + * {
  border-top: 1px solid var(--hv-bord);
}
.hv-defile {
  scrollbar-width: none;
}
.hv-defile::-webkit-scrollbar {
  display: none;
}
.hv-acheter button {
  width: 100%;
  border-radius: 999px;
  padding: 12px 18px;
  font-size: 16px;
  font-weight: 700;
  background: var(--hv-bouton-fond);
  color: var(--hv-bouton-texte);
}
.hv-acheter button:disabled {
  opacity: 0.6;
}
@keyframes hv-monte {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.hv-fiche {
  animation: hv-monte 0.22s ease-out;
}
@media (prefers-reduced-motion: reduce) {
  .hv-fiche { animation: none; }
}
`;


export default function Explorateur({ bars, aujourdhui, erreur, ceSoir, erreurCeSoir }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const demande = params.get("onglet");


  const [onglet, setOnglet] = useState<Onglet>(
    demande === "profil"
      ? "profil"
      : demande === "liste"
        ? "liste"
        : demande === "cesoir"
          ? "cesoir"
          : "carte"
  );
  const [recherche, setRecherche] = useState("");
  const [categorie, setCategorie] = useState<FiltreCategorie>("tout");
  const [etiquette, setEtiquette] = useState("toutes");
  const [boissons, setBoissons] = useState<string[]>([]);
  const [ambiance, setAmbiance] = useState("toutes");
  const [prixMax, setPrixMax] = useState<number | null>(null);
  const [matchSoir, setMatchSoir] = useState(false);
  const [rayon, setRayon] = useState(0); // 0 = partout
  const [position, setPosition] = useState<Position | null>(null);
  const [messageGeo, setMessageGeo] = useState<string | null>(null);
  const [selectionId, setSelectionId] = useState<string | number | null>(null);
  const [reglage, setReglage] = useState<Reglage>("auto");
  const [systemeSombre, setSystemeSombre] = useState(false);
  const [initiale, setInitiale] = useState<string | null>(null);
  // L'heure actuelle, lue dans un useEffect (jamais pendant le rendu)
  const [maintenant, setMaintenant] = useState<number | null>(null);


  // Actualisation automatique toutes les 60 secondes (offres « en direct »)
  useEffect(() => {
    const minuteur = setInterval(() => router.refresh(), 60000);
    return () => clearInterval(minuteur);
  }, [router]);


  // L'horloge : mise à jour toutes les 30 secondes (compte à rebours, ouvert/fermé, étoiles rouges)
  useEffect(() => {
    setMaintenant(Date.now());
    const minuteur = setInterval(() => setMaintenant(Date.now()), 30000);
    return () => clearInterval(minuteur);
  }, []);


  // Le réglage d'affichage choisi (clair, sombre, auto) et le réglage du téléphone
  useEffect(() => {
    try {
      const enregistre = localStorage.getItem(CLE_AFFICHAGE);
      if (enregistre === "clair" || enregistre === "sombre" || enregistre === "auto") {
        setReglage(enregistre);
      }
    } catch {
      // Stockage indisponible : on reste en automatique
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemeSombre(media.matches);
    function surChangement(e: MediaQueryListEvent) {
      setSystemeSombre(e.matches);
    }
    media.addEventListener("change", surChangement);
    return () => media.removeEventListener("change", surChangement);
  }, []);


  // L'initiale affichée dans l'onglet Profil
  useEffect(() => {
    function majInitiale(utilisateur: User | null | undefined) {
      if (!utilisateur) {
        setInitiale(null);
        return;
      }
      const prenom = utilisateur.user_metadata?.prenom as string | undefined;
      const source = (prenom && prenom.trim()) || utilisateur.email || "";
      setInitiale(source ? source.charAt(0).toUpperCase() : null);
    }
    supabase.auth.getSession().then(({ data }) => majInitiale(data.session?.user));
    const { data: abonnement } = supabase.auth.onAuthStateChange((_evenement, session) => {
      majInitiale(session?.user);
    });
    return () => abonnement.subscription.unsubscribe();
  }, []);


  const sombre = reglage === "sombre" || (reglage === "auto" && systemeSombre);


  function changerReglage(nouveau: Reglage) {
    setReglage(nouveau);
    try {
      localStorage.setItem(CLE_AFFICHAGE, nouveau);
    } catch {
      // Rien à faire
    }
  }


  const boissonsDispo = useMemo(() => {
    const dansLesDonnees = bars.flatMap((b) => b.offres.map((o) => o.type_boisson?.toLowerCase()));
    const toutes = [...BOISSONS_DE_BASE, ...dansLesDonnees];
    return Array.from(new Set(toutes.filter((t): t is string => Boolean(t))));
  }, [bars]);


  const ambiances = useMemo(() => {
    const toutes = bars.map((b) => b.ambiance);
    return Array.from(new Set(toutes.filter((a): a is string => Boolean(a)))).sort();
  }, [bars]);


  // Les étiquettes de la famille choisie (laser game, padel, boulangerie…)
  const etiquettes = useMemo(() => {
    const toutes = bars
      .filter((b) => categorie === "tout" || b.categorie_etab === categorie)
      .map((b) => (b.etiquette ?? "").trim().toLowerCase());
    return Array.from(new Set(toutes.filter((e) => e !== ""))).sort();
  }, [bars, categorie]);


  const prixPlafond = useMemo(() => {
    const prix = bars.flatMap((b) => b.offres.map((o) => o.prix_reduit));
    return Math.max(5, Math.ceil(Math.max(0, ...prix)));
  }, [bars]);


  const barsAffiches: EtablissementAffiche[] = useMemo(() => {
    const resultat: EtablissementAffiche[] = [];
    const mot = recherche.trim().toLowerCase();


    for (const bar of bars) {
      if (categorie !== "tout" && bar.categorie_etab !== categorie) continue;
      if (etiquette !== "toutes" && (bar.etiquette ?? "").trim().toLowerCase() !== etiquette) continue;


      if (mot) {
        const texte = (bar.nom + " " + (bar.adresse ?? "") + " " + (bar.etiquette ?? "")).toLowerCase();
        if (!texte.includes(mot)) continue;
      }
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
            // une offre terminée disparaît tout de suite, sans attendre l'actualisation
            (maintenant === null || new Date(o.fin).getTime() > maintenant) &&
            (boissons.length === 0 ||
              (o.type_boisson !== null && boissons.includes(o.type_boisson.toLowerCase()))) &&
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
  }, [bars, recherche, categorie, etiquette, boissons, ambiance, prixMax, matchSoir, rayon, position, aujourdhui, maintenant]);


  const selection = barsAffiches.find((b) => b.id === selectionId) ?? null;


  const filtresActifs =
    recherche !== "" ||
    categorie !== "tout" ||
    etiquette !== "toutes" ||
    boissons.length > 0 ||
    ambiance !== "toutes" ||
    prixMax !== null ||
    matchSoir ||
    rayon > 0;


  function basculerBoisson(boisson: string) {
    setBoissons((avant) =>
      avant.includes(boisson) ? avant.filter((b) => b !== boisson) : [...avant, boisson]
    );
  }


  function changerCategorie(nouvelle: FiltreCategorie) {
    setCategorie(nouvelle);
    setEtiquette("toutes");
    if (nouvelle === "sport_bienetre" || nouvelle === "sorties") {
      // ces deux filtres n'ont pas de sens pour le sport, le bien-être et les sorties
      setBoissons([]);
      setMatchSoir(false);
    }
  }


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
    setRecherche("");
    setCategorie("tout");
    setEtiquette("toutes");
    setBoissons([]);
    setAmbiance("toutes");
    setPrixMax(null);
    setMatchSoir(false);
    setRayon(0);
    setSelectionId(null);
  }


  function voirSurLaCarte(id: string | number) {
    setSelectionId(id);
    setOnglet("carte");
  }


  const mots = ["lieu", "lieux"];


  return (
    <div
      data-theme={sombre ? "sombre" : "clair"}
      className="hv-racine fixed inset-0 overflow-hidden"
      style={{ background: "var(--hv-fond)", color: "var(--hv-texte)" }}
    >
      <style>{STYLE}</style>


      {/* LA CARTE, TOUJOURS PRÉSENTE, EN PLEIN ÉCRAN */}
      <div className="hv-carte absolute inset-0">
        <CarteDynamique
          bars={barsAffiches}
          position={position}
          selectionId={selectionId}
          maintenant={maintenant}
          onSelect={setSelectionId}
        />
      </div>


      {/* LES FILTRES QUI FLOTTENT (onglets Carte et Liste) */}
      {(onglet === "carte" || onglet === "liste") && (
        <FiltresCarte
          recherche={recherche}
          onRecherche={setRecherche}
          categorie={categorie}
          onCategorie={changerCategorie}
          etiquettes={etiquettes}
          etiquette={etiquette}
          onEtiquette={setEtiquette}
          boissonsDispo={boissonsDispo}
          boissons={boissons}
          onToggleBoisson={basculerBoisson}
          ambiances={ambiances}
          ambiance={ambiance}
          onAmbiance={setAmbiance}
          prixPlafond={prixPlafond}
          prixMax={prixMax}
          onPrixMax={setPrixMax}
          matchSoir={matchSoir}
          onMatchSoir={setMatchSoir}
          avecPosition={position !== null}
          onLocaliser={localiser}
          messageGeo={messageGeo}
          rayon={rayon}
          onRayon={setRayon}
          filtresActifs={filtresActifs}
          onReinitialiser={reinitialiser}
        />
      )}


      {/* SUR LA CARTE : le compteur, le bouton « Me localiser », les messages */}
      {onglet === "carte" && (
        <>
          {selection === null && (
            <>
              <p
                className="absolute left-3 z-[1350] rounded-full px-3 py-1.5 text-xs font-semibold shadow-md"
                style={{
                  bottom: "calc(env(safe-area-inset-bottom) + 80px)",
                  background: "var(--hv-fond)",
                  color: "var(--hv-texte)",
                }}
              >
                {barsAffiches.length +
                  (barsAffiches.length > 1 ? " " + mots[1] : " " + mots[0]) +
                  " avec une offre en cours"}
              </p>
              <button
                type="button"
                onClick={localiser}
                aria-label="Me localiser"
                className="absolute right-3 z-[1350] flex h-12 w-12 items-center justify-center rounded-full border shadow-lg"
                style={{
                  bottom: "calc(env(safe-area-inset-bottom) + 108px)",
                  background: "var(--hv-fond)",
                  borderColor: "var(--hv-bord)",
                  color: "var(--hv-accent)",
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="7" />
                  <circle cx="12" cy="12" r="2" />
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                </svg>
              </button>
            </>
          )}
          {barsAffiches.length === 0 && (
            <p
              className="pointer-events-none absolute inset-x-6 top-1/2 z-[1350] -translate-y-1/2 rounded-2xl px-4 py-3 text-center text-sm font-semibold shadow-lg"
              style={{ background: "var(--hv-fond)", color: "var(--hv-texte)" }}
            >
              {bars.length === 0
                ? "Aucune offre en cours pour le moment. Reviens vite !"
                : "Aucun lieu ne correspond à ces filtres. Essaie d'en enlever un."}
            </p>
          )}
        </>
      )}


      {erreur && (
        <p
          className="absolute inset-x-3 z-[1350] rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 130px)" }}
        >
          {"Impossible de charger les offres : " + erreur}
        </p>
      )}


      {/* LA FICHE QUI MONTE DU BAS */}
      {onglet === "carte" && selection !== null && (
        <FicheBar
          key={String(selection.id)}
          bar={selection}
          maintenant={maintenant}
          aujourdhui={aujourdhui}
          onFermer={() => setSelectionId(null)}
        />
      )}


      {/* L'ONGLET LISTE */}
      {onglet === "liste" && (
        <ListeBars
          bars={barsAffiches}
          aucuneOffre={bars.length === 0}
          aujourdhui={aujourdhui}
          onVoirSurCarte={voirSurLaCarte}
        />
      )}


      {/* L'ONGLET CE SOIR */}
      {onglet === "cesoir" && (
        <CeSoir items={ceSoir} erreur={erreurCeSoir} maintenant={maintenant} />
      )}


      {/* L'ONGLET PROFIL */}
      {onglet === "profil" && (
        <>
          <PageProfil reglage={reglage} onReglage={changerReglage} />
          <LiensLegaux />
        </>
      )}


      {/* L'ÉCRAN D'ACCEPTATION DES CONDITIONS (seulement si besoin) */}
      <PorteConditions />


      {/* LA BARRE D'ONGLETS, TOUJOURS EN BAS */}
      <BarreOnglets actif={onglet} onChange={setOnglet} initiale={initiale} />
    </div>
  );
}

