import type { MetadataRoute } from "next";

// Ce fichier décrit Happyvo au téléphone : son nom, ses couleurs et ses icônes.
// C'est lui qui permet de l'installer sur l'écran d'accueil comme une vraie appli.
// background_color est la couleur de l'écran de démarrage (le turquoise du logo).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Happyvo",
    short_name: "Happyvo",
    description: "Les bonnes affaires autour de toi, en direct : boissons, plats, sport et sorties à prix réduit.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "fr",
    background_color: "#00AAA0",
    theme_color: "#00AAA0",
    categories: ["food", "lifestyle", "shopping"],
    icons: [
      { src: "/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icone-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

