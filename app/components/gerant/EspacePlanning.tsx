"use client";


import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import ModelesRecurrents from "./ModelesRecurrents";
import DupliquerOffres from "./DupliquerOffres";
import OffresEnCours from "./offresencours";
import LiensGerant from "./liensgerant";

type Etat =
  | { statut: "chargement" }
  | { statut: "deconnecte" }
  | { statut: "sansbar" }
  | { statut: "erreur"; message: string }
  | { statut: "pret"; barId: string | number; barNom: string };


export default function EspacePlanning() {
  const [etat, setEtat] = useState<Etat>({ statut: "chargement" });


  useEffect(() => {
    let annule = false;
    async function charger() {
      const { data: session } = await supabase.auth.getSession();
      const utilisateur = session.session?.user;
      if (!utilisateur) {
        if (!annule) setEtat({ statut: "deconnecte" });
        return;
      }
      const { data, error } = await supabase
        .from("bars")
        .select("id, nom")
        .eq("owner_id", utilisateur.id)
        .limit(1);
      if (annule) return;
      if (error) {
        setEtat({ statut: "erreur", message: error.message });
        return;
      }
      const bar = data?.[0];
      if (!bar) {
        setEtat({ statut: "sansbar" });
        return;
      }
      setEtat({ statut: "pret", barId: bar.id, barNom: bar.nom });
    }
    charger();
    return () => {
      annule = true;
    };
  }, []);


  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-white p-4 pb-16 text-[#14193C]">
      <Link href="/gerant" className="text-sm font-semibold text-[#007F77] underline">
        ← Retour à mon espace
      </Link>
      <h1 className="mt-3 text-2xl font-extrabold">Planning des offres</h1>
      <LiensGerant />


      {etat.statut === "chargement" && <p className="mt-4 text-sm">Chargement…</p>}


      {etat.statut === "deconnecte" && (
        <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm">
          Tu n'es pas connecté. Va sur <Link href="/gerant" className="font-semibold underline">ton espace gérant</Link>, connecte-toi, puis reviens ici.
        </p>
      )}


      {etat.statut === "sansbar" && (
        <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm">
          Aucun établissement n'est rattaché à ton compte. Crée-le d'abord dans ton espace gérant.
        </p>
      )}


      {etat.statut === "erreur" && (
        <p className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {"Erreur : " + etat.message}
        </p>
      )}


      {etat.statut === "pret" && (
        <>
          <p className="mt-1 text-sm text-[#5B607E]">{etat.barNom}</p>
          <OffresEnCours barId={etat.barId} />
          <ModelesRecurrents barId={etat.barId} />
          <DupliquerOffres barId={etat.barId} />
        </>
      )}
    </main>
  );
}
