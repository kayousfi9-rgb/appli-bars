import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {

  return {

    name: "Happyvo",

    short_name: "Happyvo",

    description: "Les bars et restaurants qui cassent les prix, là, maintenant.",

    start_url: "/",

    display: "standalone",

    background_color: "#00AAA0",

    theme_color: "#00AAA0",

    icons: [

      { src: "/icone-192.png", sizes: "192x192", type: "image/png" },

      { src: "/icone-512.png", sizes: "512x512", type: "image/png" },

      { src: "/icone-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },

    ],

  };

}
