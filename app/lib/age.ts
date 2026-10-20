// Renvoie true si la date de naissance correspond à une personne majeure.

// Le même calcul est refait côté base de données : ici c'est juste pour

// afficher un message clair avant d'envoyer le formulaire.

export function aAuMoins18Ans(dateNaissance: string): boolean {

  if (!dateNaissance) return false;

  const naissance = new Date(dateNaissance);

  if (isNaN(naissance.getTime())) return false;

  const limite = new Date();

  limite.setFullYear(limite.getFullYear() - 18);

  return naissance.getTime() <= limite.getTime();

}

// Date maximale autorisée dans le champ « date de naissance » (format 2008-10-20).

// Ça empêche de choisir une date qui serait de toute façon refusée.

export function dateMaximaleInscription(): string {

  const limite = new Date();

  limite.setFullYear(limite.getFullYear() - 18);

  return limite.toISOString().slice(0, 10);

}

