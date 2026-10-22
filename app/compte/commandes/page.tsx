import MesCommandes from "../../components/client_temporaire/MesCommandes";

export default function PageMesCommandes() {

  return (

    <main className="min-h-screen bg-white text-gray-900">

      <div className="mx-auto max-w-md p-4">

        <a href="/compte" className="text-sm text-gray-500 underline">

          ← Mon compte

        </a>

        <h1 className="mb-4 mt-2 text-2xl font-bold">Mes commandes</h1>

        <MesCommandes />

      </div>

    </main>

  );

}
