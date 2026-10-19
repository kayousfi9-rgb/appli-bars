import { Suspense } from "react";
import ChargementBars from "./components/ChargementsBars";

export default function Accueil() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-6xl p-4">
        <header className="mb-4">
          <h1 className="text-2xl font-bold">🍻 Les offres en direct près de toi</h1>
          <p className="text-sm text-gray-600">Les bars qui cassent les prix, là, maintenant.</p>
        </header>

        <Suspense
          fallback={<p className="py-10 text-center text-gray-500">Chargement des offres…</p>}
        >
          <ChargementBars />
        </Suspense>
      </div>
    </main>
  );
}