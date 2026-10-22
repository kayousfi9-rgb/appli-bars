"use client";

import { useCallback, useEffect, useState } from "react";

import { supabase } from "../../lib/supabase";

import type { FavoriAffiche, ProfilClient } from "../../lib/types";

type Props = { profil: ProfilClient; email: string };

export default function MonCompte({ profil, email }: Props) {

  const [favoris, setFavoris] = useState<FavoriAffiche[]>([]);

  const [message, setMessage] = useState<string | null>(null);

  const [chargement, setChargement] = useState(true);

  const charger = useCallback(async () => {

    setChargement(true);

    const { data, error } = await supabase

      .from("favoris")

      .select("bar_id, bars(nom, adresse)")

      .eq("client_id", profil.id)

      .order("cree_le", { ascending: false });

    if (error) setMessage("Erreur : " + error.message);

    setFavoris((data as unknown as FavoriAffiche[]) ?? []);

    setChargement(false);

  }, [profil.id]);

  useEffect(() => {

    charger();

  }, [charger]);

  async function retirer(barId: string | number) {

    setMessage(null);

    const { error } = await supabase

      .from("favoris")

      .delete()

      .eq("client_id", profil.id)

      .eq("bar_id", barId);

    if (error) {

      setMessage(error.message);

      return;

    }

    charger();

  }

  async function supprimerMesDonnees() {

    const sur = window.confirm(

      "Supprimer ton profil et tes favoris ? Cette action est définitive."

    );

    if (!sur) return;

    const { error } = await supabase.from("clients").delete().eq("id", profil.id);

    if (error) {

      setMessage(error.message);

      return;

    }

    await supabase.auth.signOut();

  }

  return (

    <div className="space-y-8">

      <section className="rounded-xl border border-gray-200 bg-white p-5">

        <h2 className="text-lg font-semibold">Bonjour {profil.prenom}</h2>

        <p className="mt-1 text-sm text-gray-600">{email}</p>

        <div className="mt-4 flex flex-wrap gap-3">

          <button

            type="button"

            onClick={() => supabase.auth.signOut()}

            className="rounded-full border border-gray-300 px-4 py-2 text-sm"

          >

            Me déconnecter

          </button>

          <button

            type="button"

            onClick={supprimerMesDonnees}

            className="rounded-full border border-red-300 px-4 py-2 text-sm text-red-600"

          >

            Supprimer mes données

          </button>

        </div>

      </section>

      {message && (

        <p className="rounded bg-amber-50 p-3 text-sm text-amber-900">{message}</p>

      )}

      <section>

        <h2 className="mb-2 text-lg font-semibold">

          Mes bars favoris ({favoris.length})

        </h2>

        {chargement ? (

          <p className="text-sm text-gray-500">Chargement…</p>

        ) : favoris.length === 0 ? (

          <p className="text-sm text-gray-500">

            Aucun favori pour l&apos;instant. Appuie sur le cœur d&apos;un bar

            depuis la page d&apos;accueil.

          </p>

        ) : (

          <ul className="space-y-2">

            {favoris.map((f) => (

              <li

                key={String(f.bar_id)}

                className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white p-3 text-sm"

              >

                <span>

                  <strong>{f.bars?.nom ?? "Bar"}</strong>

                  <span className="block text-xs text-gray-500">

                    {f.bars?.adresse ?? ""}

                  </span>

                </span>

                <button

                  type="button"

                  onClick={() => retirer(f.bar_id)}

                  className="shrink-0 rounded-full border border-gray-300 px-3 py-1 text-xs"

                >

                  Retirer

                </button>

              </li>

            ))}

          </ul>

        )}

      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5">

        <h2 className="text-lg font-semibold">Mes commandes</h2>

        <p className="mt-1 text-sm text-gray-600">

          Tes commandes et tes QR codes apparaîtront ici dès que le paiement sera

          en place.
<a

          href="/compte/commandes"

          className="mt-3 inline-block rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white"

        >

          Voir mes commandes et mes QR codes

        </a>

        </p>

      </section>

    </div>

  );

}
