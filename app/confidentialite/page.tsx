import PageLegale, { type SectionLegale } from "../components/PageLegale";
import { DATE_MISE_A_JOUR } from "../lib/conditions";


const SECTIONS: SectionLegale[] = [
  {
    titre: "Qui est responsable de tes données ?",
    paragraphes: [
      "Le responsable du traitement est [À COMPLÉTER : nom ou dénomination de l'éditeur], dont les coordonnées figurent dans les mentions légales. Contact pour toute question sur tes données : [À COMPLÉTER : adresse e-mail dédiée].",
    ],
  },
  {
    titre: "Quelles données collectons-nous ?",
    paragraphes: [
      "Compte : adresse e-mail, identifiant technique, prénom si tu le renseignes, date de création et de dernière connexion.",
      "Commandes : les offres achetées, le montant, la commission, l'établissement, les dates, le code de retrait (QR), l'état de la commande (payée, récupérée, expirée) et les remboursements éventuels.",
      "Usage : tes lieux favoris, tes notifications, tes signalements de problème, et les appareils sur lesquels tu as activé les notifications (push).",
      "Paiement : il est traité par Stripe. Happyvo conserve uniquement les références techniques du paiement, jamais le numéro complet de ta carte.",
      "Position : si tu l'autorises, ta position sert à afficher les lieux les plus proches. [À CONFIRMER : elle est calculée sur ton appareil et n'est pas enregistrée par Happyvo.]",
      "Consentements : la trace de ton acceptation des conditions, de la politique de confidentialité et de ta confirmation de majorité (date et version).",
      "Pour les établissements : nom et adresse de l'établissement, informations de contact, photo, horaires, type et numéro de licence d'alcool (numéro non visible du public), identité des membres de l'équipe (prénom, e-mail).",
    ],
  },
  {
    titre: "Pourquoi, et sur quelle base légale ?",
    paragraphes: [
      "Exécuter ta commande et gérer ton compte (exécution du contrat) : création du compte, paiement, génération du QR code, retrait, remboursement.",
      "Respecter nos obligations légales : conservation des pièces comptables, contrôle des licences d'alcool.",
      "Assurer la sécurité du service et lutter contre la fraude et les abus (intérêt légitime) : limitation du nombre de requêtes, journaux techniques, détection des paiements sans commande.",
      "T'envoyer des notifications (consentement) : tu peux les désactiver à tout moment dans les réglages de l'application ou de ton téléphone.",
    ],
  },
  {
    titre: "Combien de temps conservons-nous tes données ?",
    paragraphes: [
      "Les données de ton compte sont conservées tant que ton compte est actif. Quand tu supprimes ton compte, tes données d'identification sont effacées ou rendues anonymes, et tes favoris, notifications et appareils enregistrés sont supprimés.",
      "Les commandes et les pièces comptables sont conservées [À CONFIRMER : 10 ans] pour respecter les obligations légales, sous une forme qui ne permet plus de te rattacher à ton identité après la suppression de ton compte.",
      "Les preuves de consentement sont conservées [À CONFIRMER : 5 ans]. Les journaux techniques sont conservés [À CONFIRMER : 12 mois au plus].",
    ],
  },
  {
    titre: "Qui reçoit tes données ?",
    paragraphes: [
      "Happyvo ne vend pas tes données. Elles sont traitées par des prestataires techniques qui agissent pour notre compte : Supabase (base de données et connexion), Vercel (hébergement de l'application), Stripe (paiement).",
      "L'établissement auprès duquel tu commandes voit ce qui est nécessaire à la préparation et au retrait de ta commande (offre, prénom si renseigné, état de la commande), jamais ton adresse e-mail ni tes données de paiement.",
      "Sentry (suivi des erreurs techniques : en cas de plantage, des informations techniques comme le type d'appareil, le navigateur et la page concernée lui sont transmises, sans ton nom ni ton e-mail) et Vercel Web Analytics (mesure d'audience anonyme, sans cookie). [À COMPLÉTER : fournisseur de fonds de carte, le cas échéant]",
    ],
  },
  {
    titre: "Transferts hors de l'Union européenne",
    paragraphes: [
      "Certains prestataires (par exemple Vercel et Stripe) peuvent traiter des données en dehors de l'Union européenne, notamment aux États-Unis. Ces transferts sont encadrés par les mécanismes prévus par le RGPD (décision d'adéquation, clauses contractuelles types). [À VÉRIFIER AVEC LES CONDITIONS DE CHAQUE PRESTATAIRE]",
    ],
  },
  {
    titre: "Tes droits",
    paragraphes: [
      "Tu disposes d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité de tes données, ainsi que du droit de retirer ton consentement à tout moment et de définir des directives sur le sort de tes données après ton décès.",
      "Dans l'application, rubrique « Mon compte » puis « Mes données », tu peux télécharger toutes tes données et supprimer ton compte. Pour tout autre droit, écris à l'adresse de contact indiquée plus haut ; nous répondons dans un délai d'un mois.",
      "Si tu estimes que tes droits ne sont pas respectés, tu peux introduire une réclamation auprès de la CNIL (cnil.fr).",
    ],
  },
  {
    titre: "Cookies et traceurs",
    paragraphes: [
      "L'application utilise uniquement le stockage nécessaire à son fonctionnement (maintien de ta connexion, préférences d'affichage). Aucun cookie publicitaire n'est utilisé. La mesure d'audience (Vercel Web Analytics) fonctionne sans cookie et n'identifie pas les personnes.",
    ],
  },
  {
    titre: "Sécurité",
    paragraphes: [
      "Nous protégeons tes données par des règles d'accès strictes (chaque utilisateur ne peut accéder qu'à ses propres données), des connexions chiffrées et des contrôles réguliers. Aucun système n'étant infaillible, en cas de violation de données susceptible de te concerner, nous t'en informerons conformément à la loi.",
    ],
  },
  {
    titre: "Modification de cette politique",
    paragraphes: [
      "Cette politique peut évoluer. En cas de modification importante, il te sera demandé de l'accepter à nouveau.",
    ],
  },
];


export default function PageConfidentialite() {
  return (
    <PageLegale
      titre="Politique de confidentialité"
      miseAJour={DATE_MISE_A_JOUR}
      introduction="Cette page explique quelles données Happyvo collecte, pourquoi, combien de temps elles sont gardées et comment exercer tes droits."
      sections={SECTIONS}
    />
  );
}