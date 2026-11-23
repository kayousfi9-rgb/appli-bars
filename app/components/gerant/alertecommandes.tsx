"use client";


import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import { formaterEuros } from "../../lib/commandes";
import { nomOffreLiee, type Lie, type OffreLiee } from "../../lib/equipe";


type Props = { barId: string };


type LigneCommande = {
  id: string;
  prix_paye: number;
  created_at: string;
  expire_le: string | null;
  offres: Lie<OffreLiee>;
};


const COLONNES = "id, prix_paye, created_at, expire_le, offres(produit, nom_plat, categorie)";


function heure(iso: string | null): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" }).format(
    new Date(iso)
  );
}


export default function AlerteCommandes({ barId }: Props) {
  const [aServir, setAServir] = useState<LigneCommande[]>([]);
  const [alertes, setAlertes] = useState<LigneCommande[]>([]);
  const [son, setSon] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const sonActif = useRef(false);


  // Un petit « bip-bip » fabriqué par le navigateur (aucun fichier son)
  const bip = useCallback(() => {
    const contexte = audio.current;
    if (!contexte || !sonActif.current) return;
    [0, 0.25].forEach((decalage) => {
      const oscillateur = contexte.createOscillator();
      const volume = contexte.createGain();
      oscillateur.frequency.value = 880;
      volume.gain.value = 0.2;
      oscillateur.connect(volume);
      volume.connect(contexte.destination);
      oscillateur.start(contexte.currentTime + decalage);
      oscillateur.stop(contexte.currentTime + decalage + 0.15);
    });
  }, []);


  const charger = useCallback(async (): Promise<LigneCommande[]> => {
    const { data } = await supabase
      .from("commandes")
      .select(COLONNES)
      .eq("bar_id", barId)
      .eq("statut", "payee")
      .gt("expire_le", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(30);
    const liste = (data ?? []) as unknown as LigneCommande[];
    setAServir(liste);
    return liste;
  }, [barId]);


  useEffect(() => {
    charger();
    // on enlève les commandes expirées de la liste, même sans nouvelle commande
    const minuteur = setInterval(charger, 60000);


    const canal = supabase
      .channel("commandes-" + barId)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "commandes", filter: "bar_id=eq." + barId },
        async (charge) => {
          const idNouvelle = (charge.new as { id?: string }).id;
          const liste = await charger();
          const nouvelle = liste.find((c) => c.id === idNouvelle);
          if (nouvelle) setAlertes((avant) => [nouvelle, ...avant].slice(0, 3));
          bip();
          if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate([200, 100, 200]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "commandes", filter: "bar_id=eq." + barId },
        () => {
          charger();
        }
      )
      .subscribe();


    return () => {
      clearInterval(minuteur);
      supabase.removeChannel(canal);
    };
  }, [barId, charger, bip]);


  function activerSon() {
    const Contexte =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Contexte) return;
    audio.current = new Contexte();
    sonActif.current = true;
    setSon(true);
    bip();
  }


  return (
    <section className="space-y-3">
      {alertes.map((a) => (
        <div key={a.id} className="rounded-xl border-4 border-[#007F77] bg-[#E6F6F5] p-4 text-[#14193C]">
          <p className="text-lg font-extrabold">{"🔔 Nouvelle commande !"}</p>
          <p className="mt-1">{nomOffreLiee(a.offres) + " · " + formaterEuros(a.prix_paye)}</p>
          <p className="text-sm">{"Le client viendra la chercher avec son QR code."}</p>
          <button
            type="button"
            onClick={() => setAlertes((avant) => avant.filter((x) => x.id !== a.id))}
            className="mt-2 rounded-full bg-[#007F77] px-4 py-1.5 text-sm font-bold text-white"
          >
            OK
          </button>
        </div>
      ))}


      {!son && (
        <button
          type="button"
          onClick={activerSon}
          className="w-full rounded-full border border-[#007F77] px-4 py-2 text-sm font-semibold text-[#007F77]"
        >
          {"🔔 Activer le son des alertes"}
        </button>
      )}
      {son && <p className="text-xs text-[#5B607E]">{"Son activé : garde cette page ouverte au comptoir."}</p>}


      <div className="rounded-xl border border-[#E7DDC8] bg-[#FFF4E2] p-3">
        <p className="font-bold">{"À servir (" + aServir.length + ")"}</p>
        {aServir.length === 0 && <p className="mt-1 text-sm">Aucune commande en attente.</p>}
        <ul className="mt-1 space-y-1 text-sm">
          {aServir.map((c) => (
            <li key={c.id}>
              {"• " + nomOffreLiee(c.offres) + " · " + formaterEuros(c.prix_paye) + " · commandée à " + heure(c.created_at)}
              {c.expire_le ? " · valable jusqu'à " + heure(c.expire_le) : ""}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
