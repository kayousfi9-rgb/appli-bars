
"use client";

import { useEffect, useState } from "react";

import { Jost } from "next/font/google";

const jost = Jost({ subsets: ["latin"], weight: "500" });

const TURQUOISE = "#00AAA0";

const TOMATE = "#E2372D";

const CREME = "#FFF4E2";

const NUIT = "#14193C";

// Durées en millisecondes

const DUREE_SAUTS = 3400;

const DUREE_FONDU = 450;

// Écart entre le saut de chaque élément, en secondes.

// 0.08 = la vague. Mets 0 pour que tout saute en même temps.

const ECART = 0.08;

const ETOILE =

  "M-20.9 -148.5 Q15.2 -20.1 148.5 -20.9 Q20.1 15.2 20.9 148.5 Q-15.2 20.1 -148.5 20.9 Q-20.1 -15.2 -20.9 -148.5 Z";

const STYLE = `

.hv-saut {

  display: inline-block;

  transform-origin: 50% 100%;

  animation: hv-saut 0.7s ease-in-out 4 both;

}

.hv-lettre {

  font-size: 58px;

  line-height: 1;

  -webkit-text-stroke: 3px ${NUIT};

  paint-order: stroke fill;

  text-shadow: 4px 4px 0 ${NUIT};

}

@keyframes hv-saut {

  0%   { transform: translateY(0) scale(1, 1); }

  15%  { transform: translateY(0) scale(1.1, 0.9); }

  50%  { transform: translateY(-24px) scale(0.95, 1.06); }

  82%  { transform: translateY(0) scale(1.08, 0.92); }

  100% { transform: translateY(0) scale(1, 1); }

}

`;

const LETTRES_HAPPY = ["H", "a", "p", "p", "y"];

const LETTRES_VO = ["v", "o"];

export default function IntroAnimation() {

  const [etape, setEtape] = useState<"anime" | "fondu" | "termine">("anime");

  useEffect(() => {

    let dejaVue = false;

    try {

      dejaVue = sessionStorage.getItem("happyvo-intro") === "vue";

    } catch {

      // Stockage indisponible (navigation privée) : on joue l'animation

    }

    const mouvementReduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (dejaVue || mouvementReduit) {

      setEtape("termine");

      return;

    }

    const minuteurFondu = setTimeout(() => setEtape("fondu"), DUREE_SAUTS);

    const minuteurFin = setTimeout(() => {

      setEtape("termine");

      try {

        sessionStorage.setItem("happyvo-intro", "vue");

      } catch {

        // Rien à faire

      }

    }, DUREE_SAUTS + DUREE_FONDU);

    return () => {

      clearTimeout(minuteurFondu);

      clearTimeout(minuteurFin);

    };

  }, []);

  function passer() {

    setEtape("termine");

    try {

      sessionStorage.setItem("happyvo-intro", "vue");

    } catch {

      // Rien à faire

    }

  }

  if (etape === "termine") return null;

  return (

    <div

      aria-hidden="true"

      onClick={passer}

      className={jost.className}

      style={{

        position: "fixed",

        inset: 0,

        zIndex: 9999,

        display: "flex",

        alignItems: "center",

        justifyContent: "center",

        backgroundColor: TURQUOISE,

        opacity: etape === "fondu" ? 0 : 1,

        transition: "opacity " + DUREE_FONDU + "ms ease",

      }}

    >

      <style>{STYLE}</style>

      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>

        <svg

          className="hv-saut"

          width="120"

          height="120"

          viewBox="-175 -175 360 360"

          style={{ animationDelay: "0s", overflow: "visible" }}

        >

          <path transform="translate(8 8)" fill={NUIT} d={ETOILE} />

          <path fill={TOMATE} stroke={NUIT} strokeWidth={7} strokeLinejoin="round" d={ETOILE} />

          <circle cx={-19} cy={-16} r={8} fill={CREME} />

          <circle cx={19} cy={-16} r={8} fill={CREME} />

          <path d="M-31 13 A33 27.6 0 0 0 31 13" fill="none" stroke={CREME} strokeWidth={12.6} />

        </svg>

        <div>

          <div>

            {LETTRES_HAPPY.map((lettre, i) => (

              <span

                key={"happy-" + i}

                className="hv-saut hv-lettre"

                style={{ color: CREME, animationDelay: (i + 1) * ECART + "s" }}

              >

                {lettre}

              </span>

            ))}

          </div>

          <div style={{ marginTop: 6 }}>

            {LETTRES_VO.map((lettre, i) => (

              <span

                key={"vo-" + i}

                className="hv-saut hv-lettre"

                style={{ color: TOMATE, animationDelay: (i + 6) * ECART + "s" }}

              >

                {lettre}

              </span>

            ))}

          </div>

        </div>

      </div>

    </div>

  );

}
