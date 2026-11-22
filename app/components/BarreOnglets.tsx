"use client";

export type Onglet = "carte" | "liste" | "profil";

type Props = {

  actif: Onglet;

  onChange: (onglet: Onglet) => void;

  initiale: string | null;

};

const ONGLETS: { id: Onglet; libelle: string }[] = [

  { id: "carte", libelle: "Carte" },

  { id: "liste", libelle: "Liste" },

  { id: "profil", libelle: "Profil" },

];

function IconeCarte() {

  return (

    <svg

      width="26"

      height="26"

      viewBox="0 0 24 24"

      fill="none"

      stroke="currentColor"

      strokeWidth="2"

      strokeLinecap="round"

      strokeLinejoin="round"

      aria-hidden="true"

    >

      <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />

      <circle cx="12" cy="10" r="2.5" />

    </svg>

  );

}

function IconeListe() {

  return (

    <svg

      width="26"

      height="26"

      viewBox="0 0 24 24"

      fill="none"

      stroke="currentColor"

      strokeWidth="2"

      strokeLinecap="round"

      strokeLinejoin="round"

      aria-hidden="true"

    >

      <path d="M8 6h13M8 12h13M8 18h13" />

      <path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" />

    </svg>

  );

}

function IconeProfil({ initiale, actif }: { initiale: string | null; actif: boolean }) {

  if (initiale) {

    return (

      <span

        className="flex items-center justify-center text-sm font-bold"

        style={{

          width: 26,

          height: 26,

          borderRadius: 999,

          background: actif ? "var(--hv-accent)" : "var(--hv-texte-doux)",

          color: "var(--hv-fond)",

        }}

      >

        {initiale}

      </span>

    );

  }

  return (

    <svg

      width="26"

      height="26"

      viewBox="0 0 24 24"

      fill="none"

      stroke="currentColor"

      strokeWidth="2"

      strokeLinecap="round"

      strokeLinejoin="round"

      aria-hidden="true"

    >

      <circle cx="12" cy="8" r="4" />

      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />

    </svg>

  );

}

export default function BarreOnglets({ actif, onChange, initiale }: Props) {

  return (

    <nav

      aria-label="Navigation principale"

      className="fixed inset-x-0 bottom-0 z-[1400] flex border-t"

      style={{

        background: "var(--hv-fond)",

        borderColor: "var(--hv-bord)",

        paddingBottom: "env(safe-area-inset-bottom)",

      }}

    >

      {ONGLETS.map((onglet) => {

        const estActif = onglet.id === actif;

        return (

          <button

            key={onglet.id}

            type="button"

            onClick={() => onChange(onglet.id)}

            aria-current={estActif ? "page" : undefined}

            className="flex h-16 flex-1 flex-col items-center justify-center gap-1 text-xs font-semibold"

            style={{ color: estActif ? "var(--hv-accent)" : "var(--hv-texte-doux)" }}

          >

            {onglet.id === "carte" && <IconeCarte />}

            {onglet.id === "liste" && <IconeListe />}

            {onglet.id === "profil" && <IconeProfil initiale={initiale} actif={estActif} />}

            <span>{onglet.libelle}</span>

          </button>

        );

      })}

    </nav>

  );

}
