import { supabase } from "./supabase";
import { dateParis } from "./utils";
import {
  heureCourte,
  nomModele,
  parisMaintenant,
  libelleJours,
  versMinutes,
  type OffreRecurrente,
} from "./recurrence";
import type { CategorieEtab } from "./etablissements";


// Une ligne de l'onglet « Ce soir »
export type ItemCeSoir = {
  cle: string;
  barNom: string;
  adresse: string | null;
  latitude: number;
  longitude: number;
  categorieEtab: CategorieEtab;
  titre: string;
  prixNormal: number;
  prixReduit: number;
  quantite: number | null;
  debutMs: number; // heure de début (pour trier et faire le compte à rebours)
  debutTexte: string; // ex : 18:00
  finTexte: string; // ex : 20:00
  recurrence: string | null; // ex : « jeu, ven » si l'offre revient chaque semaine
};


export type ResultatCeSoir = { items: ItemCeSoir[]; erreur: string | null };


type BarMini = {
  nom: string;
  adresse: string | null;
  latitude: number;
  longitude: number;
  categorie_etab: CategorieEtab;
};


type OffreProgrammee = {
  id: string | number;
  produit: string;
  type_boisson: string | null;
  prix_normal: number;
  prix_reduit: number;
  debut: string;
  fin: string;
  quantite: number | null;
  categorie: string | null;
  nom_plat: string | null;
  bars: BarMini;
};


type ModeleAvecBar = OffreRecurrente & { bars: BarMini };


const BAR = "bars!inner(nom, adresse, latitude, longitude, categorie_etab, verifie)";


function heureParis(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}


export async function recupererCeSoir(): Promise<ResultatCeSoir> {
  const maintenant = Date.now();
  const dans18h = new Date(maintenant + 18 * 60 * 60 * 1000).toISOString();
  const aujourdhui = dateParis(new Date(maintenant).toISOString());
  const { jour, minutes } = parisMaintenant(maintenant);


  const [programmees, modeles, generees] = await Promise.all([
    supabase
      .from("offres")
      .select(
        "id, produit, type_boisson, prix_normal, prix_reduit, debut, fin, quantite, categorie, nom_plat, " + BAR
      )
      .eq("bars.verifie", true)
      .gt("debut", new Date(maintenant).toISOString())
      .lt("debut", dans18h)
      .order("debut", { ascending: true }),
    supabase
      .from("offres_recurrentes")
      .select("*, " + BAR)
      .eq("bars.verifie", true)
      .eq("actif", true)
      .contains("jours", [jour]),
    supabase.from("offres_recurrentes_generees").select("modele_id").eq("jour", aujourdhui),
  ]);


  const erreur = programmees.error?.message ?? modeles.error?.message ?? generees.error?.message ?? null;
  if (erreur) {
    console.error("Erreur Ce soir :", erreur);
    return { items: [], erreur };
  }


  const items: ItemCeSoir[] = [];


  // 1) Les offres déjà programmées (créées à l'avance par le gérant, ou générées automatiquement)
  for (const o of (programmees.data ?? []) as unknown as OffreProgrammee[]) {
    if ((o.quantite ?? 1) <= 0) continue;
    items.push({
      cle: "offre-" + o.id,
      barNom: o.bars.nom,
      adresse: o.bars.adresse,
      latitude: o.bars.latitude,
      longitude: o.bars.longitude,
      categorieEtab: o.bars.categorie_etab,
      titre: o.categorie === "plat" && o.nom_plat ? o.nom_plat : o.produit,
      prixNormal: o.prix_normal,
      prixReduit: o.prix_reduit,
      quantite: o.quantite,
      debutMs: new Date(o.debut).getTime(),
      debutTexte: heureParis(o.debut),
      finTexte: heureParis(o.fin),
      recurrence: null,
    });
  }


  // 2) Les offres récurrentes du jour qui ne sont pas encore générées
  const dejaGenerees = new Set((generees.data ?? []).map((g) => String(g.modele_id)));
  for (const m of (modeles.data ?? []) as unknown as ModeleAvecBar[]) {
    if (dejaGenerees.has(String(m.id))) continue;
    const debutMin = versMinutes(m.heure_debut);
    // seulement celles qui n'ont pas encore commencé
    if (debutMin <= minutes) continue;
    items.push({
      cle: "modele-" + m.id,
      barNom: m.bars.nom,
      adresse: m.bars.adresse,
      latitude: m.bars.latitude,
      longitude: m.bars.longitude,
      categorieEtab: m.bars.categorie_etab,
      titre: nomModele(m),
      prixNormal: m.prix_normal,
      prixReduit: m.prix_reduit,
      quantite: m.quantite,
      debutMs: maintenant + (debutMin - minutes) * 60 * 1000,
      debutTexte: heureCourte(m.heure_debut),
      finTexte: heureCourte(m.heure_fin),
      recurrence: libelleJours(m.jours),
    });
  }


  items.sort((a, b) => a.debutMs - b.debutMs);
  return { items, erreur: null };
}
