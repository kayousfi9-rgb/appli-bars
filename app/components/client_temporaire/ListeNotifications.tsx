"use client";

import { useEffect, useState } from "react";

import { supabase } from "../../lib/supabase";

import { formaterDateHeure } from "../../lib/commandes";

import type { NotificationClient } from "../../lib/types";

export default function ListeNotifications() {

  const [idClient, setIdClient] = useState<string | null>(null);

  const [pret, setPret] = useState(false);

  const [notifications, setNotifications] = useState<NotificationClient[]>([]);

  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {

    let annule = false;

    (async () => {

      const { data: session } = await supabase.auth.getSession();

      const id = session.session?.user.id ?? null;

      if (annule) return;

      setIdClient(id);

      if (!id) {

        setPret(true);

        return;

      }

      // 1) Les 50 dernières notifications.

      const { data, error } = await supabase

        .from("notifications")

        .select("id, titre, texte, lien, lue, cree_le")

        .eq("client_id", id)

        .order("cree_le", { ascending: false })

        .limit(50);

      if (annule) return;

      if (error) setMessage("Erreur : " + error.message);

      const liste = (data as NotificationClient[]) ?? [];

      setNotifications(liste);

      setPret(true);

      // 2) Elles sont maintenant vues : on les marque comme lues dans la base.

      //    (À l'écran, les nouvelles gardent leur point rose jusqu'à la prochaine visite.)

      if (liste.some((n) => !n.lue)) {

        await supabase

          .from("notifications")

          .update({ lue: true })

          .eq("client_id", id)

          .eq("lue", false);

      }

    })();

    return () => {

      annule = true;

    };

  }, []);

  async function toutEffacer() {

    if (!idClient) return;

    const sur = window.confirm("Effacer toutes tes notifications ?");

    if (!sur) return;

    const { error } = await supabase.from("notifications").delete().eq("client_id", idClient);

    if (error) {

      setMessage(error.message);

      return;

    }

    setNotifications([]);

  }

  if (!pret) return <p className="text-gray-500">Chargement…</p>;

  if (!idClient) return null;

  return (

    <section className="space-y-3">

      <div className="flex items-center justify-between">

        <h2 className="text-lg font-semibold">Dernières notifications</h2>

        {notifications.length > 0 && (

          <button

            type="button"

            onClick={toutEffacer}

            className="rounded-full border border-gray-300 px-3 py-1 text-xs"

          >

            Tout effacer

          </button>

        )}

      </div>

      {message && <p className="rounded bg-amber-50 p-3 text-sm text-amber-900">{message}</p>}

      {notifications.length === 0 ? (

        <p className="text-sm text-gray-500">

          {"Aucune notification pour l'instant. Règle tes préférences au-dessus pour être prévenu des nouvelles offres."}

        </p>

      ) : (

        <ul className="space-y-2">

          {notifications.map((n) => (

            <li key={n.id}>

              <a

                href={n.lien || "/"}

                className="flex gap-3 rounded-lg border border-gray-200 bg-white p-3 text-sm"

              >

                <span

                  className={

                    "mt-1.5 h-2 w-2 shrink-0 rounded-full " + (n.lue ? "bg-transparent" : "bg-rose-600")

                  }

                />

                <span>

                  <strong className="block">{n.titre}</strong>

                  <span className="block text-gray-700">{n.texte}</span>

                  <span className="mt-1 block text-xs text-gray-500">{formaterDateHeure(n.cree_le)}</span>

                </span>

              </a>

            </li>

          ))}

        </ul>

      )}

    </section>

  );

}
