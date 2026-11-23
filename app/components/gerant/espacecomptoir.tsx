"use client";


import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { chargerMonEtablissement, type MonEtablissement } from "../../lib/equipe";
import ConnexionEquipe from "./conexionequipe";
import AlerteCommandes from "./alertecommandes";
import ScanComptoir from "./scancomptoir";
import LiensGerant from "./liensgerant";


type Etat =
  | { statut: "chargement" }
  | { statut: "deconnecte" }
  | { statut: "sansrattachement" }
  | { statut: "pret"; etablissement: MonEtablissement };


export default function EspaceComptoir() {
  const [etat, setEtat] = useState<Etat>({ statut: "chargement" });


  const charger = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setEtat({ statut: "deconnecte" });
      return;
    }
    const etablissement = await chargerMonEtablissement();
    setEtat(etablissement ? { statut: "pret", etablissement } : { statut: "sansrattachement" });
  }, []);


  useEffect(() => {
    charger();
  }, [charger]);


  async function seDeconnecter() {
    await supabase.auth.signOut();
    setEtat({ statut: "deconnecte" });
  }


  return (
    <main className="mx-auto min-h-screen max-w-md bg-white p-4 pb-16 text-gray-900">
      <h1 className="text-2xl font-extrabold">Comptoir</h1>


      {etat.statut === "chargement" && <p className="mt-4 text-sm">Chargement…</p>}


      {etat.statut === "deconnecte" && (
        <div className="mt-4">
          <ConnexionEquipe onConnecte={charger} />
        </div>
      )}


      {etat.statut === "sansrattachement" && (
        <div className="mt-4 space-y-3">
          <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm">
            Ce compte n'est rattaché à aucun établissement. Demande au gérant de te créer un compte serveur, ou connecte-toi avec le compte gérant.
          </p>
          <button type="button" onClick={seDeconnecter} className="rounded-full border border-gray-400 px-4 py-2 text-sm">
            Se déconnecter
          </button>
        </div>
      )}


      {etat.statut === "pret" && (
        <div className="mt-2 space-y-5">
          <p className="text-sm text-gray-600">
            {etat.etablissement.nom + " · " + (etat.etablissement.role === "gerant" ? "gérant" : "serveur")}
          </p>
          {etat.etablissement.role === "gerant" && <LiensGerant />}
          <AlerteCommandes barId={etat.etablissement.id} />
          <ScanComptoir />
          <button type="button" onClick={seDeconnecter} className="rounded-full border border-gray-400 px-4 py-2 text-sm">
            Se déconnecter
          </button>
        </div>
      )}
    </main>
  );
}
