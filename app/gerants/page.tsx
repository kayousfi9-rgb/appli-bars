import type { Metadata } from "next";
import PageVitrine, { type SectionVitrine } from "../components/PageVitrine";
import { EMAIL_CONTACT, LIEN_INSCRIPTION_GERANT } from "../lib/presentation";

export const metadata: Metadata = {
  title: "Happyvo pour les établissements : remplis ton lieu aux heures creuses",
  description:
    "Publie des offres à durée limitée, attire de nouveaux clients et sois payé directement. Bars, restaurants, lieux de sport et de loisirs.",
  openGraph: {
    title: "Happyvo pour les établissements",
    description: "Publie une offre en une minute, remplis ton lieu aux heures creuses.",
    type: "website",
    locale: "fr_FR",
  },
};

// Les textes de la page. Relis-les : ils décrivent ce que fait l'appli aujourd'hui.
const SECTIONS: SectionVitrine[] = [
  {
    titre: "Ce que Happyvo t'apporte",
    points: [
      "De nouveaux clients, qui viennent à toi au bon moment : tu choisis l'heure, la durée et la quantité de chaque offre.",
      "Aucun abonnement : une commission de 5 % seulement sur les ventes réalisées, hors frais de paiement de Stripe.",
      "Un paiement direct sur ton compte, sécurisé par Stripe.",
      "Des clients qui viennent avec un QR code : tu le scannes, la commande est validée, aucun risque de fausse réduction.",
    ],
  },
  {
    titre: "Pour tous les types de lieux",
    paragraphes: [
      "Bar, restaurant, café, boulangerie, salle de sport, padel, escape game, laser game, bowling, théâtre... Tu peux proposer une boisson, un plat ou une activité.",
    ],
  },
  {
    titre: "Comment démarrer",
    points: [
      "Crée ton compte établissement.",
      "Renseigne ton lieu : famille, photo, horaires.",
      "Relie ton compte de paiement Stripe pour être payé.",
      "Si tu vends de l'alcool : déclare ta licence. Nous la vérifions avant d'autoriser les offres de boissons alcoolisées.",
      "Publie ta première offre : elle apparaît sur la carte.",
    ],
  },
  {
    titre: "Pratique au quotidien",
    points: [
      "Offres récurrentes : programme une offre chaque semaine, une seule fois.",
      "Comptes serveurs : ton équipe scanne les QR codes avec son propre accès, sans voir tes statistiques ni ta banque.",
      "Alerte à chaque nouvelle commande, avec un bip sur l'écran du comptoir.",
      "Un problème avec un client ? Tu traites le signalement et tu rembourses en un clic.",
    ],
  },
  {
    titre: "Une question ?",
    paragraphes: ["Écris-nous : " + EMAIL_CONTACT + ". Nous répondons vite et nous t'aidons à publier ta première offre."],
  },
];

export default function PageGerants() {
  return (
    <PageVitrine
      titre="Remplis ton lieu aux heures creuses"
      accroche="Publie des offres à durée limitée et laisse les clients venir à toi."
      boutons={[
        { texte: "Créer mon compte établissement", lien: LIEN_INSCRIPTION_GERANT, principal: true },
        { texte: "Nous écrire", lien: "mailto:" + EMAIL_CONTACT },
      ]}
      sections={SECTIONS}
    />
  );
}
