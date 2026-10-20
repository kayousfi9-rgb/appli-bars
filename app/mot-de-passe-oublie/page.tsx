import MotDePasseOublie from "../components/client_temporaire/MotDePasseOublie";

export default function PageMotDePasseOublie() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-md p-4">
        <a href="/" className="text-sm text-gray-500 underline">
          ← Retour aux offres
        </a>
        <h1 className="mb-6 mt-2 text-2xl font-bold">Mot de passe oublié</h1>
        <MotDePasseOublie />
      </div>
    </main>
  );
}