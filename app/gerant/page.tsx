import EspaceGerant from "../components/gerant/EspaceGerant";
export default function PageGerant() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-2xl p-4">
        <a href="/" className="text-sm text-gray-500 underline">
          ← Retour aux offres
        </a>
        <h1 className="mt-2 text-2xl font-bold">Espace gérant</h1>
        <p className="mb-6 text-sm text-gray-600">Publie tes offres en quelques secondes.</p>
        <EspaceGerant />
      </div>
    </main>
  );
}
