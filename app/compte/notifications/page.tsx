import ReglagesNotifications from "../../components/client_temporaire/ReglagesNotifications";
import ActivationPush from "../../components/client_temporaire/ActivationPush";
import ListeNotifications from "../../components/client_temporaire/ListeNotifications";

export default function PageNotifications() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-md space-y-6 p-4">
        <div>
          <a href="/compte" className="text-sm text-gray-500 underline">
            ← Mon compte
          </a>
          <h1 className="mt-2 text-2xl font-bold">Mes notifications</h1>
        </div>
        <ReglagesNotifications />
        <ActivationPush />
        <ListeNotifications />
      </div>
    </main>
  );
}