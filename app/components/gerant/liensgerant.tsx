import Link from "next/link";
import PorteConditions from "../PorteConditions";


// La petite barre de liens en haut des pages gérant (étapes C, D, E).
// Elle contient aussi l'écran d'acceptation des conditions, qui n'apparaît que si besoin.
const LIENS = [
  { href: "/equipe", texte: "Comptoir" },
  { href: "/gerant/planning", texte: "Planning" },
  { href: "/gerant/equipe", texte: "Équipe" },
  { href: "/gerant/etablissement", texte: "Mon lieu" },
  { href: "/gerant/signalements", texte: "Signalements" },
];


export default function LiensGerant() {
  return (
    <>
      <PorteConditions />
      <nav aria-label="Pages du gérant" className="mt-2 flex flex-wrap gap-2">
        {LIENS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-full border border-[#007F77] px-3 py-1 text-sm font-semibold text-[#007F77]"
          >
            {l.texte}
          </Link>
        ))}
      </nav>
    </>
  );
}
