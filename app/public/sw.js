// Ce fichier tourne dans le navigateur, même quand l'appli est fermée.

// Il reçoit les notifications push et les affiche.

self.addEventListener("push", (event) => {

  let donnees = {};

  try {

    donnees = event.data ? event.data.json() : {};

  } catch (erreur) {

    donnees = { titre: "Nouvelle offre", corps: event.data ? event.data.text() : "" };

  }

  const titre = donnees.titre || "Nouvelle offre";

  const options = {

    body: donnees.corps || "",

    icon: "/favicon.ico",

    data: { lien: donnees.lien || "/" },

  };

  event.waitUntil(self.registration.showNotification(titre, options));

});

// Quand on appuie sur la notification : on ouvre l'appli à la bonne page.

self.addEventListener("notificationclick", (event) => {

  event.notification.close();

  const lien = (event.notification.data && event.notification.data.lien) || "/";

  event.waitUntil(self.clients.openWindow(lien));

});
