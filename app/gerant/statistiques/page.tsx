import StatistiquesBar from "../../components/gerant/StatistiquesBar";

export default function PageStatistiques() {

  return (

    <main className="min-h-screen bg-white text-gray-900">

      <div className="mx-auto max-w-2xl p-4">

        <a href="/gerant" className="text-sm text-gray-500 underline">

          ← Retour à mon espace

        </a>

        <h1 className="mb-4 mt-2 text-2xl font-bold">Mes statistiques</h1>

        <StatistiquesBar />

      </div>

    </main>

  );

}
