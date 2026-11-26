import Link from "next/link";

export type SectionVitrine = { titre: string; paragraphes?: string[]; points?: string[] };
export type BoutonVitrine = { texte: string; lien: string; principal?: boolean };

type Props = {
  titre: string;
  accroche: string;
  boutons: BoutonVitrine[];
  sections: SectionVitrine[];
};

// L'étoile de Happyvo (la même que l'icône et l'animation d'ouverture de l'étape 9 bis).
const ETOILE =
  "M-20.9 -148.5 Q15.2 -20.1 148.5 -20.9 Q20.1 15.2 20.9 148.5 Q-15.2 20.1 -148.5 20.9 Q-20.1 -15.2 -20.9 -148.5 Z";

function Etoile() {
  return (
    <svg aria-hidden="true" width="44" height="44" viewBox="-175 -175 360 360" style={{ overflow: "visible" }}>
      <path transform="translate(8 8)" fill="#14193C" d={ETOILE} />
      <path fill="#E2372D" stroke="#14193C" strokeWidth={7} strokeLinejoin="round" d={ETOILE} />
      <circle cx={-19} cy={-16} r={8} fill="#FFF4E2" />
      <circle cx={19} cy={-16} r={8} fill="#FFF4E2" />
      <path d="M-31 13 A33 27.6 0 0 0 31 13" fill="none" stroke="#FFF4E2" strokeWidth={12.6} />
    </svg>
  );
}

// Mise en page commune des pages publiques : un bandeau, des boutons, des sections.
export default function PageVitrine({ titre, accroche, boutons, sections }: Props) {
  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-white pb-16 text-[#14193C]">
      <header className="bg-[#00AAA0] px-5 pb-8 pt-10 text-white">
        <div className="flex items-center gap-3">
          <Etoile />
          <p className="text-lg font-extrabold uppercase tracking-wide">Happyvo</p>
        </div>
        <h1 className="mt-4 text-3xl font-extrabold leading-tight">{titre}</h1>
        <p className="mt-3 text-lg leading-snug">{accroche}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          {boutons.map((bouton) => (
            <Link
              key={bouton.texte}
              href={bouton.lien}
              className={
                bouton.principal
                  ? "rounded-full bg-white px-5 py-3 text-base font-bold text-[#007F77]"
                  : "rounded-full border-2 border-white px-5 py-3 text-base font-bold text-white"
              }
            >
              {bouton.texte}
            </Link>
          ))}
        </div>
      </header>

      <div className="px-5 pt-6">
        {sections.map((section) => (
          <section key={section.titre} className="mb-7">
            <h2 className="mb-2 text-xl font-extrabold">{section.titre}</h2>
            {section.paragraphes?.map((texte, i) => (
              <p key={i} className="mb-2 text-base leading-relaxed">
                {texte}
              </p>
            ))}
            {section.points && (
              <ul className="mt-1 space-y-2">
                {section.points.map((point) => (
                  <li key={point} className="flex gap-3 text-base leading-relaxed">
                    <span aria-hidden="true" className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#00AAA0]" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <nav
          aria-label="Liens utiles"
          className="mt-8 flex flex-wrap gap-x-4 gap-y-2 border-t border-[#DDE0EE] pt-4 text-sm font-semibold text-[#007F77]"
        >
          <Link href="/" className="underline">Ouvrir l'appli</Link>
          <Link href="/presentation" className="underline">À propos</Link>
          <Link href="/gerants" className="underline">Pour les établissements</Link>
          <Link href="/conditions" className="underline">Conditions générales</Link>
          <Link href="/confidentialite" className="underline">Confidentialité</Link>
          <Link href="/mentions-legales" className="underline">Mentions légales</Link>
        </nav>
      </div>
    </main>
  );
}
