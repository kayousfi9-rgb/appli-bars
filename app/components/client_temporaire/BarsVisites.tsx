"use client";

import { useEffect, useState } from "react";

import { supabase } from "../../lib/supabase";

import { formaterDateHeure, formaterEuros, premier } from "../../lib/commandes";

import type { VisiteBar } from "../../lib/types";

// Un résumé par bar.

type Resume = {

  barId: string;

  nom: string;

  adresse: string | null;

  visites: number;

  derniere: string | null;

  total: number;

};

// Les paliers ludiques, selon le nombre de bars DIFFÉRENTS visités.

const PALIERS = [

  { seuil: 1, nom: "Première sortie" },

  { seuil: 3, nom: "Curieux" },

  { seuil: 5, nom: "Habitué du quartier" },

  { seuil: 10, nom: "Explorateur" },

  { seuil: 25, nom: "Légende des comptoirs" },

];

export default function BarsVisites() {

  const [connecte, setConnecte] = useState<boolean | null>(null);

  const [bars, setBars] = useState<Resume[]>([]);

  const [sorties, setSorties] = useState(0);

  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {

    let annule = false;

    (async () => {

      const { data: session } = await supabase.auth.getSession();

      const idClient = session.session?.user.id;

      if (annule) return;

      if (!idClient) {

        setConnecte(false);

        return;

      }

      setConnecte(true);

      // 1) Toutes les commandes RÉCUPÉRÉES du client, la plus récente en premier.

      const { data, error } = await supabase

        .from("commandes")

        .select("prix_paye, recuperee_le, bar_id, bars(nom, adresse)")

        .eq("client_id", idClient)

        .eq("statut", "recuperee")

        .order("recuperee_le", { ascending: false });

      if (annule) return;

      if (error) {

        setMessage("Erreur : " + error.message);

        return;

      }

      // 2) On regroupe par bar.

      const parBar = new Map<string, Resume>();

      const liste = (data as unknown as VisiteBar[]) ?? [];

      for (const v of liste) {

        const cle = String(v.bar_id);

        const infos = premier(v.bars);

        const existant = parBar.get(cle);

        if (existant) {

          existant.visites += 1;

          existant.total += Number(v.prix_paye);

        } else {

          // Comme la liste est triée de la plus récente à la plus ancienne,

          // la première commande vue pour un bar est sa dernière visite.

          parBar.set(cle, {

            barId: cle,

            nom: infos?.nom ?? "Bar",

            adresse: infos?.adresse ?? null,

            visites: 1,

            derniere: v.recuperee_le,

            total: Number(v.prix_paye),

          });

        }

      }

      setBars(Array.from(parBar.values()));

      setSorties(liste.length);

    })();

    return () => {

      annule = true;

    };

  }, []);

  if (connecte === null) return <p className="text-gray-500">Chargement…</p>;

  if (!connecte) {

    return (

      <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-900">

        <p className="font-semibold">{"Connecte-toi pour voir les bars où tu es allé."}</p>

        <p className="mt-2 text-sm">

          <a href="/compte" className="underline">

            Aller sur Mon compte

          </a>

        </p>

      </div>

    );

  }

  const nombreBars = bars.length;

  const palierActuel = [...PALIERS].reverse().find((p) => nombreBars >= p.seuil) ?? null;

  const prochainPalier = PALIERS.find((p) => nombreBars < p.seuil) ?? null;

  return (

    <div className="space-y-6">

      {message && <p className="rounded bg-amber-50 p-3 text-sm text-amber-900">{message}</p>}

      {/* LE RÉSUMÉ ET LE PALIER */}

      <section className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-center text-rose-900">

        <p className="text-4xl font-bold">{nombreBars}</p>

        <p className="text-sm">{nombreBars > 1 ? "bars différents visités" : "bar visité"}</p>

        <p className="mt-1 text-xs">{sorties + (sorties > 1 ? " sorties au total" : " sortie au total")}</p>

        {palierActuel && (

          <p className="mt-3 inline-block rounded-full bg-white px-3 py-1 text-sm font-semibold">

            {palierActuel.nom}

          </p>

        )}

        {prochainPalier && (

          <p className="mt-2 text-xs">

            {"Encore " +

              (prochainPalier.seuil - nombreBars) +

              (prochainPalier.seuil - nombreBars > 1 ? " bars" : " bar") +

              " pour devenir « " +

              prochainPalier.nom +

              " »"}

          </p>

        )}

      </section>

      {/* LA LISTE DES BARS */}

      {nombreBars === 0 ? (

        <p className="text-sm text-gray-500">

          {"Tu n'as encore récupéré aucune commande. Dès que tu montres ton QR code au comptoir, le bar apparaîtra ici."}

        </p>

      ) : (

        <ul className="space-y-2">

          {bars.map((b) => (

            <li key={b.barId} className="rounded-lg border border-gray-200 bg-white p-3 text-sm">

              <div className="flex items-start justify-between gap-3">

                <span>

                  <strong>{b.nom}</strong>

                  {b.adresse && (

                    <span className="block text-xs text-gray-500">{b.adresse}</span>

                  )}

                </span>

                <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs">

                  {b.visites + (b.visites > 1 ? " visites" : " visite")}

                </span>

              </div>

              <p className="mt-2 text-xs text-gray-500">

                {"Dernière visite le " +

                  formaterDateHeure(b.derniere) +

                  " · " +

                  formaterEuros(b.total) +

                  " dépensés"}

              </p>

            </li>

          ))}

        </ul>

      )}

    </div>

  );

}
