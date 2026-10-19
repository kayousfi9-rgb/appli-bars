import type { Position } from "./types";

export function formatPrix(valeur: number): string {

  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(valeur);

}

// Date du jour à Paris sous la forme 2026-10-19 (pour comparer « aujourd'hui »)

export function dateParis(iso: string): string {

  return new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(new Date(iso));

}

export function heureParis(iso: string): string {

  return new Intl.DateTimeFormat("fr-FR", {

    timeZone: "Europe/Paris",

    hour: "2-digit",

    minute: "2-digit",

  }).format(new Date(iso));

}

export function dateCourteParis(iso: string): string {

  return new Intl.DateTimeFormat("fr-FR", {

    timeZone: "Europe/Paris",

    day: "numeric",

    month: "short",

  }).format(new Date(iso));

}

export function dateHeureParis(iso: string): string {

  return new Intl.DateTimeFormat("fr-FR", {

    timeZone: "Europe/Paris",

    weekday: "short",

    day: "numeric",

    month: "short",

    hour: "2-digit",

    minute: "2-digit",

  }).format(new Date(iso));

}

// Distance en km entre deux points GPS

export function distanceKm(a: Position, b: Position): number {

  const rayonTerre = 6371;

  const rad = (x: number) => (x * Math.PI) / 180;

  const dLat = rad(b.lat - a.lat);

  const dLng = rad(b.lng - a.lng);

  const h =

    Math.sin(dLat / 2) ** 2 +

    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;

  return 2 * rayonTerre * Math.asin(Math.sqrt(h));

}
