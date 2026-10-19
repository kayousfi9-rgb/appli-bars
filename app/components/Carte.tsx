"use client";

import { useEffect } from "react";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from "react-leaflet";

import type { BarAffiche, Position } from "../lib/types";

import { dateHeureParis, formatPrix } from "../lib/utils";

const CENTRE_PAR_DEFAUT: [number, number] = [48.8412, 2.2995]; // Paris 15e

// Pastille de prix sur la carte (verte avec ⚽ si match ce soir, rouge sinon)

function creerIcone(bar: BarAffiche, selectionne: boolean) {

  const prixMin = Math.min(...bar.offres.map((o) => o.prix_reduit));

  const fond = bar.matchSoir ? "#16a34a" : "#e11d48";

  const ballon = bar.matchSoir ? "⚽ " : "";

  const bordure = selectionne ? "#111827" : "#ffffff";

  return L.divIcon({

    className: "",

    iconSize: [0, 0],

    html: `<div style="transform:translate(-50%,-100%);background:${fond};color:#fff;font-weight:700;font-size:13px;padding:4px 9px;border-radius:999px;border:3px solid ${bordure};box-shadow:0 2px 6px rgba(0,0,0,.35);white-space:nowrap;">${ballon}dès ${formatPrix(prixMin)}</div>`,

  });

}

// Déplace la carte quand on se localise ou qu'on choisit un bar

function Recentrer({

  position,

  latitude,

  longitude,

}: {

  position: Position | null;

  latitude: number | null;

  longitude: number | null;

}) {

  const carte = useMap();

  const posLat = position?.lat;

  const posLng = position?.lng;

  useEffect(() => {

    if (posLat !== undefined && posLng !== undefined) carte.flyTo([posLat, posLng], 15);

  }, [posLat, posLng, carte]);

  useEffect(() => {

    if (latitude !== null && longitude !== null) carte.flyTo([latitude, longitude], 16);

  }, [latitude, longitude, carte]);

  return null;

}

type Props = {

  bars: BarAffiche[];

  position: Position | null;

  selectionId: string | number | null;

  onSelect: (id: string | number) => void;

};

export default function Carte({ bars, position, selectionId, onSelect }: Props) {

  const selection = bars.find((b) => b.id === selectionId) ?? null;

  return (

    <MapContainer

      center={CENTRE_PAR_DEFAUT}

      zoom={14}

      scrollWheelZoom

      style={{ height: "100%", width: "100%" }}

    >

      <TileLayer

        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

      />

      <Recentrer

        position={position}

        latitude={selection ? selection.latitude : null}

        longitude={selection ? selection.longitude : null}

      />

      {position && (

        <CircleMarker

          center={[position.lat, position.lng]}

          radius={8}

          pathOptions={{ color: "#1d4ed8", fillColor: "#3b82f6", fillOpacity: 0.9 }}

        />

      )}

      {bars.map((bar) => (

        <Marker

          key={bar.id}

          position={[bar.latitude, bar.longitude]}

          icon={creerIcone(bar, bar.id === selectionId)}

          eventHandlers={{ click: () => onSelect(bar.id) }}

        >

          <Popup>

            <div style={{ minWidth: 190, color: "#111827" }}>

              <strong style={{ fontSize: 15 }}>{bar.nom}</strong>

              <div style={{ color: "#6b7280", fontSize: 12 }}>{bar.adresse}</div>

              {bar.horaires && <div style={{ fontSize: 12 }}>🕒 {bar.horaires}</div>}

              <ul style={{ margin: "8px 0 0", padding: 0, listStyle: "none" }}>

                {bar.offres.map((o) => (

                  <li key={o.id} style={{ marginBottom: 4 }}>

                    {o.produit} : <strong>{formatPrix(o.prix_reduit)}</strong>{" "}

                    <s style={{ color: "#9ca3af" }}>{formatPrix(o.prix_normal)}</s>

                  </li>

                ))}

              </ul>

              {bar.matchs.map((m) => (

                <div key={m.id} style={{ marginTop: 4, fontSize: 13 }}>

                  ⚽ {m.intitule} · {dateHeureParis(m.date_heure)}

                </div>

              ))}

            </div>

          </Popup>

        </Marker>

      ))}

    </MapContainer>

  );

}
