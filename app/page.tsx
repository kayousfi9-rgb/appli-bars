import { Suspense } from "react";
import ChargementsBars from "./components/ChargementsBars";
export default function Accueil() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-6xl p-4">
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">🍻 Les offres en direct près de toi</h1>
            <p className="text-sm text-gray-600">Les bars qui cassent les prix, là, maintenant.</p>
          </div>
          <a
            href="/gerant"
            className="shrink-0 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium"
          >
            Je suis un bar
          </a>
        </header>

        <Suspense
          fallback={<p className="py-10 text-center text-gray-500">Chargement des offres…</p>}
        >
          <ChargementsBars />
        </Suspense>
      </div>
    </main>
  );
}
