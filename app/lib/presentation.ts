// Les trois réglages que tu dois connaître avant le lancement.

// L'adresse e-mail affichée sur les pages publiques (contact des établissements).
// Remplace le texte entre guillemets par ton adresse de contact (celle que tu acceptes de rendre publique).
export const EMAIL_CONTACT = "kayousfi9@gmail.com";

// L'adresse de la page où un gérant crée son compte.
// C'est la page /gerant : elle propose « Connexion gérant » et « Créer mon compte gérant ».
export const LIEN_INSCRIPTION_GERANT = "/gerant";

// L'adresse du site en ligne, sans barre oblique à la fin (par exemple "https://happyvo.vercel.app").
// Ne la modifie pas ici : elle vient de la variable NEXT_PUBLIC_SITE_URL (voir I.5.3).
export const URL_SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
