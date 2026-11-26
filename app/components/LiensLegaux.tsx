import Link from "next/link";
import InviteInstallation from "./InviteInstallation";

// Sous l'onglet Profil : l'invitation à installer l'appli, puis les liens vers
// la page « Mes données », la présentation et les documents légaux.
export default function LiensLegaux() {
  return (
    <div className="px-4">
      <InviteInstallation />
      <nav aria-label="Documents légaux" className="mx-auto max-w-md pb-28 pt-4 text-sm font-semibold text-[#007F77]">
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <Link href="/compte/donnees" className="underline">Mes données</Link>
          <Link href="/presentation" className="underline">À propos</Link>
          <Link href="/conditions" className="underline">Conditions générales</Link>
          <Link href="/confidentialite" className="underline">Confidentialité</Link>
          <Link href="/mentions-legales" className="underline">Mentions légales</Link>
        </div>
      </nav>
    </div>
  );
}
