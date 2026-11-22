const CONTACT = "ton-adresse@exemple.fr";

function Provisoire() {

  return (

    <p className="mt-2 rounded bg-amber-50 p-2 text-xs text-amber-900">

      {"Texte provisoire : il sera rédigé et validé avec un avocat avant le lancement."}

    </p>

  );

}

export default function PageInfos() {

  return (

    <main className="min-h-screen bg-white text-gray-900">

      <div className="mx-auto max-w-md space-y-10 p-4 pb-16">

        <a href="/?onglet=profil" className="text-sm text-gray-500 underline">

          ← Retour au profil

        </a>

        <section id="aide">

          <h2 className="text-xl font-bold">Aide et contact</h2>

          <p className="mt-2 text-sm">Comment ça marche :</p>

          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">

            <li>{"Choisis une offre sur la carte ou dans la liste."}</li>

            <li>{"Paie en ligne, en quelques secondes."}</li>

            <li>{"Retrouve ton QR code dans Profil, puis Commandes."}</li>

            <li>{"Montre-le au comptoir avant l'heure limite indiquée."}</li>

          </ol>

          <p className="mt-3 text-sm">

            {"Une question, un problème avec une commande ? Écris-nous : "}

            <a href={"mailto:" + CONTACT} className="underline">

              {CONTACT}

            </a>

          </p>

        </section>

        <section id="confidentialite">

          <h2 className="text-xl font-bold">Confidentialité et mes données</h2>

          <p className="mt-2 text-sm">

            {"Happyvo enregistre ton prénom, ton adresse e-mail, ta date de naissance (pour vérifier que tu as 18 ans), tes favoris et tes commandes. Si tu actives les alertes près de chez toi, ta position est enregistrée de façon arrondie (environ 100 mètres) et n'est jamais suivie en continu."}

          </p>

          <p className="mt-2 text-sm">

            {"Tu peux supprimer ton profil et tes favoris à tout moment depuis Profil, puis « Supprimer mes données »."}

          </p>

          <Provisoire />

        </section>

        <section id="conditions">

          <h2 className="text-xl font-bold">{"Conditions d'utilisation"}</h2>

          <p className="mt-2 text-sm">

            {"Happyvo est réservé aux personnes majeures (18 ans et plus). Les offres sont publiées par les bars et restaurants, qui en sont responsables."}

          </p>

          <Provisoire />

        </section>

        <section id="vente">

          <h2 className="text-xl font-bold">Conditions de vente</h2>

          <p className="mt-2 text-sm">

            {"Le paiement se fait en ligne. Le produit est à retirer au comptoir avec ton QR code, avant l'heure limite affichée dans ta commande. Une commande non retirée à temps n'est pas remboursée automatiquement. En cas de problème (bar fermé, produit indisponible), contacte-nous : chaque situation est étudiée."}

          </p>

          <p className="mt-2 text-sm">

            {"Le bar peut te demander une pièce d'identité au moment du retrait."}

          </p>

          <Provisoire />

        </section>

        <section id="mentions">

          <h2 className="text-xl font-bold">Mentions légales</h2>

          <p className="mt-2 text-sm">{"Éditeur : à compléter (étape 10)."}</p>

          <p className="mt-1 text-sm">{"Hébergement : Vercel (site) et Supabase (base de données)."}</p>

          <Provisoire />

        </section>

        <section id="apropos">

          <h2 className="text-xl font-bold">À propos de Happyvo</h2>

          <p className="mt-2 text-sm">

            {"Happyvo, ce sont les bars et restaurants qui cassent les prix, là, maintenant."}

          </p>

        </section>

        <p className="text-center text-xs text-gray-500">

          {"L'abus d'alcool est dangereux pour la santé, à consommer avec modération. Vente d'alcool interdite aux mineurs."}

        </p>

      </div>

    </main>

  );

}
