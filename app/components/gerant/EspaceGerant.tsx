"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import type { BarGerant } from "../../lib/types";
import Connexion from "./Connexion";
import CreerBar from "./CreerBar";
import TableauDeBord from "./TableauDeBord";

export default function EspaceGerant() {
  const [utilisateur, setUtilisateur] = useState<User | null>(null);
  const [pret, setPret] = useState(false);
  const [bar, setBar] = useState<BarGerant | null>(null);
  const [chargementBar, setChargementBar] = useState(false);

  // 1) Qui est connecté ?
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUtilisateur(data.session?.user ?? null);
      setPret(true);
    });

    const { data: abonnement } = supabase.auth.onAuthStateChange((_evenement, session) => {
      setUtilisateur(session?.user ?? null);
    });

    return () => abonnement.subscription.unsubscribe();
  }, []);

  // 2) A-t-il déjà une fiche de bar ?
  const idUtilisateur = utilisateur?.id ?? null;

  useEffect(() => {
    if (!idUtilisateur) {
      setBar(null);
      return;
    }
    let annule = false;
    (async () => {
      setChargementBar(true);
      const { data } = await supabase
        .from("bars")
.select("id, nom, adresse, verifie, stripe_account_id, stripe_onboarding_complete")
        .eq("owner_id", idUtilisateur)
        .limit(1);
      if (!annule) {
        setBar((data?.[0] as BarGerant) ?? null);
        setChargementBar(false);
      }
    })();
    return () => {
      annule = true;
    };
  }, [idUtilisateur]);

  if (!pret) return <p className="text-gray-500">Chargement…</p>;
  if (!utilisateur) return <Connexion />;
  if (chargementBar) return <p className="text-gray-500">Chargement de ton bar…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>Connecté : {utilisateur.email}</span>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="rounded-full border border-gray-300 px-3 py-1"
        >
          Me déconnecter
        </button>
      </div>

      {bar ? <TableauDeBord bar={bar} /> : <CreerBar utilisateur={utilisateur} onCree={setBar} />}
    </div>
  );
}
