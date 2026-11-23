import SignalerProbleme from "../../components/client_temporaire/signalerprobleme";

export default function PageSignaler() {
  return (
    <main className="mx-auto min-h-screen max-w-md bg-white p-4 pb-16 text-[#14193C]">
      <a href="/compte" className="text-sm font-semibold text-[#007F77] underline">
        ← Mon compte
      </a>
      <h1 className="mb-3 mt-3 text-2xl font-extrabold">Signaler un problème</h1>
      <SignalerProbleme />
    </main>
  );
}
