import { supabase } from "./supabase";

export type EtatPush = "non_supporte" | "refuse" | "actif" | "inactif";

// Ce navigateur sait-il recevoir des notifications push ?

export function pushSupporte(): boolean {

  return (

    typeof window !== "undefined" &&

    "serviceWorker" in navigator &&

    "PushManager" in window &&

    "Notification" in window

  );

}

// La clé publique VAPID est écrite en « base64url » : on la transforme

// dans le format attendu par le navigateur.

function cleVersBuffer(cle: string): ArrayBuffer {

  const remplissage = "=".repeat((4 - (cle.length % 4)) % 4);

  const base64 = (cle + remplissage).replace(/-/g, "+").replace(/_/g, "/");

  const brut = window.atob(base64);

  const buffer = new ArrayBuffer(brut.length);

  const vue = new Uint8Array(buffer);

  for (let i = 0; i < brut.length; i++) {

    vue[i] = brut.charCodeAt(i);

  }

  return buffer;

}

// Où en est cet appareil ?

export async function etatPush(): Promise<EtatPush> {

  if (!pushSupporte()) return "non_supporte";

  if (Notification.permission === "denied") return "refuse";

  const enregistrement = await navigator.serviceWorker.getRegistration();

  const abonnement = await enregistrement?.pushManager.getSubscription();

  return abonnement ? "actif" : "inactif";

}

// Activer les notifications sur cet appareil.

export async function activerPush(

  clientId: string

): Promise<"actif" | "refuse" | "non_supporte" | "erreur"> {

  if (!pushSupporte()) return "non_supporte";

  const cle = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!cle) return "erreur";

  try {

    // 1) On demande la permission (la petite fenêtre « Autoriser / Bloquer »).

    const permission = await Notification.requestPermission();

    if (permission !== "granted") return "refuse";

    // 2) On installe le service worker (public/sw.js).

    const enregistrement = await navigator.serviceWorker.register("/sw.js");

    await navigator.serviceWorker.ready;

    // 3) On récupère l'adresse unique de cet appareil.

    let abonnement = await enregistrement.pushManager.getSubscription();

    if (!abonnement) {

      abonnement = await enregistrement.pushManager.subscribe({

        userVisibleOnly: true,

        applicationServerKey: cleVersBuffer(cle),

      });

    }

    // 4) On la range dans la base.

    const json = abonnement.toJSON();

    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return "erreur";

    const { error } = await supabase.from("abonnements_push").upsert(

      {

        client_id: clientId,

        endpoint: json.endpoint,

        p256dh: json.keys.p256dh,

        auth: json.keys.auth,

      },

      { onConflict: "endpoint" }

    );

    return error ? "erreur" : "actif";

  } catch {

    return "erreur";

  }

}

// Couper les notifications sur cet appareil.

export async function desactiverPush(): Promise<void> {

  if (!pushSupporte()) return;

  const enregistrement = await navigator.serviceWorker.getRegistration();

  const abonnement = await enregistrement?.pushManager.getSubscription();

  if (abonnement) {

    await supabase.from("abonnements_push").delete().eq("endpoint", abonnement.endpoint);

    await abonnement.unsubscribe();

  }

}
