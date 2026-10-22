"use client";

import { useCallback, useEffect, useState } from "react";

import QRCode from "qrcode";

import { supabase } from "../../lib/supabase";

import {

  formaterDateHeure,

  formaterEuros,

  LIBELLES_STATUT,

  nomOffre,

  premier,

  statutReel,

} from "../../lib/commandes";

import type { CommandeClient, StatutCommande } from "../../lib/types";

const COULEURS: Record<StatutCommande, string> = {

  payee: "bg-blue-100 text-blue-800",

  recuperee: "bg-green-100 text-green-800",

  expiree: "bg-orange-100 text-orange-800",

};

export default function MesCommandes() {

  const [connecte, setConnecte] = useState<boolean | null>(null);

  const [commandes, setCommandes] = useState<CommandeClient[]>([]);

  const [images, setImages] = useState<Record<string, string>>({});

  const [message, setMessage] = useState<string | null>(null);

  // 1) Lire les commandes du client connecté.

  const charger = useCallback(async () => {

    const { data: session } = await supabase.auth.getSession();

    const idClient = session.session?.user.id;

    if (!idClient) {

      setConnecte(false);

      return;

    }

    setConnecte(true);

    const { data, error } = await supabase

      .from("commandes")

      .select(

        "id, prix_paye, statut, qr_token, created_at, expire_le, recuperee_le, offres(produit, nom_plat, categorie), bars(nom)"

      )

      .eq("client_id", idClient)

      .order("created_at", { ascending: false });

    if (error) {

      setMessage("Erreur : " + error.message);

      return;

    }

    const liste = (data as unknown as CommandeClient[]) ?? [];

    setCommandes(liste);

    // 2) Fabriquer l'image du QR code, seulement pour les commandes encore valables.

    const nouvelles: Record<string, string> = {};

    for (const c of liste) {

      if (statutReel(c.statut, c.expire_le) === "payee") {

        nouvelles[c.id] = await QRCode.toDataURL(c.qr_token, { width: 260, margin: 1 });

      }

    }

    setImages(nouvelles);

  }, []);

  useEffect(() => {

    charger();

  }, [charger]);

  // 3) Tant qu'une commande est à récupérer, on relit toutes les 15 secondes.

  const aRecuperer = commandes.some((c) => statutReel(c.statut, c.expire_le) === "payee");

  useEffect(() => {

    if (!aRecuperer) return;

    const minuteur = setInterval(charger, 15000);

    return () => clearInterval(minuteur);

  }, [aRecuperer, charger]);

  if (connecte === null) return <p className="text-gray-500">Chargement…</p>;

  if (!connecte) {

    return (

      <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-900">

        <p className="font-semibold">{"Connecte-toi pour voir tes commandes."}</p>

        <p className="mt-2 text-sm">

          <a href="/compte" className="underline">

            Aller sur Mon compte

          </a>

        </p>

      </div>

    );

  }

  return (

    <div className="space-y-4">

      {message && <p className="rounded bg-amber-50 p-3 text-sm text-amber-900">{message}</p>}

      {commandes.length === 0 && (

        <p className="text-sm text-gray-500">{"Tu n'as pas encore de commande."}</p>

      )}

      {commandes.map((c) => {

        const statut = statutReel(c.statut, c.expire_le);

        const bar = premier(c.bars);

        return (

          <div key={c.id} className="rounded-xl border border-gray-200 bg-white p-4">

            <div className="flex items-start justify-between gap-3">

              <div>

                <h2 className="text-lg font-semibold">{nomOffre(c.offres)}</h2>

                <p className="text-sm text-gray-600">{bar?.nom ?? "Bar"}</p>

                <p className="text-sm text-gray-600">{formaterEuros(c.prix_paye)}</p>

              </div>

              <span className={"shrink-0 rounded-full px-3 py-1 text-xs " + COULEURS[statut]}>

                {LIBELLES_STATUT[statut]}

              </span>

            </div>

            {statut === "payee" && (

              <div className="mt-4 text-center">

                {images[c.id] && (

                  // eslint-disable-next-line @next/next/no-img-element

                  <img

                    src={images[c.id]}

                    alt="QR code de retrait"

                    width={260}

                    height={260}

                    className="mx-auto"

                  />

                )}

                <p className="mt-2 text-sm font-medium">

                  {"À récupérer avant le " + formaterDateHeure(c.expire_le)}

                </p>

                <p className="mt-1 text-xs text-gray-500">

                  {"Montre ce QR code au comptoir. Code : "}

                  <span className="font-mono">{c.qr_token}</span>

                </p>

              </div>

            )}

            {statut === "recuperee" && (

              <p className="mt-3 text-sm text-green-700">

                {"Récupérée le " + formaterDateHeure(c.recuperee_le) + ". Santé !"}

              </p>

            )}

            {statut === "expiree" && (

              <p className="mt-3 text-sm text-orange-700">

                {"Cette commande n'a pas été récupérée à temps (limite : " +

                  formaterDateHeure(c.expire_le) +

                  ")."}

              </p>

            )}

          </div>

        );

      })}

    </div>

  );

}
