"use client";

import { useEffect, useState } from "react";

import type { User } from "@supabase/supabase-js";

import { supabase } from "../../lib/supabase";

import type { ProfilClient } from "../../lib/types";

import ConnexionClient from "./ConnexionClient";

import CompleterProfil from "./CompleterProfil";

import MonCompte from "./MonCompte";

export default function EspaceClient() {

  const [utilisateur, setUtilisateur] = useState<User | null>(null);

  const [pret, setPret] = useState(false);

  const [profil, setProfil] = useState<ProfilClient | null>(null);

  const [chargementProfil, setChargementProfil] = useState(false);

  // 1) Qui est connecté ?

  useEffect(() => {

    supabase.auth.getSession().then(({ data }) => {

      setUtilisateur(data.session?.user ?? null);

      setPret(true);

    });

    const { data: abonnement } = supabase.auth.onAuthStateChange(

      (_evenement, session) => {

        setUtilisateur(session?.user ?? null);

      }

    );

    return () => abonnement.subscription.unsubscribe();

  }, []);

  // 2) A-t-il déjà une fiche client ? Sinon, on la crée avec les infos

  //    données à l'inscription.

  const idUtilisateur = utilisateur?.id ?? null;

  const metaPrenom = utilisateur?.user_metadata?.prenom as string | undefined;

  const metaNaissance = utilisateur?.user_metadata?.date_naissance as

    | string

    | undefined;

  useEffect(() => {

    if (!idUtilisateur) {

      setProfil(null);

      return;

    }

    let annule = false;

    (async () => {

      setChargementProfil(true);

      const { data } = await supabase

        .from("clients")

        .select("id, prenom, date_naissance, cgu_acceptees")

        .eq("id", idUtilisateur)

        .limit(1);

      if (annule) return;

      if (data && data.length > 0) {

        setProfil(data[0] as ProfilClient);

        setChargementProfil(false);

        return;

      }

      if (metaPrenom && metaNaissance) {

        const { data: cree } = await supabase

          .from("clients")

          .insert({

            id: idUtilisateur,

            prenom: metaPrenom,

            date_naissance: metaNaissance,

            cgu_acceptees: true,

          })

          .select("id, prenom, date_naissance, cgu_acceptees")

          .single();

        if (!annule && cree) setProfil(cree as ProfilClient);

      }

      if (!annule) setChargementProfil(false);

    })();

    return () => {

      annule = true;

    };

  }, [idUtilisateur, metaPrenom, metaNaissance]);

  if (!pret) return <p className="text-gray-500">Chargement…</p>;

  if (!utilisateur) return <ConnexionClient />;

  if (chargementProfil)

    return <p className="text-gray-500">Chargement de ton compte…</p>;

  if (!profil) {

    return <CompleterProfil idUtilisateur={utilisateur.id} onCree={setProfil} />;

  }

  return <MonCompte profil={profil} email={utilisateur.email ?? ""} />;

}

