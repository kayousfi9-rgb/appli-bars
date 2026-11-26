import type { MetadataRoute } from "next";
import { URL_SITE } from "./lib/presentation";

// Dit aux moteurs de recherche ce qu'ils ont le droit de lister : les pages publiques, pas les espaces privés.
// Attention : "/gerant/" garde sa barre oblique finale, sinon il bloquerait aussi la page publique "/gerants".
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/gerant/", "/equipe", "/compte", "/sentry-test"],
    },
    sitemap: URL_SITE + "/sitemap.xml",
  };
}
