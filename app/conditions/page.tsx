import PageLegale, { type SectionLegale } from "../components/PageLegale";
import { DATE_MISE_A_JOUR } from "../lib/conditions";


const SECTIONS: SectionLegale[] = [
  {
    titre: "Qui sommes-nous, et que fait Happyvo ?",
    paragraphes: [
      "Happyvo est une application qui permet de découvrir, autour de soi, des offres à durée limitée proposées en direct par des établissements (bars, restaurants, cafés, commerces de bouche, lieux de sport, de bien-être et de sorties). Elle est éditée par [À COMPLÉTER : nom ou dénomination de l'éditeur, forme juridique, adresse, numéro SIREN] (« Happyvo »). Les coordonnées complètes figurent dans les mentions légales.",
      "Happyvo est un intermédiaire technique. Le produit ou la prestation (boisson, plat, activité) est vendu par l'établissement concerné : le contrat de vente est conclu directement entre toi et l'établissement. Happyvo met l'outil à disposition, encaisse le paiement par l'intermédiaire de son prestataire de paiement et le reverse à l'établissement.",
    ],
  },
  {
    titre: "Accès au service et compte",
    paragraphes: [
      "Pour acheter une offre, il faut créer un compte avec une adresse e-mail valide et accepter les présentes conditions et la politique de confidentialité. L'âge minimum pour créer un compte est de [À VALIDER AVEC UN JURISTE : 15 ou 18 ans].",
      "Tu es responsable de la confidentialité de ton mot de passe et de l'activité de ton compte. Les informations que tu donnes doivent être exactes. Un compte ne peut pas être cédé.",
      "Tu peux supprimer ton compte à tout moment depuis « Mon compte », rubrique « Mes données ». Les conséquences sont décrites dans la politique de confidentialité.",
    ],
  },
  {
    titre: "Les offres",
    paragraphes: [
      "Chaque offre est publiée par un établissement, pour une durée limitée et dans la limite d'une quantité disponible. L'offre indique le produit ou la prestation, le prix habituel, le prix réduit toutes taxes comprises, l'heure de début et de fin et la quantité restante. Une offre peut prendre fin avant l'heure prévue si la quantité est épuisée ou si l'établissement l'arrête.",
      "Les informations des offres et des établissements (horaires, descriptions, photos) sont fournies par les établissements, qui en sont responsables. Une offre n'est pas une réservation : elle est garantie uniquement une fois la commande payée.",
    ],
  },
  {
    titre: "Commande, paiement et retrait",
    paragraphes: [
      "La commande est confirmée lorsque le paiement est accepté. Le paiement se fait en ligne par carte bancaire, par l'intermédiaire de Stripe, prestataire de paiement agréé. Happyvo n'a pas accès à ton numéro de carte complet.",
      "Après le paiement, un QR code est généré dans « Mes commandes ». Il doit être présenté à l'établissement, pendant la durée de validité indiquée sur la commande, pour obtenir le produit ou la prestation. Le QR code est personnel : ne le partage pas. Une commande non retirée avant la fin de sa validité expire.",
      "Les prix sont indiqués en euros, toutes taxes comprises. Aucun frais supplémentaire n'est ajouté au prix affiché pour le client. [À CONFIRMER : absence de frais pour le client]",
    ],
  },
  {
    titre: "Droit de rétractation",
    paragraphes: [
      "Les produits proposés sont des denrées susceptibles de se détériorer rapidement et des prestations de restauration ou de loisirs fournies à une date ou à une période déterminée. Conformément à l'article L.221-28 du Code de la consommation, le droit de rétractation de 14 jours ne s'applique donc pas à ces commandes. [À FAIRE VÉRIFIER PAR UN JURISTE]",
      "Cela ne te prive pas des garanties légales ni de la possibilité de signaler un problème, décrite ci-dessous.",
    ],
  },
  {
    titre: "Un problème avec ta commande ?",
    paragraphes: [
      "Si tu n'as pas été servi, si le produit n'est pas le bon ou s'il présente un problème de qualité, tu peux le signaler depuis l'application (« Mon compte », puis « Signaler un problème »), dans un délai de [À CONFIRMER : 7 jours] après la commande.",
      "L'établissement examine ta demande et peut décider de te rembourser. En cas de remboursement, il est effectué sur le moyen de paiement utilisé, dans un délai qui dépend de ta banque. Happyvo peut intervenir en cas de désaccord ou de problème répété avec un établissement.",
    ],
  },
  {
    titre: "Alcool",
    paragraphes: [
      "La vente d'alcool aux mineurs est interdite. En achetant une boisson alcoolisée, tu confirmes avoir 18 ans ou plus. L'établissement peut te demander une pièce d'identité au moment du retrait et refuser de te servir, sans remboursement, si tu ne peux pas justifier de ta majorité.",
      "L'abus d'alcool est dangereux pour la santé, à consommer avec modération. Les établissements qui proposent des boissons alcoolisées déclarent détenir la licence correspondante, que Happyvo contrôle avant d'autoriser la publication de telles offres.",
    ],
  },
  {
    titre: "Règles pour les établissements partenaires",
    paragraphes: [
      "Un établissement qui publie des offres s'engage à : fournir des informations exactes ; honorer toutes les commandes payées pendant la durée de validité ; respecter la réglementation qui lui est applicable (hygiène, sécurité, licences, prix, information du consommateur) ; ne publier des boissons alcoolisées que s'il détient la licence nécessaire, dont le numéro est vérifié par Happyvo.",
      "L'établissement est rémunéré par le versement du prix payé par le client, diminué d'une commission de Happyvo de [À CONFIRMER : 5 %] du prix, prélevée automatiquement lors du paiement. Le versement passe par Stripe : l'établissement doit créer et maintenir un compte de paiement Stripe valide, et accepter les conditions de Stripe.",
      "Happyvo peut masquer une offre, suspendre ou supprimer un établissement qui ne respecte pas ces règles ou qui fait l'objet de signalements répétés.",
    ],
  },
  {
    titre: "Responsabilité",
    paragraphes: [
      "Happyvo n'est pas responsable de la qualité, de la conformité ni de la disponibilité des produits et prestations vendus par les établissements, ni de leurs horaires ou de leur fermeture. Sa responsabilité en tant qu'intermédiaire est limitée à ce que prévoit la loi.",
      "Happyvo s'efforce de rendre le service accessible en continu mais ne peut pas garantir l'absence d'interruption (maintenance, panne, force majeure).",
    ],
  },
  {
    titre: "Propriété intellectuelle",
    paragraphes: [
      "La marque Happyvo, l'application, son design et ses textes sont protégés. Les photos et descriptions des établissements restent leur propriété ; ils autorisent Happyvo à les afficher dans l'application.",
    ],
  },
  {
    titre: "Données personnelles",
    paragraphes: [
      "Le traitement de tes données est décrit dans la politique de confidentialité, accessible depuis l'application et à l'adresse /confidentialite.",
    ],
  },
  {
    titre: "Médiation de la consommation",
    paragraphes: [
      "En cas de litige non résolu avec Happyvo, tu peux, après avoir d'abord contacté Happyvo par écrit, saisir gratuitement le médiateur de la consommation : [À COMPLÉTER : nom, adresse postale et site internet du médiateur auquel Happyvo adhère].",
    ],
  },
  {
    titre: "Modification des conditions, droit applicable",
    paragraphes: [
      "Happyvo peut modifier ces conditions. En cas de modification importante, il te sera demandé de les accepter à nouveau. Les présentes conditions sont soumises au droit français. Sauf règle impérative contraire, les tribunaux français sont compétents.",
    ],
  },
];


export default function PageConditions() {
  return (
    <PageLegale
      titre="Conditions générales d'utilisation et de vente"
      miseAJour={DATE_MISE_A_JOUR}
      introduction="En utilisant Happyvo, tu acceptes ces conditions. Elles s'adressent aux clients et aux établissements partenaires."
      sections={SECTIONS}
    />
  );
}
