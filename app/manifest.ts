
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {

  return {

    name: "Offres en direct",

    short_name: "Offres",

    description: "Les bars et restaurants qui cassent les prix, là, maintenant.",

    start_url: "/",

    display: "standalone",

    background_color: "#ffffff",

    theme_color: "#e11d48",

  };

}
