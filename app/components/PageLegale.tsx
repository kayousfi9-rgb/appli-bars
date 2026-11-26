import Link from "next/link";


export type SectionLegale = { titre: string; paragraphes: string[] };


type Props = {
  titre: string;
  miseAJour: string;
  introduction?: string;
  sections: SectionLegale[];
};


// Mise en page commune aux trois pages légales : titre, date, puis des sections numérotées.
export default function PageLegale({ titre, miseAJour, introduction, sections }: Props) {
  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-white px-4 pb-16 pt-4 text-[#14193C]">
      <Link href="/" className="text-sm font-semibold text-[#007F77] underline">
        ← Retour à Happyvo
      </Link>
      <h1 className="mb-1 mt-3 text-2xl font-extrabold">{titre}</h1>
      <p className="mb-4 text-sm text-[#5A6080]">Dernière mise à jour : {miseAJour}</p>
      {introduction && <p className="mb-4 text-base leading-relaxed">{introduction}</p>}
      {sections.map((section, i) => (
        <section key={section.titre} className="mb-5">
          <h2 className="mb-2 text-lg font-bold">
            {i + 1}. {section.titre}
          </h2>
          {section.paragraphes.map((texte, j) => (
            <p key={j} className="mb-2 text-base leading-relaxed">
              {texte}
            </p>
          ))}
        </section>
      ))}
      <nav aria-label="Autres documents" className="mt-8 flex flex-wrap gap-3 border-t border-[#DDE0EE] pt-4 text-sm font-semibold text-[#007F77]">
        <Link href="/conditions" className="underline">Conditions générales</Link>
        <Link href="/confidentialite" className="underline">Confidentialité</Link>
        <Link href="/mentions-legales" className="underline">Mentions légales</Link>
      </nav>
    </main>
  );
}
