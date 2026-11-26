import MesDonnees from "../../components/client_temporaire/Mesdonnees";

export default function PageDonnees() {
  return (
    <main className="mx-auto min-h-screen max-w-md bg-white p-4 pb-16 text-[#14193C]">
      <a href="/" className="text-sm font-semibold text-[#007F77] underline">
        ← Retour à Happyvo
      </a>
      <h1 className="mb-3 mt-3 text-2xl font-extrabold">Mes données</h1>
      <MesDonnees />
    </main>
  );
}
