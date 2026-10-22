import EspaceScanner from "../../components/gerant/EspaceScanner";

export default function PageScanner() {

  return (

    <main className="min-h-screen bg-white text-gray-900">

      <div className="mx-auto max-w-md p-4">

        <a href="/gerant" className="text-sm text-gray-500 underline">

          ← Retour à mon espace

        </a>

        <h1 className="mb-4 mt-2 text-2xl font-bold">Scanner une commande</h1>

        <EspaceScanner />

      </div>

    </main>

  );

}
