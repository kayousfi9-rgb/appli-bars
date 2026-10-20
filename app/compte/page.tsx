import EspaceClient from "../components/client_temporaire/EspaceClient";

export default function PageCompte() {

  return (

    <main className="min-h-screen bg-white text-gray-900">

      <div className="mx-auto max-w-2xl p-4">

        <a href="/" className="text-sm text-gray-500 underline">

          ← Retour aux offres

        </a>

        <h1 className="mt-2 text-2xl font-bold">Mon compte</h1>

        <p className="mb-6 text-sm text-gray-600">

          Tes favoris et tes commandes, au même endroit.

        </p>

        <EspaceClient />

      </div>

    </main>

  );

}
