import PageLegale, { type SectionLegale } from "../components/PageLegale";
import { DATE_MISE_A_JOUR } from "../lib/conditions";


const SECTIONS: SectionLegale[] = [
  {
    titre: "Éditeur de l'application",
    paragraphes: [
      "Nom ou dénomination : [À COMPLÉTER]",
      "Forme juridique : [À COMPLÉTER : entreprise individuelle, micro-entreprise, société...]",
      "Adresse du siège ou de l'activité : [À COMPLÉTER]",
      "Numéro SIREN : [À COMPLÉTER]. Numéro de TVA intracommunautaire : [À COMPLÉTER, ou mention de la franchise en base de TVA]",
      "Capital social (si société) : [À COMPLÉTER]",
      "Adresse e-mail de contact : [À COMPLÉTER]. Téléphone : [À COMPLÉTER SI DISPONIBLE]",
    ],
  },
  {
    titre: "Directeur de la publication",
    paragraphes: ["[À COMPLÉTER : nom du représentant légal ou de l'entrepreneur]"],
  },
  {
    titre: "Hébergement",
    paragraphes: [
      "L'application est hébergée par Vercel Inc. (vercel.com). Adresse : [À COMPLÉTER : adresse indiquée sur le site de Vercel].",
      "La base de données est hébergée par Supabase (supabase.com). Adresse : [À COMPLÉTER : adresse indiquée sur le site de Supabase]. Région d'hébergement des données : [À COMPLÉTER : région choisie dans les réglages du projet].",
    ],
  },
  {
    titre: "Paiement",
    paragraphes: [
      "Les paiements sont traités par Stripe Payments Europe, Ltd. (Irlande), prestataire de paiement agréé. Happyvo n'a pas accès à tes données de carte bancaire complètes.",
    ],
  },
  {
    titre: "Médiation et contact",
    paragraphes: [
      "Pour toute question ou réclamation, écris à l'adresse e-mail de contact ci-dessus. Pour le médiateur de la consommation, voir les conditions générales.",
    ],
  },
];


export default function PageMentionsLegales() {
  return <PageLegale titre="Mentions légales" miseAJour={DATE_MISE_A_JOUR} sections={SECTIONS} />;
}
