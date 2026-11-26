"use client";


import { useEffect, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { chargerMonEtablissement, type MonEtablissement } from "../../lib/equipe";
import { FAMILLES, type Famille } from "../../lib/familles";
import type { Creneau, HorairesSemaine, JourSemaine } from "../../lib/horaires";
import LiensGerant from "./liensgerant";


const JOURS: { id: JourSemaine; nom: string }[] = [
  { id: "lun", nom: "Lundi" },
  { id: "mar", nom: "Mardi" },
  { id: "mer", nom: "Mercredi" },
  { id: "jeu", nom: "Jeudi" },
  { id: "ven", nom: "Vendredi" },
  { id: "sam", nom: "Samedi" },
  { id: "dim", nom: "Dimanche" },
];


const LICENCES = [
  { id: "licence_3", texte: "Licence III (bière, vin, cidre…)" },
  { id: "licence_4", texte: "Licence IV (tous les alcools)" },
  { id: "petite_licence_restaurant", texte: "Petite licence restaurant" },
  { id: "licence_restaurant", texte: "Licence restaurant" },
  { id: "licence_emporter", texte: "Licence à emporter" },
];


const TAILLE_MAX_PHOTO = 3 * 1024 * 1024; // 3 Mo
const CHAMP = "w-full rounded-lg border border-[#E7DDC8] bg-white px-3 py-2 text-base text-[#14193C]";


type LigneBar = {
  categorie_etab: Famille;
  etiquette: string | null;
  photo_url: string | null;
  horaires_semaine: HorairesSemaine | null;
  licence_alcool_type: string | null;
  licence_alcool_verifiee: boolean;
};


type Etat =
  | { statut: "chargement" }
  | { statut: "interdit"; message: string }
  | { statut: "pret"; bar: MonEtablissement };


export default function FicheEtablissement() {
  const [etat, setEtat] = useState<Etat>({ statut: "chargement" });
  const [famille, setFamille] = useState<Famille>("manger_boire");
  const [etiquette, setEtiquette] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [horaires, setHoraires] = useState<HorairesSemaine>({});
  const [licenceType, setLicenceType] = useState("");
  const [licenceNumero, setLicenceNumero] = useState("");
  const [licenceVerifiee, setLicenceVerifiee] = useState(false);
  const [licenceEnvoyee, setLicenceEnvoyee] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  const [messageLicence, setMessageLicence] = useState<{ ok: boolean; texte: string } | null>(null);
  const [envoi, setEnvoi] = useState(false);


  useEffect(() => {
    (async () => {
      const bar = await chargerMonEtablissement();
      if (!bar) {
        setEtat({ statut: "interdit", message: "Connecte-toi d'abord avec ton compte gérant (page /equipe)." });
        return;
      }
      if (bar.role !== "gerant") {
        setEtat({ statut: "interdit", message: "Cette page est réservée au gérant." });
        return;
      }
      const { data } = await supabase
        .from("bars")
        .select("categorie_etab, etiquette, photo_url, horaires_semaine, licence_alcool_type, licence_alcool_verifiee")
        .eq("id", bar.id)
        .limit(1);
      const ligne = (data?.[0] ?? null) as LigneBar | null;
      if (ligne) {
        setFamille(ligne.categorie_etab ?? "manger_boire");
        setEtiquette(ligne.etiquette ?? "");
        setPhotoUrl(ligne.photo_url);
        setHoraires(ligne.horaires_semaine ?? {});
        setLicenceType(ligne.licence_alcool_type ?? "");
        setLicenceVerifiee(Boolean(ligne.licence_alcool_verifiee));
        setLicenceEnvoyee(Boolean(ligne.licence_alcool_type));
      }
      setEtat({ statut: "pret", bar });
    })();
  }, []);


  function creneauxDuJour(jour: JourSemaine): Creneau[] {
    return horaires[jour] ?? [];
  }


  function changerCreneaux(jour: JourSemaine, creneaux: Creneau[]) {
    setHoraires((avant) => ({ ...avant, [jour]: creneaux }));
  }


  async function envoyerPhoto(e: ChangeEvent<HTMLInputElement>) {
    if (etat.statut !== "pret") return;
    const fichier = e.target.files?.[0];
    if (!fichier) return;
    setMessage(null);
    if (!fichier.type.startsWith("image/")) {
      setMessage({ ok: false, texte: "Ce fichier n'est pas une image." });
      return;
    }
    if (fichier.size > TAILLE_MAX_PHOTO) {
      setMessage({ ok: false, texte: "L'image est trop lourde (3 Mo maximum)." });
      return;
    }
    const extension = fichier.type === "image/png" ? "png" : fichier.type === "image/webp" ? "webp" : "jpg";
    const chemin = etat.bar.id + "/photo-" + Date.now() + "." + extension;
    const { error } = await supabase.storage.from("photos-bars").upload(chemin, fichier, { contentType: fichier.type });
    if (error) {
      setMessage({ ok: false, texte: "Envoi de la photo impossible : " + error.message });
      return;
    }
    const { data } = supabase.storage.from("photos-bars").getPublicUrl(chemin);
    setPhotoUrl(data.publicUrl);
    setMessage({ ok: true, texte: "Photo envoyée. Pense à enregistrer la fiche." });
  }


  async function enregistrer() {
    setMessage(null);
    setEnvoi(true);
    // on retire les jours sans créneau : ils comptent comme « fermé »
    const propres: HorairesSemaine = {};
    for (const j of JOURS) {
      const liste = (horaires[j.id] ?? []).filter((c) => c[0] !== "" && c[1] !== "" && c[0] !== c[1]);
      if (liste.length > 0) propres[j.id] = liste;
    }
    const { data, error } = await supabase.rpc("maj_etablissement", {
      p_famille: famille,
      p_etiquette: etiquette,
      p_photo_url: photoUrl,
      p_horaires: propres,
    });
    setEnvoi(false);
    if (error) {
      setMessage({ ok: false, texte: "Enregistrement impossible : " + error.message });
      return;
    }
    const resultat = (data as { resultat?: string } | null)?.resultat;
    setMessage(
      resultat === "ok"
        ? { ok: true, texte: "Fiche enregistrée." }
        : { ok: false, texte: "Enregistrement refusé (" + (resultat ?? "erreur") + ")." }
    );
  }


  async function envoyerLicence() {
    setMessageLicence(null);
    if (licenceType === "") {
      setMessageLicence({ ok: false, texte: "Choisis le type de licence." });
      return;
    }
    if (licenceNumero.trim().length < 3) {
      setMessageLicence({ ok: false, texte: "Saisis le numéro de ta licence." });
      return;
    }
    const { data, error } = await supabase.rpc("declarer_licence", {
      p_type: licenceType,
      p_numero: licenceNumero.trim(),
    });
    if (error) {
      setMessageLicence({ ok: false, texte: "Envoi impossible : " + error.message });
      return;
    }
    if ((data as { resultat?: string } | null)?.resultat !== "ok") {
      setMessageLicence({ ok: false, texte: "Envoi refusé." });
      return;
    }
    setLicenceVerifiee(false);
    setLicenceEnvoyee(true);
    setLicenceNumero("");
    setMessageLicence({ ok: true, texte: "Licence envoyée. Elle sera vérifiée par l'équipe Happyvo avant que tu puisses publier de l'alcool." });
  }


  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-white p-4 pb-16 text-[#14193C]">
      <Link href="/gerant" className="text-sm font-semibold text-[#007F77] underline">
        ← Retour à mon espace
      </Link>
      <h1 className="mt-3 text-2xl font-extrabold">Mon lieu</h1>
      <LiensGerant />


      {etat.statut === "chargement" && <p className="mt-4 text-sm">Chargement…</p>}
      {etat.statut === "interdit" && (
        <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm">{etat.message}</p>
      )}


      {etat.statut === "pret" && (
        <div className="mt-4 space-y-6">
          <p className="text-sm text-[#5B607E]">{etat.bar.nom}</p>


          <section className="space-y-3">
            <h2 className="text-xl font-bold">Famille et étiquette</h2>
            <div className="flex flex-wrap gap-2">
              {FAMILLES.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFamille(f.id)}
                  className={"rounded-full border px-4 py-2 text-sm font-semibold " + (famille === f.id ? "border-[#007F77] bg-[#007F77] text-white" : "border-[#E7DDC8] bg-white")}
                >
                  {f.emoji + " " + f.libelle}
                </button>
              ))}
            </div>
            <label className="block text-sm font-semibold">
              Étiquette (ce que tu es, en un ou deux mots)
              <input
                className={CHAMP + " mt-1 font-normal"}
                maxLength={40}
                value={etiquette}
                onChange={(e) => setEtiquette(e.target.value)}
                placeholder="bar, boulangerie, laser game, padel, théâtre…"
              />
            </label>
          </section>


          <section className="space-y-3">
            <h2 className="text-xl font-bold">Photo</h2>
            {photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="Photo du lieu" className="h-40 w-full rounded-xl object-cover" />
            )}
            <input type="file" accept="image/*" onChange={envoyerPhoto} className="block w-full text-sm" />
            <p className="text-xs text-[#5B607E]">Image de 3 Mo maximum.</p>
          </section>


          <section className="space-y-3">
            <h2 className="text-xl font-bold">Horaires d'ouverture</h2>
            <p className="text-sm text-[#5B607E]">
              Un jour sans horaire est affiché « fermé ». Pour passer après minuit, mets par exemple 18:00 → 02:00.
            </p>
            {JOURS.map((j) => {
              const creneaux = creneauxDuJour(j.id);
              return (
                <div key={j.id} className="rounded-xl border border-[#E7DDC8] bg-[#FFF4E2] p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-bold">{j.nom}</p>
                    <button
                      type="button"
                      onClick={() => changerCreneaux(j.id, [...creneaux, ["12:00", "22:00"]])}
                      className="rounded-full border border-[#007F77] px-3 py-1 text-sm font-semibold text-[#007F77]"
                    >
                      + Ajouter un créneau
                    </button>
                  </div>
                  {creneaux.length === 0 && <p className="mt-1 text-sm text-[#5B607E]">Fermé</p>}
                  {creneaux.map((c, i) => (
                    <div key={i} className="mt-2 flex items-center gap-2">
                      <input
                        type="time"
                        className={CHAMP}
                        value={c[0]}
                        onChange={(e) => changerCreneaux(j.id, creneaux.map((x, k) => (k === i ? [e.target.value, x[1]] : x)))}
                      />
                      <span>→</span>
                      <input
                        type="time"
                        className={CHAMP}
                        value={c[1]}
                        onChange={(e) => changerCreneaux(j.id, creneaux.map((x, k) => (k === i ? [x[0], e.target.value] : x)))}
                      />
                      <button
                        type="button"
                        aria-label="Supprimer ce créneau"
                        onClick={() => changerCreneaux(j.id, creneaux.filter((_, k) => k !== i))}
                        className="rounded-full border border-[#E2372D] px-3 py-1 text-[#E2372D]"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              );
            })}
          </section>


          <div>
            <button
              type="button"
              onClick={enregistrer}
              disabled={envoi}
              className="w-full rounded-full bg-[#007F77] px-4 py-3 text-base font-bold text-white disabled:opacity-60"
            >
              {envoi ? "Enregistrement…" : "Enregistrer la fiche"}
            </button>
            {message && (
              <p className={"mt-3 rounded-lg p-2 text-sm " + (message.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700")}>{message.texte}</p>
            )}
          </div>


          <section className="space-y-3 rounded-2xl border border-[#E7DDC8] p-3">
            <h2 className="text-xl font-bold">Licence d'alcool</h2>
            <p className="text-sm text-[#5B607E]">
              Pour publier une boisson alcoolisée, ta licence doit être déclarée puis vérifiée. Sans alcool, tu n'en as pas besoin.
            </p>
            <p className="text-sm font-semibold">
              {licenceVerifiee
                ? "✅ Licence vérifiée : tu peux publier de l'alcool."
                : licenceEnvoyee
                  ? "⏳ Licence envoyée, en attente de vérification."
                  : "Aucune licence déclarée."}
            </p>
            <label className="block text-sm font-semibold">
              Type de licence
              <select className={CHAMP + " mt-1 font-normal"} value={licenceType} onChange={(e) => setLicenceType(e.target.value)}>
                <option value="">Choisir…</option>
                {LICENCES.map((l) => (
                  <option key={l.id} value={l.id}>{l.texte}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold">
              Numéro de licence
              <input className={CHAMP + " mt-1 font-normal"} maxLength={40} value={licenceNumero} onChange={(e) => setLicenceNumero(e.target.value)} />
            </label>
            <button type="button" onClick={envoyerLicence} className="w-full rounded-full border border-[#007F77] px-4 py-2 font-bold text-[#007F77]">
              Envoyer ma licence
            </button>
            <p className="text-xs text-[#5B607E]">Envoyer une nouvelle licence remet la vérification à zéro.</p>
            {messageLicence && (
              <p className={"rounded-lg p-2 text-sm " + (messageLicence.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700")}>{messageLicence.texte}</p>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
