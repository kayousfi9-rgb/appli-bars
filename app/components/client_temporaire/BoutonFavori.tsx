"use client";

import { useEffect, useState } from "react";

import { supabase } from "../../lib/supabase";

export default function BoutonFavori({ barId }: { barId: string | number }) {

  const [clientId, setClientId] = useState<string | null>(null);

  const [favori, setFavori] = useState(false);

  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {

    let annule = false;

    (async () => {

      const { data } = await supabase.auth.getSession();

      const id = data.session?.user.id ?? null;

      if (annule) return;

      setClientId(id);

      if (!id) return;

      const { data: trouve } = await supabase

        .from("favoris")

        .select("bar_id")

        .eq("client_id", id)

        .eq("bar_id", barId)

        .limit(1);

      if (!annule) setFavori((trouve?.length ?? 0) > 0);

    })();

    return () => {

      annule = true;

    };

  }, [barId]);

  async function basculer() {

    setMessage(null);

    if (!clientId) {

      setMessage("Connecte-toi pour enregistrer tes favoris.");

      return;

    }

    if (favori) {

      const { error } = await supabase

        .from("favoris")

        .delete()

        .eq("client_id", clientId)

        .eq("bar_id", barId);

      if (error) {

        setMessage(error.message);

        return;

      }

      setFavori(false);

    } else {

      const { error } = await supabase

        .from("favoris")

        .insert({ client_id: clientId, bar_id: barId });

      if (error) {

        setMessage("Impossible. Ouvre « Mon compte » pour terminer ton inscription.");

        return;

      }

      setFavori(true);

    }

  }

  return (

    <span className="flex items-center gap-2">

      <button

        type="button"

        onClick={basculer}

        aria-label={favori ? "Retirer des favoris" : "Ajouter aux favoris"}

        className="text-lg leading-none"

      >

        {favori ? "Favori" : "Ajouter"}

      </button>

      {message && <span className="text-xs text-gray-500">{message}</span>}

    </span>

  );

}
