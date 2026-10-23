export default function RaccourcisGerant() {

  return (

    <div className="my-4 grid gap-3 sm:grid-cols-3">

      <a

        href="/gerant/scanner"

        className="rounded-xl bg-rose-600 p-4 text-center font-semibold text-white"

      >

        Scanner un QR code

      </a>

      <a

        href="/gerant/historique"

        className="rounded-xl border border-gray-300 p-4 text-center font-semibold"

      >

        Historique des ventes

      </a>

      <a

        href="/gerant/statistiques"

        className="rounded-xl border border-gray-300 p-4 text-center font-semibold"

      >

        Statistiques

      </a>

    </div>

  );

}
