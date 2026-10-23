"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { chargerMonBar, formaterEuros, nomOffre, premier } from "../../lib/commandes";
import type { MonBar, VenteStat } from "../../lib/types";

// Les périodes proposées au gérant.
const PERIODES = [
  { jours: 7, libelle: "7 jours" },
  { jours: 30, libelle: "30 jours" },
  { jours: 90, libelle: "3 mois" },
];

const JOURS_COURTS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const JOURS_LONGS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

type Barre = { libelle: string; valeur: number };

// ---------- Petits outils de dates ----------

// 2026-10-22 : sert de « clé » pour regrouper les ventes par jour.
function cleJour(d: Date): string {
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

// 22/10 : ce qu'on affiche sous les barres.
function libelleJour(d: Date): string {
  return String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0");
}

// Lundi = 0, mardi = 1… dimanche = 6 (en JavaScript, dimanche vaut 0 : on décale).
function indexJourSemaine(d: Date): number {
  return (d.getDay() + 6) % 7;
}

// Le lundi de la semaine d'une date (pour regrouper par semaine sur 3 mois).
function debutSemaine(d: Date): Date {
  const copie = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  copie.setDate(copie.getDate() - indexJourSemaine(copie));
  return copie;
}

// Le premier jour de la période choisie, à minuit.
// La date de référence est TOUJOURS fournie par l'appelant : cette fonction
// ne lit jamais l'heure elle-même (Next.js l'interdit pendant l'affichage).
function debutPeriode(jours: number, reference: Date): Date {
  const debut = new Date(reference.getTime());
  debut.setHours(0, 0, 0, 0);
  debut.setDate(debut.getDate() - (jours - 1));
  return debut;
}

export default function StatistiquesBar() {
  const [pret, setPret] = useState(false);
  const [bar, setBar] = useState<MonBar | null>(null);
  const [periode, setPeriode] = useState(30);
  const [ventes, setVentes] = useState<VenteStat[]>([]);
  const [nbFavoris, setNbFavoris] = useState<number | null>(null);
  const [chargement, setChargement] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // L'heure actuelle, lue UNE fois dans le navigateur, après l'affichage.
  const [maintenant, setMaintenant] = useState<number | null>(null);

  useEffect(() => {
    setMaintenant(Date.now());
  }, []);

  // 1) Lire les ventes de la période choisie.
  const charger = useCallback(async (barId: string | number, jours: number) => {
    setChargement(true);
    setMessage(null);
    const { data, error } = await supabase
      .from("commandes")
      .select("id, prix_paye, commission, statut, created_at, offres(produit, nom_plat, categorie)")
      .eq("bar_id", barId)
      .gte("created_at", debutPeriode(jours, new Date()).toISOString())
      .order("created_at", { ascending: true })
      .limit(1000);
    if (error) setMessage("Erreur : " + error.message);
    setVentes((data as unknown as VenteStat[]) ?? []);
    setChargement(false);
  }, []);

  // 2) Au chargement : le bar du gérant, et le nombre de favoris.
  useEffect(() => {
    let annule = false;
    (async () => {
      const monBar = await chargerMonBar();
      if (annule) return;
      setBar(monBar);
      setPret(true);
      if (monBar) {
        const { data } = await supabase.rpc("compter_favoris_mon_bar");
        if (!annule) setNbFavoris(typeof data === "number" ? data : null);
      }
    })();
    return () => {
      annule = true;
    };
  }, []);

  // 3) À chaque changement de période : on relit les ventes.
  useEffect(() => {
    if (bar) charger(bar.id, periode);
  }, [bar, periode, charger]);

  // 4) Tous les calculs, refaits seulement quand les ventes ou la période changent.
  const stats = useMemo(() => {
    if (maintenant === null) return null;

    let ca = 0;
    let commission = 0;
    let recuperees = 0;
    let expirees = 0;
    const parHeure = new Array<number>(24).fill(0);
    const parJourSemaine = new Array<number>(7).fill(0);
    const parCategorie: Record<"boisson" | "plat", { nombre: number; ca: number }> = {
      boisson: { nombre: 0, ca: 0 },
      plat: { nombre: 0, ca: 0 },
    };
    const parOffre = new Map<string, number>();
    const parPeriode = new Map<string, number>();
    const parSemaine = periode > 30;

    for (const v of ventes) {
      const prix = Number(v.prix_paye);
      ca += prix;
      commission += Number(v.commission);
      if (v.statut === "recuperee") recuperees += 1;
      if (v.statut === "expiree") expirees += 1;

      const date = new Date(v.created_at);
      parHeure[date.getHours()] += 1;
      parJourSemaine[indexJourSemaine(date)] += 1;

      const categorie: "boisson" | "plat" =
        premier(v.offres)?.categorie === "plat" ? "plat" : "boisson";
      parCategorie[categorie].nombre += 1;
      parCategorie[categorie].ca += prix;

      const nom = nomOffre(v.offres);
      parOffre.set(nom, (parOffre.get(nom) ?? 0) + 1);

      const cle = parSemaine ? cleJour(debutSemaine(date)) : cleJour(date);
      parPeriode.set(cle, (parPeriode.get(cle) ?? 0) + 1);
    }

    // L'axe du temps complet, y compris les jours sans aucune vente.
    const evolution: Barre[] = [];
    const aujourdhui = new Date(maintenant);
    const debut = debutPeriode(periode, aujourdhui);

    if (parSemaine) {
      let semaine = debutSemaine(debut);
      while (semaine <= aujourdhui) {
        evolution.push({
          libelle: libelleJour(semaine),
          valeur: parPeriode.get(cleJour(semaine)) ?? 0,
        });
        semaine = new Date(semaine.getFullYear(), semaine.getMonth(), semaine.getDate() + 7);
      }
    } else {
      for (let i = 0; i < periode; i++) {
        const jour = new Date(debut.getFullYear(), debut.getMonth(), debut.getDate() + i);
        evolution.push({ libelle: libelleJour(jour), valeur: parPeriode.get(cleJour(jour)) ?? 0 });
      }
    }

    const nombre = ventes.length;
    const maxHeure = Math.max(...parHeure);
    const maxJour = Math.max(...parJourSemaine);
    const termines = recuperees + expirees;

    return {
      nombre,
      ca,
      net: ca - commission,
      panierMoyen: nombre > 0 ? ca / nombre : 0,
      tauxRecuperation: termines > 0 ? Math.round((recuperees * 100) / termines) : null,
      evolution,
      heures: parHeure.map((n, h) => ({ libelle: h + "h", valeur: n })),
      jours: parJourSemaine.map((n, i) => ({ libelle: JOURS_COURTS[i], valeur: n })),
      meilleureHeure: nombre > 0 ? parHeure.indexOf(maxHeure) : null,
      meilleurJour: nombre > 0 ? parJourSemaine.indexOf(maxJour) : null,
      parCategorie,
      top: Array.from(parOffre.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
      parSemaine,
    };
  }, [ventes, periode, maintenant]);

  if (!pret || !stats) return <p className="text-gray-500">Chargement…</p>;

  if (!bar) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-900">
        <p className="font-semibold">{"Tu n'es pas connecté en tant que gérant."}</p>
        <p className="mt-2 text-sm">
          <a href="/gerant" className="underline">
            {"Connecte-toi dans l'espace gérant"}
          </a>
        </p>
      </div>
    );
  }

  const totalCategories = stats.parCategorie.boisson.nombre + stats.parCategorie.plat.nombre;
  const partBoisson =
    totalCategories > 0 ? Math.round((stats.parCategorie.boisson.nombre * 100) / totalCategories) : 0;

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">
        Bar : <strong>{bar.nom}</strong>
      </p>

      {/* LE CHOIX DE LA PÉRIODE */}
      <div className="flex flex-wrap gap-2">
        {PERIODES.map((p) => (
          <button
            key={p.jours}
            type="button"
            onClick={() => setPeriode(p.jours)}
            disabled={chargement}
            className={
              "rounded-full border px-3 py-1 text-sm disabled:opacity-50 " +
              (periode === p.jours
                ? "border-rose-600 bg-rose-600 text-white"
                : "border-gray-300 bg-white text-gray-700")
            }
          >
            {p.libelle}
          </button>
        ))}
      </div>

      {message && <p className="rounded bg-amber-50 p-3 text-sm text-amber-900">{message}</p>}

      {/* LES CHIFFRES CLÉS */}
      <section className="grid grid-cols-2 gap-3">
        <Case titre="Ventes" valeur={String(stats.nombre)} />
        <Case titre="Chiffre d'affaires" valeur={formaterEuros(stats.ca)} />
        <Case titre="Net pour le bar" valeur={formaterEuros(stats.net)} />
        <Case titre="Panier moyen" valeur={formaterEuros(stats.panierMoyen)} />
        <Case
          titre="Commandes récupérées"
          valeur={stats.tauxRecuperation === null ? "—" : stats.tauxRecuperation + " %"}
        />
        <Case titre="Clients qui te suivent" valeur={nbFavoris === null ? "—" : String(nbFavoris)} />
      </section>

      {/* LES CONSEILS AUTOMATIQUES */}
      {stats.nombre > 0 && (
        <section className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          <p className="font-semibold">Ce qui marche chez toi</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {stats.meilleureHeure !== null && (
              <li>
                {"Ton heure la plus forte : entre " +
                  stats.meilleureHeure +
                  "h et " +
                  ((stats.meilleureHeure + 1) % 24) +
                  "h."}
              </li>
            )}
            {stats.meilleurJour !== null && (
              <li>{"Ton meilleur jour : le " + JOURS_LONGS[stats.meilleurJour] + "."}</li>
            )}
            {stats.top.length > 0 && (
              <li>{"Ton offre star : " + stats.top[0][0] + " (" + stats.top[0][1] + " ventes)."}</li>
            )}
          </ul>
        </section>
      )}

      {/* LES GRAPHIQUES */}
      <Graphique
        titre={stats.parSemaine ? "Ventes par semaine" : "Ventes par jour"}
        barres={stats.evolution}
        pasLibelle={stats.parSemaine ? 2 : periode > 7 ? 5 : 1}
      />
      <Graphique titre="Ventes selon l'heure d'achat" barres={stats.heures} pasLibelle={3} />
      <Graphique titre="Ventes selon le jour de la semaine" barres={stats.jours} pasLibelle={1} />

      {/* BOISSON OU PLAT */}
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold">Boisson ou plat</h2>
        {totalCategories === 0 ? (
          <p className="text-sm text-gray-500">Pas encore de vente sur cette période.</p>
        ) : (
          <>
            <div className="flex h-4 w-full overflow-hidden rounded-full bg-amber-400">
              <div className="h-full bg-rose-500" style={{ width: partBoisson + "%" }} />
            </div>
            <div className="mt-2 flex justify-between text-xs text-gray-600">
              <span>
                {"Boissons : " +
                  stats.parCategorie.boisson.nombre +
                  " (" +
                  formaterEuros(stats.parCategorie.boisson.ca) +
                  ")"}
              </span>
              <span>
                {"Plats : " +
                  stats.parCategorie.plat.nombre +
                  " (" +
                  formaterEuros(stats.parCategorie.plat.ca) +
                  ")"}
              </span>
            </div>
          </>
        )}
      </section>

      {/* LE CLASSEMENT DES OFFRES */}
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold">Tes offres qui marchent le mieux</h2>
        {stats.top.length === 0 ? (
          <p className="text-sm text-gray-500">Pas encore de vente sur cette période.</p>
        ) : (
          <ol className="space-y-2 text-sm">
            {stats.top.map(([nom, nombre], i) => (
              <li key={nom} className="flex justify-between gap-2">
                <span>{i + 1 + ". " + nom}</span>
                <span className="font-medium">{nombre + " ventes"}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <p className="text-xs text-gray-500">
        {"Chiffres avant les frais bancaires de Stripe. Les heures sont celles de l'achat dans l'appli."}
      </p>
    </div>
  );
}

// Une case avec un chiffre clé.
function Case({ titre, valeur }: { titre: string; valeur: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs text-gray-500">{titre}</p>
      <p className="mt-1 text-xl font-bold">{valeur}</p>
    </div>
  );
}

// Un graphique en barres, fait uniquement avec des rectangles de couleur.
function Graphique({
  titre,
  barres,
  pasLibelle,
}: {
  titre: string;
  barres: Barre[];
  pasLibelle: number;
}) {
  const max = Math.max(1, ...barres.map((b) => b.valeur));
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold">{titre}</h2>
      <div className="flex h-32 items-end gap-0.5">
        {barres.map((b, i) => (
          <div
            key={i}
            className="flex h-full flex-1 flex-col justify-end"
            title={b.libelle + " : " + b.valeur}
          >
            <div
              className="w-full rounded-t bg-rose-500"
              style={{
                height: (b.valeur / max) * 100 + "%",
                minHeight: b.valeur > 0 ? 2 : 0,
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-0.5">
        {barres.map((b, i) => (
          <span key={i} className="flex-1 overflow-hidden text-center text-[9px] text-gray-500">
            {i % pasLibelle === 0 ? b.libelle : ""}
          </span>
        ))}
      </div>
    </section>
  );
}