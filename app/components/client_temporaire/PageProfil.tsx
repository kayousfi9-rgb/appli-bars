"use client";

import { useEffect, useState, type ReactNode } from "react";

import type { User } from "@supabase/supabase-js";

import { supabase } from "../../lib/supabase";

import { formaterEuros, premier } from "../../lib/commandes";

import type { ProfilClient, Relie } from "../../lib/types";

import ConnexionClient from "./ConnexionClient";

import CompleterProfil from "./CompleterProfil";

export type Reglage = "auto" | "clair" | "sombre";

const VERSION = "0.1";

type Props = {

  reglage: Reglage;

  onReglage: (reglage: Reglage) => void;

};

type LigneCommande = {

  prix_paye: number;

  offres: Relie<{ prix_normal: number }>;

};

const REGLAGES: { valeur: Reglage; libelle: string }[] = [

  { valeur: "auto", libelle: "Auto" },

  { valeur: "clair", libelle: "Clair" },

  { valeur: "sombre", libelle: "Sombre" },

];

export default function PageProfil({ reglage, onReglage }: Props) {

  const [utilisateur, setUtilisateur] = useState<User | null>(null);

  const [pret, setPret] = useState(false);

  const [profil, setProfil] = useState<ProfilClient | null>(null);

  const [chargementProfil, setChargementProfil] = useState(false);

  const [economies, setEconomies] = useState(0);

  const [nonLues, setNonLues] = useState(0);

  const [message, setMessage] = useState<string | null>(null);

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

  // 2) A-t-il une fiche client ? Sinon on la crée avec les infos de l'inscription.

  const idUtilisateur = utilisateur?.id ?? null;

  const metaPrenom = utilisateur?.user_metadata?.prenom as string | undefined;

  const metaNaissance = utilisateur?.user_metadata?.date_naissance as string | undefined;

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

  // 3) Les économies et le nombre d'alertes non lues.

  const idProfil = profil?.id ?? null;

  useEffect(() => {

    if (!idProfil) return;

    let annule = false;

    (async () => {

      const { data } = await supabase

        .from("commandes")

        .select("prix_paye, offres(prix_normal)")

        .eq("client_id", idProfil)

        .eq("statut", "recuperee");

      const lignes = (data as unknown as LigneCommande[]) ?? [];

      let total = 0;

      for (const ligne of lignes) {

        const normal = Number(premier(ligne.offres)?.prix_normal ?? 0);

        if (normal > 0) total += Math.max(0, normal - Number(ligne.prix_paye));

      }

      const { count } = await supabase

        .from("notifications")

        .select("id", { count: "exact", head: true })

        .eq("client_id", idProfil)

        .eq("lue", false);

      if (!annule) {

        setEconomies(total);

        setNonLues(count ?? 0);

      }

    })();

    return () => {

      annule = true;

    };

  }, [idProfil]);

  async function deconnecter() {

    await supabase.auth.signOut();

  }

  async function supprimerMesDonnees() {

    if (!profil) return;

    const sur = window.confirm("Supprimer ton profil et tes favoris ? Cette action est définitive.");

    if (!sur) return;

    const { error } = await supabase.from("clients").delete().eq("id", profil.id);

    if (error) {

      setMessage(error.message);

      return;

    }

    await supabase.auth.signOut();

  }

  // ----- Ce qu'on affiche tout en haut, selon la situation -----

  let haut: ReactNode;

  if (!pret || chargementProfil) {

    haut = (

      <p className="py-10 text-center" style={{ color: "var(--hv-texte-doux)" }}>

        Chargement…

      </p>

    );

  } else if (!utilisateur) {

    haut = (

      <section

        className="rounded-2xl border p-5"

        style={{ background: "var(--hv-carte)", borderColor: "var(--hv-bord)" }}

      >

        <p className="text-xl font-bold">{"Bienvenue sur Happyvo 👋"}</p>

        <p className="mt-2 text-sm" style={{ color: "var(--hv-texte-doux)" }}>

          {"Crée un compte pour commander, garder tes favoris et retrouver tes QR codes. Tu peux déjà explorer la carte sans compte."}

        </p>

        <div className="mt-4" style={{ color: "#14193C" }}>

          <ConnexionClient />

        </div>

      </section>

    );

  } else if (!profil) {

    haut = (

      <div style={{ color: "#14193C" }}>

        <CompleterProfil idUtilisateur={utilisateur.id} onCree={setProfil} />

      </div>

    );

  } else {

    haut = (

      <>

        <section

          className="rounded-2xl border p-5"

          style={{ background: "var(--hv-carte)", borderColor: "var(--hv-bord)" }}

        >

          <div className="flex items-center gap-4">

            <div

              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-2xl font-bold"

              style={{ background: "var(--hv-pastille)", color: "#FFF4E2" }}

            >

              {profil.prenom.charAt(0).toUpperCase()}

            </div>

            <div className="min-w-0">

              <p className="text-xl font-bold">{"Bonjour " + profil.prenom}</p>

              <p className="truncate text-sm" style={{ color: "var(--hv-texte-doux)" }}>

                {utilisateur.email}

              </p>

            </div>

          </div>

          <p

            className="mt-4 rounded-xl px-4 py-3 text-sm font-semibold"

            style={{ background: "var(--hv-fond)" }}

          >

            {economies > 0

              ? "Tu as économisé " + formaterEuros(economies) + " grâce à Happyvo 🎉"

              : "Ta première économie t'attend 🎉"}

          </p>

        </section>

        <div className="grid grid-cols-3 gap-3">

          <Raccourci href="/compte/commandes" icone="🧾" titre="Commandes" />

          <Raccourci href="/compte/favoris" icone="❤️" titre="Favoris" />

          <Raccourci href="/compte/bars-visites" icone="🗺️" titre="Bars visités" />

        </div>

      </>

    );

  }

  return (

    <div

      className="absolute inset-0 z-[1300] overflow-y-auto"

      style={{

        background: "var(--hv-fond)",

        color: "var(--hv-texte)",

        paddingTop: "calc(env(safe-area-inset-top) + 20px)",

        paddingBottom: "calc(env(safe-area-inset-bottom) + 96px)",

      }}

    >

      <div className="mx-auto max-w-md space-y-6 px-4">

        <h1 className="text-3xl font-bold">Profil</h1>

        {haut}

        {message && (

          <p className="rounded-xl px-3 py-2 text-sm" style={{ background: "var(--hv-carte)" }}>

            {message}

          </p>

        )}

        <Section titre="Réglages">

          {profil && <Ligne href="/compte/notifications" titre="Mes alertes" pastille={nonLues} />}

          {profil && <Ligne href="/mot-de-passe-oublie" titre="Changer mon mot de passe" />}

          <div className="px-4 py-3.5">

            <p className="text-base">Affichage</p>

            <div className="mt-2 flex gap-2">

              {REGLAGES.map((r) => (

                <button

                  key={r.valeur}

                  type="button"

                  onClick={() => onReglage(r.valeur)}

                  className="flex-1 rounded-full border px-3 py-2 text-sm font-semibold"

                  style={{

                    background: reglage === r.valeur ? "var(--hv-bouton-fond)" : "var(--hv-fond)",

                    color: reglage === r.valeur ? "var(--hv-bouton-texte)" : "var(--hv-texte)",

                    borderColor: reglage === r.valeur ? "var(--hv-bouton-fond)" : "var(--hv-bord)",

                  }}

                >

                  {r.libelle}

                </button>

              ))}

            </div>

          </div>

        </Section>

        <Section titre="Aide et légal">

          <Ligne href="/infos#aide" titre="Aide et contact" />

          <Ligne href="/infos#confidentialite" titre="Confidentialité et mes données" />

          <Ligne href="/infos#conditions" titre="Conditions d'utilisation" />

          <Ligne href="/infos#vente" titre="Conditions de vente" />

          <Ligne href="/infos#mentions" titre="Mentions légales" />

          <Ligne href="/infos#apropos" titre="À propos de Happyvo" />

        </Section>

        {profil && (

          <Section titre="Mon compte">

            <button

              type="button"

              onClick={deconnecter}

              className="w-full px-4 py-3.5 text-left text-base"

            >

              Me déconnecter

            </button>

            <button

              type="button"

              onClick={supprimerMesDonnees}

              className="w-full px-4 py-3.5 text-left text-base"

              style={{ color: "var(--hv-tomate)" }}

            >

              Supprimer mes données

            </button>

          </Section>

        )}

        <div className="space-y-3 pt-2 text-center">

          <p className="text-xs" style={{ color: "var(--hv-texte-doux)" }}>

            {"L'abus d'alcool est dangereux pour la santé, à consommer avec modération."}

          </p>

          <p className="text-xs" style={{ color: "var(--hv-texte-doux)" }}>

            {"Happyvo · version " + VERSION}

          </p>

          <p>

            <a

              href="/gerant"

              className="text-xs underline"

              style={{ color: "var(--hv-texte-doux)" }}

            >

              Vous êtes un bar ou un restaurant ?

            </a>

          </p>

        </div>

      </div>

    </div>

  );

}

// Un grand bouton carré avec une icône et un titre.

function Raccourci({ href, icone, titre }: { href: string; icone: string; titre: string }) {

  return (

    <a

      href={href}

      className="flex flex-col items-center gap-1 rounded-2xl border px-2 py-4 text-center text-sm font-semibold"

      style={{ background: "var(--hv-carte)", borderColor: "var(--hv-bord)" }}

    >

      <span className="text-2xl" aria-hidden="true">

        {icone}

      </span>

      <span>{titre}</span>

    </a>

  );

}

// Un groupe de lignes dans une carte arrondie, avec un petit titre au-dessus.

function Section({ titre, children }: { titre: string; children: ReactNode }) {

  return (

    <div>

      <p

        className="mb-2 px-1 text-xs font-bold uppercase tracking-wide"

        style={{ color: "var(--hv-texte-doux)" }}

      >

        {titre}

      </p>

      <section

        className="hv-section overflow-hidden rounded-2xl border"

        style={{ background: "var(--hv-carte)", borderColor: "var(--hv-bord)" }}

      >

        {children}

      </section>

    </div>

  );

}

// Une ligne cliquable avec une flèche (et une pastille rouge optionnelle).

function Ligne({ href, titre, pastille }: { href: string; titre: string; pastille?: number }) {

  return (

    <a href={href} className="flex items-center justify-between px-4 py-3.5 text-base">

      <span>{titre}</span>

      <span className="flex items-center gap-2">

        {pastille !== undefined && pastille > 0 && (

          <span

            className="rounded-full px-2 py-0.5 text-xs font-bold"

            style={{ background: "var(--hv-tomate)", color: "#fff" }}

          >

            {pastille}

          </span>

        )}

        <span aria-hidden="true" style={{ color: "var(--hv-texte-doux)" }}>

          ›

        </span>

      </span>

    </a>

  );

}
