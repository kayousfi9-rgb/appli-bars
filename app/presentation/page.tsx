import type { Metadata } from "next";
import PageVitrine, { type SectionVitrine } from "../components/PageVitrine";

export const metadata: Metadata = {
  title: "Happyvo : les bonnes affaires autour de toi, en direct",
  description:
    "Découvre les offres du moment près de toi : boissons, plats, sport, bien-être et sorties à prix réduit. Paye dans l'appli, présente ton QR code, profite.",
  openGraph: {
    title: "Happyvo : les bonnes affaires autour de toi, en direct",
    description: "Offres à durée limitée dans les bars, restaurants et lieux de loisirs près de chez toi.",
    type: "website",
    locale: "fr_FR",
  },
};

// Les textes de la page. Tu peux les modifier librement, entre les guillemets,
// sans toucher au reste.
const SECTIONS: SectionVitrine[] = [
  {
    titre: "Comment ça marche",
    points: [
      "Ouvre la carte : tu vois les offres qui se passent maintenant, près de toi.",
      "Choisis une offre et paye en quelques secondes dans l'appli.",
      "Présente ton QR code au comptoir : on le scanne, c'est validé.",
    ],
  },
  {
    titre: "Pour tous tes moments",
    paragraphes: ["Happyvo ne s'arrête pas aux bars. Il y a trois familles de lieux, trois couleurs sur la carte."],
    points: [
      "Manger et boire : bars, restaurants, cafés, boulangeries, food trucks.",
      "Sport et bien-être : padel, escalade, spa, cours.",
      "Sorties : laser game, escape game, bowling, théâtre, cinéma.",
    ],
  },
  {
    titre: "Pensé pour la vraie vie",
    points: [
      "Des offres limitées dans le temps : tu vois combien de temps il reste et combien de places sont disponibles.",
      "Un onglet « Ce soir » pour préparer ta soirée à l'avance.",
      "Des favoris et des notifications pour ne pas rater les offres de tes lieux préférés.",
      "Un problème avec une commande ? Signale-le dans l'appli : le lieu examine ta demande et peut te rembourser.",
    ],
  },
  {
    titre: "Installe Happyvo sur ton téléphone",
    paragraphes: [
      "Pas besoin de passer par une boutique d'applications. Sur Android, ouvre Happyvo dans Chrome et choisis « Installer l'application » dans le menu. Sur iPhone, ouvre Happyvo dans Safari, touche le bouton Partager, puis « Sur l'écran d'accueil ».",
    ],
  },
  {
    titre: "Tu tiens un bar, un restaurant, un lieu de loisirs ?",
    paragraphes: [
      "Remplis ton lieu aux heures creuses et fais connaître tes offres du moment. Tu publies une offre en une minute, tu fixes la quantité et la durée, et tu es payé directement.",
    ],
  },
  {
    titre: "Bon à savoir",
    paragraphes: [
      "Pour réserver une offre, tu crées un compte : il faut avoir 18 ans. L'abus d'alcool est dangereux pour la santé, à consommer avec modération.",
    ],
  },
];

export default function PagePresentation() {
  return (
    <PageVitrine
      titre="Les bonnes affaires autour de toi, en direct"
      accroche="Des offres à durée limitée dans les bars, restaurants et lieux de loisirs près de chez toi."
      boutons={[
        { texte: "Ouvrir l'appli", lien: "/", principal: true },
        { texte: "Je suis un établissement", lien: "/gerants" },
      ]}
      sections={SECTIONS}
    />
  );
}
