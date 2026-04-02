// Service Worker for Web Push Notifications
// This runs independently of the app - handles push even when app is closed

self.addEventListener("push", (event) => {
  let data = { title: "⏰ Alarme!", body: "Você tem um evento agora" };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || "Você tem um evento agora",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true,
    tag: data.evento_id || "alarm-" + Date.now(),
    renotify: true,
    data: {
      evento_id: data.evento_id,
      timestamp: data.timestamp,
      url: "/",
    },
    actions: [
      { action: "open", title: "Abrir" },
      { action: "dismiss", title: "Descartar" },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title || "⏰ Alarme!", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(event.notification.data?.url || "/");
    })
  );
});

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
