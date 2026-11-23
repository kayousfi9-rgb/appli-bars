"use client";


export type Onglet = "carte" | "cesoir" | "liste" | "profil";


type Props = {
  actif: Onglet;
  onChange: (onglet: Onglet) => void;
  initiale: string | null; // la lettre affichée dans l'onglet Profil si connecté
};


const ICONE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};


function Icone({ onglet, initiale }: { onglet: Onglet; initiale: string | null }) {
  if (onglet === "carte") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" {...ICONE} aria-hidden="true">
        <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
        <circle cx="12" cy="9.5" r="2.5" />
      </svg>
    );
  }
  if (onglet === "cesoir") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" {...ICONE} aria-hidden="true">
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
      </svg>
    );
  }
  if (onglet === "liste") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" {...ICONE} aria-hidden="true">
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
      </svg>
    );
  }
  if (initiale) {
    return (
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
        style={{ background: "var(--hv-pastille)", color: "#FFFFFF" }}
      >
        {initiale}
      </span>
    );
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" {...ICONE} aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}


const ONGLETS: { id: Onglet; texte: string }[] = [
  { id: "carte", texte: "Carte" },
  { id: "cesoir", texte: "Ce soir" },
  { id: "liste", texte: "Liste" },
  { id: "profil", texte: "Profil" },
];


export default function BarreOnglets({ actif, onChange, initiale }: Props) {
  return (
    <nav
      aria-label="Navigation principale"
      className="absolute inset-x-0 bottom-0 z-[1400] flex border-t"
      style={{
        background: "var(--hv-fond)",
        borderColor: "var(--hv-bord)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {ONGLETS.map((o) => {
        const selectionne = o.id === actif;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-current={selectionne ? "page" : undefined}
            className="flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-semibold"
            style={{ color: selectionne ? "var(--hv-accent)" : "var(--hv-texte-doux)" }}
          >
            <Icone onglet={o.id} initiale={initiale} />
            {o.texte}
          </button>
        );
      })}
    </nav>
  );
}
