"use client";


import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, CircleMarker, useMap, useMapEvents } from "react-leaflet";
import type { Position } from "../lib/types";
import type { EtablissementAffiche } from "../lib/etablissements";
import { offreUrgente } from "../lib/horaires";
import { infosFamille } from "../lib/familles";
import { formatPrix } from "../lib/utils";


const CENTRE_PAR_DEFAUT: [number, number] = [48.8412, 2.2995]; // Paris 15e


// Les étoiles se regroupent si elles sont à moins de 50 pixels l'une de l'autre
const RAYON_REGROUPEMENT = 50;
// À partir de ce niveau de zoom, plus de regroupement
const ZOOM_SANS_REGROUPEMENT = 17;


// Les couleurs des étoiles (à changer ici, à un seul endroit)
const COULEURS = {
  bar: "#00AAA0",
  urgent: "#E2372D",
  contour: "#14193C",
  creme: "#FFF4E2",
};


// Les 5 pointes de l'étoile (dans un carré de 24 sur 24)
const POINTS_ETOILE = "12.0,2.0 14.9,9.0 22.5,9.6 16.8,14.5 18.5,21.9 12.0,18.0 5.5,21.9 7.2,14.5 1.5,9.6 9.1,9.0";


// L'étoile souriante avec le prix en dessous
function creerIconeEtoile(couleur: string, selectionne: boolean, etiquette: string) {
  const taille = selectionne ? 56 : 44;
  const lueur = selectionne ? "drop-shadow(0 0 5px #ffffff)" : "drop-shadow(0 2px 3px rgba(0,0,0,.4))";
  return L.divIcon({
    className: "",
    iconSize: [0, 0],
    html:
      '<div style="position:absolute;left:0;top:0;width:max-content;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;filter:' +
      lueur +
      ';">' +
      '<svg width="' + taille + '" height="' + taille + '" viewBox="0 0 24 24" aria-hidden="true">' +
      '<polygon points="' + POINTS_ETOILE + '" fill="' + couleur + '" stroke="' + COULEURS.contour + '" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<circle cx="9.6" cy="12.2" r="1" fill="' + COULEURS.creme + '"/>' +
      '<circle cx="14.4" cy="12.2" r="1" fill="' + COULEURS.creme + '"/>' +
      '<path d="M9.4 15 Q12 17.6 14.6 15" fill="none" stroke="' + COULEURS.creme + '" stroke-width="1.1" stroke-linecap="round"/>' +
      "</svg>" +
      '<span style="margin-top:-4px;background:#ffffff;color:' + COULEURS.contour + ';font-weight:700;font-size:12px;padding:2px 7px;border-radius:999px;border:2px solid ' + COULEURS.contour + ';white-space:nowrap;">' +
      etiquette +
      "</span></div>",
  });
}


// Le rond qui regroupe plusieurs étoiles quand on dézoome
function creerIconeGroupe(nombre: number) {
  return L.divIcon({
    className: "",
    iconSize: [0, 0],
    html:
      '<div style="position:absolute;left:0;top:0;transform:translate(-50%,-50%);width:46px;height:46px;border-radius:999px;background:' + COULEURS.contour + ';color:' + COULEURS.creme + ';border:3px solid ' + COULEURS.bar + ';display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;box-shadow:0 2px 6px rgba(0,0,0,.4);">' +
      nombre +
      "</div>",
  });
}


type Groupe = {
  cle: string;
  membres: EtablissementAffiche[];
  lat: number;
  lng: number;
};


function MarqueurEtoile({
  bar,
  selectionne,
  maintenant,
  onSelect,
}: {
  bar: EtablissementAffiche;
  selectionne: boolean;
  maintenant: number | null;
  onSelect: (id: string | number | null) => void;
}) {
  const prixMin = Math.min(...bar.offres.map((o) => o.prix_reduit));
  const urgent = bar.offres.some((o) => offreUrgente(o.fin, maintenant));
  const etiquette = (bar.matchSoir ? "⚽ " : "") + "dès " + formatPrix(prixMin);
  const famille = infosFamille(bar.categorie_etab);


  const icone = useMemo(() => {
    const couleur = urgent ? COULEURS.urgent : famille.couleur;
    return creerIconeEtoile(couleur, selectionne, etiquette);
  }, [urgent, famille.couleur, selectionne, etiquette]);


  return (
    <Marker
      position={[bar.latitude, bar.longitude]}
      icon={icone}
      zIndexOffset={selectionne ? 1000 : 0}
      eventHandlers={{ click: () => onSelect(bar.id) }}
    />
  );
}


function MarqueurGroupe({ groupe }: { groupe: Groupe }) {
  const carte = useMap();
  const nombre = groupe.membres.length;
  const icone = useMemo(() => creerIconeGroupe(nombre), [nombre]);


  return (
    <Marker
      position={[groupe.lat, groupe.lng]}
      icon={icone}
      eventHandlers={{
        click: () => {
          const limites = L.latLngBounds(
            groupe.membres.map((b) => [b.latitude, b.longitude] as [number, number])
          );
          carte.fitBounds(limites, { padding: [60, 60], maxZoom: 17 });
        },
      }}
    />
  );
}


// Tous les marqueurs, avec le regroupement selon le zoom
function Marqueurs({
  bars,
  selectionId,
  maintenant,
  onSelect,
}: {
  bars: EtablissementAffiche[];
  selectionId: string | number | null;
  maintenant: number | null;
  onSelect: (id: string | number | null) => void;
}) {
  const carte = useMap();
  const [zoom, setZoom] = useState(() => carte.getZoom());


  useMapEvents({
    zoomend: () => setZoom(carte.getZoom()),
    click: () => onSelect(null), // un clic sur la carte ferme la fiche
  });


  const groupes = useMemo(() => {
    const resultat: Groupe[] = [];
    const cellules: { x: number; y: number; membres: EtablissementAffiche[] }[] = [];


    const seul = (bar: EtablissementAffiche): Groupe => ({
      cle: "b-" + String(bar.id),
      membres: [bar],
      lat: bar.latitude,
      lng: bar.longitude,
    });


    for (const bar of bars) {
      // l'étoile choisie et le zoom proche : jamais regroupées
      if (bar.id === selectionId || zoom >= ZOOM_SANS_REGROUPEMENT) {
        resultat.push(seul(bar));
        continue;
      }
      const p = carte.project([bar.latitude, bar.longitude], zoom);
      const proche = cellules.find((c) => Math.hypot(c.x - p.x, c.y - p.y) < RAYON_REGROUPEMENT);
      if (proche) {
        proche.membres.push(bar);
        const n = proche.membres.length;
        proche.x = (proche.x * (n - 1) + p.x) / n;
        proche.y = (proche.y * (n - 1) + p.y) / n;
      } else {
        cellules.push({ x: p.x, y: p.y, membres: [bar] });
      }
    }


    for (const cellule of cellules) {
      if (cellule.membres.length === 1) {
        resultat.push(seul(cellule.membres[0]));
      } else {
        const centre = carte.unproject(L.point(cellule.x, cellule.y), zoom);
        resultat.push({
          cle: "g-" + cellule.membres.map((b) => String(b.id)).sort().join("-"),
          membres: cellule.membres,
          lat: centre.lat,
          lng: centre.lng,
        });
      }
    }
    return resultat;
  }, [bars, carte, zoom, selectionId]);


  return (
    <>
      {groupes.map((groupe) =>
        groupe.membres.length === 1 ? (
          <MarqueurEtoile
            key={groupe.cle}
            bar={groupe.membres[0]}
            selectionne={groupe.membres[0].id === selectionId}
            maintenant={maintenant}
            onSelect={onSelect}
          />
        ) : (
          <MarqueurGroupe key={groupe.cle} groupe={groupe} />
        )
      )}
    </>
  );
}


// Déplace la carte quand on se localise ou qu'on choisit un établissement
function Recentrer({
  position,
  cible,
}: {
  position: Position | null;
  cible: { lat: number; lng: number } | null;
}) {
  const carte = useMap();
  const posLat = position?.lat;
  const posLng = position?.lng;
  const cibleLat = cible ? cible.lat : null;
  const cibleLng = cible ? cible.lng : null;


  useEffect(() => {
    if (posLat !== undefined && posLng !== undefined) carte.flyTo([posLat, posLng], 15);
  }, [posLat, posLng, carte]);


  useEffect(() => {
    if (cibleLat === null || cibleLng === null) return;
    const zoom = Math.max(carte.getZoom(), 16);
    // On décale un peu le centre vers le bas pour que l'étoile reste visible au-dessus de la fiche
    const point = carte.project([cibleLat, cibleLng], zoom);
    point.y += carte.getSize().y * 0.2;
    carte.flyTo(carte.unproject(point, zoom), zoom);
  }, [cibleLat, cibleLng, carte]);


  return null;
}


type Props = {
  bars: EtablissementAffiche[];
  position: Position | null;
  selectionId: string | number | null;
  maintenant: number | null;
  onSelect: (id: string | number | null) => void;
};


export default function Carte({ bars, position, selectionId, maintenant, onSelect }: Props) {
  const selection = bars.find((b) => b.id === selectionId) ?? null;


  return (
    <MapContainer
      center={CENTRE_PAR_DEFAUT}
      zoom={14}
      scrollWheelZoom
      zoomControl={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recentrer
        position={position}
        cible={selection ? { lat: selection.latitude, lng: selection.longitude } : null}
      />
      {position && (
        <CircleMarker
          center={[position.lat, position.lng]}
          radius={8}
          pathOptions={{ color: "#14193C", fillColor: "#00AAA0", fillOpacity: 0.9 }}
        />
      )}
      <Marqueurs bars={bars} selectionId={selectionId} maintenant={maintenant} onSelect={onSelect} />
    </MapContainer>
  );
}
