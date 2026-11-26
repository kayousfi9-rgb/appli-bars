import Link from "next/link";


// Les liens vers les documents légaux et vers la page « Mes données ».
export default function LiensLegaux() {
  return (
    <nav aria-label="Documents légaux" className="mx-auto max-w-md px-4 pb-28 pt-2 text-sm font-semibold text-[#007F77]">
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        <Link href="/compte/donnees" className="underline">Mes données</Link>
        <Link href="/conditions" className="underline">Conditions générales</Link>
        <Link href="/confidentialite" className="underline">Confidentialité</Link>
        <Link href="/mentions-legales" className="underline">Mentions légales</Link>
      </div>
    </nav>
  );
}
