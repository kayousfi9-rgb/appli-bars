import { supabase } from "./lib/supabase";
type Bar = {

  nom: string;

  adresse: string;

  type_bar: string | null;

  terrasse: boolean | null;

};

type Offre = {

  id: string;

  produit: string;

  type_boisson: string;

  prix_normal: number;

  prix_reduit: number;

  fin: string;

  quantite: number;

  bars: Bar | null;

};

type Match = {

  id: string;

  intitule: string;

  date_heure: string;

  bars: { nom: string } | null;

};

function formatHeure(date: string) {

  return new Date(date).toLocaleString("fr-FR", {

    weekday: "short",

    day: "numeric",

    month: "short",

    hour: "2-digit",

    minute: "2-digit",

    timeZone: "Europe/Paris",

  });

}

function formatPrix(prix: number) {

  return Number(prix).toLocaleString("fr-FR", {

    style: "currency",

    currency: "EUR",

  });

}

export default async function Accueil() {

  const maintenant = new Date().toISOString();

  const { data: offresData, error: erreurOffres } = await supabase

    .from("offres")

    .select(

      "id, produit, type_boisson, prix_normal, prix_reduit, fin, quantite, bars(nom, adresse, type_bar, terrasse)"

    )

    .lte("debut", maintenant)

    .gt("fin", maintenant)

    .order("fin", { ascending: true });

  const { data: matchsData, error: erreurMatchs } = await supabase

    .from("matchs")

    .select("id, intitule, date_heure, bars(nom)")

    .gt("date_heure", maintenant)

    .order("date_heure", { ascending: true });

  const offres = (offresData ?? []) as unknown as Offre[];

  const matchs = (matchsData ?? []) as unknown as Match[];

  const erreur = erreurOffres ?? erreurMatchs;

  return (

    <main className="min-h-screen bg-neutral-950 text-white px-4 py-8">

      <div className="mx-auto max-w-xl">

        <h1 className="text-3xl font-bold">Les offres en direct</h1>

        <p className="mt-1 text-neutral-400">

          Les bons plans des bars, en ce moment.

        </p>

        {erreur && (

          <p className="mt-6 rounded-lg bg-red-900/50 p-4 text-red-200">

            Erreur de connexion à la base : {erreur.message}

          </p>

        )}

        <section className="mt-8">

          <h2 className="text-xl font-semibold">Offres en cours</h2>

          {offres.length === 0 && !erreur && (

            <p className="mt-3 text-neutral-400">

              Aucune offre en cours pour le moment.

            </p>

          )}

          <ul className="mt-3 space-y-3">

            {offres.map((offre) => (

              <li

                key={offre.id}

                className="rounded-xl border border-neutral-800 bg-neutral-900 p-4"

              >

                <div className="flex items-start justify-between gap-4">

                  <div>

                    <p className="text-lg font-semibold">{offre.produit}</p>

                    <p className="text-sm text-neutral-400">

                      {offre.bars?.nom} · {offre.bars?.adresse}

                    </p>

                    <p className="mt-1 text-xs text-neutral-500">

                      {offre.type_boisson}

                      {offre.bars?.type_bar ? ` · ${offre.bars.type_bar}` : ""}

                      {offre.bars?.terrasse ? " · terrasse" : ""}

                    </p>

                  </div>

                  <div className="text-right">

                    <p className="text-xl font-bold text-amber-400">

                      {formatPrix(offre.prix_reduit)}

                    </p>

                    <p className="text-sm text-neutral-500 line-through">

                      {formatPrix(offre.prix_normal)}

                    </p>

                  </div>

                </div>

                <p className="mt-2 text-xs text-neutral-400">

                  Jusqu&apos;à {formatHeure(offre.fin)} · {offre.quantite} disponibles

                </p>

              </li>

            ))}

          </ul>

        </section>

        <section className="mt-10">

          <h2 className="text-xl font-semibold">Matchs à venir</h2>

          {matchs.length === 0 && !erreur && (

            <p className="mt-3 text-neutral-400">Aucun match annoncé.</p>

          )}

          <ul className="mt-3 space-y-3">

            {matchs.map((match) => (

              <li

                key={match.id}

                className="rounded-xl border border-neutral-800 bg-neutral-900 p-4"

              >

                <p className="font-semibold">{match.intitule}</p>

                <p className="text-sm text-neutral-400">

                  {match.bars?.nom} · {formatHeure(match.date_heure)}

                </p>

              </li>

            ))}

          </ul>

        </section>

        <p className="mt-12 text-center text-xs text-neutral-600">

          L&apos;abus d&apos;alcool est dangereux pour la santé, à consommer avec modération.

          Vente d&apos;alcool interdite aux mineurs.

        </p>

      </div>

    </main>

  );

}
