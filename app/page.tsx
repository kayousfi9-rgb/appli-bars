import { Suspense } from "react";


import ChargementBars from "./components/ChargementsBars";

import IntroAnimation from "./components/IntroAnimation";

export default function Accueil() {

  return (

    <>

      <IntroAnimation />

      <Suspense

        fallback={

          <div

            className="fixed inset-0 flex items-center justify-center"

            style={{ background: "#00AAA0", color: "#FFF4E2" }}

          >

            Chargement des offres…

          </div>

        }

      >

        <ChargementBars />

      </Suspense>

    </>

  );

}
