"use client";

import { useEffect, useState } from "react";

import { supabase } from "../../lib/supabase";

export default function LiensCompte() {

  const [nonLues, setNonLues] = useState(0);

  // On compte les notifications non lues, sans les télécharger.

  useEffect(() => {

    let annule = false;

    (async () => {

      const { data: session } = await supabase.auth.getSession();

      const id = session.session?.user.id;

      if (!id) return;

      const { count } = await supabase

        .from("notifications")

        .select("id", { count: "exact", head: true })

        .eq("client_id", id)

        .eq("lue", false);

      if (!annule) setNonLues(count ?? 0);

    })();

    return () => {

      annule = true;

    };

  }, []);

  return (

    <section className="grid gap-3 sm:grid-cols-2">

      <a

        href="/compte/notifications"

        className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 font-semibold"

      >

        <span>Mes notifications</span>

        {nonLues > 0 && (

          <span className="rounded-full bg-rose-600 px-2 py-0.5 text-xs text-white">{nonLues}</span>

        )}

      </a>

      <a

        href="/compte/bars-visites"

        className="rounded-xl border border-gray-200 bg-white p-4 font-semibold"

      >

        Mes bars visités

      </a>

    </section>

  );

}
