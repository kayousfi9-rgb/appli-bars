"use client";

import { useEffect, useState } from "react";

import { supabase } from "../../lib/supabase";

import QRCode from "qrcode";

type Commande = {

  id: string;

  prix_paye: number;

  statut: string;

  qr_token: string;

  created_at: string;

  offres: { produit: string; nom_plat: string | null; categorie: string } | null;

  bars: { nom: string } | null;

};

export default function MesCommandes() {

  const [commandes, setCommandes] = useState<Commande[]>([]);

  const [images, setImages] = useState<Record<string, string>>({});

  useEffect(() => {

    async function charger() {

      const { data } = await supabase

        .from("commandes")

        .select("id, prix_paye, statut, qr_token, created_at, offres(produit, nom_plat, categorie), bars(nom)")

        .order("created_at", { ascending: false });

const liste = (data as unknown as Commande[]) || [];

      setCommandes(liste);

      const nouvelles: Record<string, string> = {};

      for (const commande of liste) {

        nouvelles[commande.id] = await QRCode.toDataURL(commande.qr_token);

      }

      setImages(nouvelles);

    }

    charger();

  }, []);

  return (

    <div>

      <h1>Mes commandes</h1>

      {commandes.length === 0 && <p>Tu n'as pas encore de commande.</p>}

      {commandes.map((commande) => (

        <div key={commande.id}>

          <h2>

            {commande.offres?.categorie === "plat"

              ? commande.offres?.nom_plat

              : commande.offres?.produit}

          </h2>

          <p>{commande.bars?.nom}</p>

          <p>{commande.prix_paye} €</p>

          <p>Statut : {commande.statut}</p>

          {commande.statut === "payee" && images[commande.id] && (

            <img src={images[commande.id]} alt="QR code de retrait" width={200} />

          )}

        </div>

      ))}

    </div>

  );

}
