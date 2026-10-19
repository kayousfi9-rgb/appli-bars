import { supabase } from "./supabase";

import type { Bar } from "./types";

export type ResultatBars = { bars: Bar[]; erreur: string | null };

const COLONNES =

  "id, nom, adresse, latitude, longitude, type_bar, terrasse, ambiance, horaires, offres(id, produit, type_boisson, prix_normal, prix_reduit, debut, fin, quantite), matchs(id, intitule, date_heure)";

export async function recupererBars(): Promise<ResultatBars> {

  const maintenant = Date.now();

  const { data, error } = await supabase

    .from("bars")

    .select(COLONNES)

    .eq("verifie", true);

  if (error) {

    console.error("Erreur Supabase :", error.message);

    return { bars: [], erreur: error.message };

  }

  const bars = ((data ?? []) as unknown as Bar[])

    .map((bar) => ({

      ...bar,

      // on garde seulement les offres en cours et pas épuisées

      offres: (bar.offres ?? []).filter((o) => {

        const debut = new Date(o.debut).getTime();

        const fin = new Date(o.fin).getTime();

        return debut <= maintenant && fin >= maintenant && (o.quantite ?? 1) > 0;

      }),

      // et les matchs à venir (ou commencés depuis moins de 3h)

      matchs: (bar.matchs ?? []).filter(

        (m) => new Date(m.date_heure).getTime() >= maintenant - 3 * 60 * 60 * 1000

      ),

    }))

    // un bar sans offre en cours n'apparaît pas sur la carte

    .filter((bar) => bar.offres.length > 0);

  return { bars, erreur: null };

}
