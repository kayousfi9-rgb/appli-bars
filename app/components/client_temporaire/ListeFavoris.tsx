"use client";

import { useCallback, useEffect, useState } from "react";

import { supabase } from "../../lib/supabase";

import type { FavoriAffiche } from "../../lib/types";

export default function ListeFavoris() {

  const [connecte, setConnecte] = useState<boolean | null>(null);

  const [idClient, setIdClient] = useState<string | null>(null);

  const [favoris, setFavoris] = useState<FavoriAffiche[]>([]);

  const [message, setMessage] = useState<string | null>(null);

  const charger = useCallback(async (id: string) => {

    const { data, error } = await supabase

      .from("favoris")

      .select("bar_id, bars(nom, adresse)")

      .eq("client_id", id)

      .order("cree_le", { ascending: false });

    if (error) setMessage("Erreur : " + error.message);

    setFavoris((data as unknown as FavoriAffiche[]) ?? []);

  }, []);

  useEffect(() => {

    let annule = false;

    (async () => {

      const { data: session } = await supabase.auth.getSession();

      const id = session.session?.user.id ?? null;

      if (annule) return;

      setIdClient(id);

      setConnecte(Boolean(id));

      if (id) await charger(id);

    })();

    return () => {

      annule = true;

    };

  }, [charger]);

  async function retirer(barId: string | number) {

    if (!idClient) return;

    setMessage(null);

    const { error } = await supabase

      .from("favoris")

      .delete()

      .eq("client_id", idClient)

      .eq("bar_id", barId);

    if (error) {

      setMessage(error.message);

      return;

    }

    charger(idClient);

  }

  if (connecte === null) return <p className="text-gray-500">Chargement…</p>;

  if (!connecte) {

    return (

      <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-900">

        <p className="font-semibold">{"Connecte-toi pour voir tes favoris."}</p>

        <p className="mt-2 text-sm">

          <a href="/compte" className="underline">

            Aller sur le profil

          </a>

        </p>

      </div>

    );

  }

  return (

    <div className="space-y-3">

      {message && <p className="rounded bg-amber-50 p-3 text-sm text-amber-900">{message}</p>}

      {favoris.length === 0 ? (

        <p className="text-sm text-gray-500">

          {"Aucun favori pour l'instant. Appuie sur le cœur d'un bar dans la liste."}

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

                <span className="block text-xs text-gray-500">{f.bars?.adresse ?? ""}</span>

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

    </div>

  );

}

