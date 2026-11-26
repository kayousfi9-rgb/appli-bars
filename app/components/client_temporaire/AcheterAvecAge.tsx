"use client";


import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { VERSION_CONDITIONS } from "../../lib/conditions";
import BoutonAcheter from "../BoutonAcheter";


type Props = { offreId: string; avecAlcool: boolean };


// Pour une offre sans alcool : le bouton Acheter habituel, rien de plus.
// Pour une boisson alcoolisée : une case « J'ai 18 ans ou plus » à cocher une seule fois
// (la réponse est mémorisée sur le compte), puis le bouton Acheter apparaît.
export default function AcheterAvecAge({ offreId, avecAlcool }: Props) {
  const [pret, setPret] = useState(!avecAlcool);
  const [majeurConnu, setMajeurConnu] = useState(false);
  const [coche, setCoche] = useState(false);


  useEffect(() => {
    if (!avecAlcool) return;
    let actif = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const { data: lignes } = await supabase
          .from("consentements")
          .select("id")
          .eq("user_id", data.session.user.id)
          .eq("type", "majorite")
          .limit(1);
        if (actif && lignes && lignes.length > 0) setMajeurConnu(true);
      }
      if (actif) setPret(true);
    })();
    return () => {
      actif = false;
    };
  }, [avecAlcool]);


  async function cocher(valeur: boolean) {
    setCoche(valeur);
    if (!valeur) return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) return;
    await supabase
      .from("consentements")
      .upsert(
        [{ user_id: data.session.user.id, type: "majorite", version: VERSION_CONDITIONS }],
        { onConflict: "user_id,type,version", ignoreDuplicates: true }
      );
  }


  if (!avecAlcool || majeurConnu || coche) {
    return pret || coche ? <BoutonAcheter offreId={offreId} /> : null;
  }
  if (!pret) return null;


  return (
    <label className="flex items-start gap-3 text-sm font-semibold">
      <input
        type="checkbox"
        checked={coche}
        onChange={(e) => void cocher(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0"
      />
      <span>J'ai 18 ans ou plus. La vente d'alcool est interdite aux mineurs.</span>
    </label>
  );
}
