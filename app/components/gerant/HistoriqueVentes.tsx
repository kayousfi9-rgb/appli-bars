"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "../../lib/supabase";

import {

  chargerMonBar,

  formaterDateHeure,

  formaterEuros,

  LIBELLES_STATUT,

  nomOffre,

  statutReel,

} from "../../lib/commandes";

import type { MonBar, StatutCommande, VenteBar } from "../../lib/types";

type Filtre = "toutes" | StatutCommande;

const FILTRES: { valeur: Filtre; libelle: string }[] = [

  { valeur: "toutes", libelle: "Toutes" },

  { valeur: "payee", libelle: "À servir" },

  { valeur: "recuperee", libelle: "Récupérées" },

  { valeur: "expiree", libelle: "Expirées" },

];

const COULEURS: Record<StatutCommande, string> = {

  payee: "bg-blue-100 text-blue-800",

  recuperee: "bg-green-100 text-green-800",

  expiree: "bg-orange-100 text-orange-800",

};

export default function HistoriqueVentes() {

  const [pret, setPret] = useState(false);

  const [bar, setBar] = useState<MonBar | null>(null);

  const [ventes, setVentes] = useState<VenteBar[]>([]);

  const [filtre, setFiltre] = useState<Filtre>("toutes");

  const [chargement, setChargement] = useState(false);

  const [message, setMessage] = useState<string | null>(null);

  // 1) Lire les 200 dernières ventes du bar.

  const charger = useCallback(async (barId: string | number) => {

    setChargement(true);

    setMessage(null);

    const { data, error } = await supabase

      .from("commandes")

      .select(

        "id, prix_paye, commission, statut, created_at, expire_le, recuperee_le, offres(produit, nom_plat, categorie)"

      )

      .eq("bar_id", barId)

      .order("created_at", { ascending: false })

      .limit(200);

    if (error) setMessage("Erreur : " + error.message);

    setVentes((data as unknown as VenteBar[]) ?? []);

    setChargement(false);

  }, []);

  // 2) Au chargement : on retrouve le bar du gérant, puis ses ventes.

  useEffect(() => {

    let annule = false;

    (async () => {

      const monBar = await chargerMonBar();

      if (annule) return;

      setBar(monBar);

      setPret(true);

      if (monBar) charger(monBar.id);

    })();

    return () => {

      annule = true;

    };

  }, [charger]);

  // 3) Les ventes avec leur vrai statut (une commande dont l'heure limite

  //    est passée compte comme expirée, même si le robot n'est pas encore passé).

  const ventesAffichees = useMemo(

    () =>

      ventes.map((v) => ({ ...v, statutAffiche: statutReel(v.statut, v.expire_le) })),

    [ventes]

  );

  // 4) Les totaux, calculés sur TOUTES les ventes (l'argent est encaissé dès le paiement).

  const totaux = useMemo(() => {

    let encaisse = 0;

    let commission = 0;

    const compte: Record<StatutCommande, number> = { payee: 0, recuperee: 0, expiree: 0 };

    for (const v of ventesAffichees) {

      encaisse += Number(v.prix_paye);

      commission += Number(v.commission);

      compte[v.statutAffiche] += 1;

    }

    return {

      nombre: ventesAffichees.length,

      encaisse,

      commission,

      net: encaisse - commission,

      compte,

    };

  }, [ventesAffichees]);

  const liste =

    filtre === "toutes"

      ? ventesAffichees

      : ventesAffichees.filter((v) => v.statutAffiche === filtre);

  if (!pret) return <p className="text-gray-500">Chargement…</p>;

  if (!bar) {

    return (

      <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-900">

        <p className="font-semibold">{"Tu n'es pas connecté en tant que gérant."}</p>

        <p className="mt-2 text-sm">

          <a href="/gerant" className="underline">

            {"Connecte-toi dans l'espace gérant"}

          </a>

        </p>

      </div>

    );

  }

  return (

    <div className="space-y-6">

      <div className="flex items-center justify-between gap-2">

        <p className="text-sm text-gray-600">

          Bar : <strong>{bar.nom}</strong>

        </p>

        <button

          type="button"

          onClick={() => charger(bar.id)}

          disabled={chargement}

          className="rounded-full border border-gray-300 px-3 py-1 text-xs disabled:opacity-50"

        >

          {chargement ? "…" : "Actualiser"}

        </button>

      </div>

      {message && <p className="rounded bg-amber-50 p-3 text-sm text-amber-900">{message}</p>}

      {/* LES TOTAUX */}

      <section className="grid grid-cols-2 gap-3">

        <Case titre="Ventes" valeur={String(totaux.nombre)} />

        <Case titre="Montant encaissé" valeur={formaterEuros(totaux.encaisse)} />

        <Case titre="Commission appli" valeur={formaterEuros(totaux.commission)} />

        <Case titre="Net pour le bar" valeur={formaterEuros(totaux.net)} />

      </section>

      <p className="text-xs text-gray-500">

        {"Montants avant les frais bancaires de Stripe. Le détail exact des virements est dans ton tableau de bord Stripe."}

      </p>

      {/* LES FILTRES */}

      <div className="flex flex-wrap gap-2">

        {FILTRES.map((f) => (

          <button

            key={f.valeur}

            type="button"

            onClick={() => setFiltre(f.valeur)}

            className={

              "rounded-full border px-3 py-1 text-sm " +

              (filtre === f.valeur

                ? "border-rose-600 bg-rose-600 text-white"

                : "border-gray-300 bg-white text-gray-700")

            }

          >

            {f.libelle}

            {f.valeur !== "toutes" && " (" + totaux.compte[f.valeur] + ")"}

          </button>

        ))}

      </div>

      {/* LA LISTE */}

      {liste.length === 0 ? (

        <p className="text-sm text-gray-500">{"Aucune vente à afficher pour l'instant."}</p>

      ) : (

        <ul className="space-y-2">

          {liste.map((v) => (

            <li

              key={v.id}

              className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3 text-sm"

            >

              <span>

                <strong>{nomOffre(v.offres)}</strong>

                <span className="block text-xs text-gray-500">

                  {"Achetée le " + formaterDateHeure(v.created_at)}

                  {v.recuperee_le && " · servie le " + formaterDateHeure(v.recuperee_le)}

                </span>

              </span>

              <span className="shrink-0 text-right">

                <span className="block font-medium">{formaterEuros(v.prix_paye)}</span>

                <span

                  className={

                    "mt-1 inline-block rounded-full px-2 py-0.5 text-xs " +

                    COULEURS[v.statutAffiche]

                  }

                >

                  {LIBELLES_STATUT[v.statutAffiche]}

                </span>

              </span>

            </li>

          ))}

        </ul>

      )}

    </div>

  );

}

function Case({ titre, valeur }: { titre: string; valeur: string }) {

  return (

    <div className="rounded-xl border border-gray-200 bg-white p-4">

      <p className="text-xs text-gray-500">{titre}</p>

      <p className="mt-1 text-xl font-bold">{valeur}</p>

    </div>

  );

}
