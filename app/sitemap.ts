import type { MetadataRoute } from "next";
import { URL_SITE } from "./lib/presentation";

// Le plan du site : la liste des pages publiques.
// Pas de date de modification volontairement : lire la date du jour ici ferait une erreur avec cacheComponents.
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["/", "/presentation", "/gerants", "/conditions", "/confidentialite", "/mentions-legales"];
  return pages.map((chemin) => ({ url: URL_SITE + chemin }));
}
