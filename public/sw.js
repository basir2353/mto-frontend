self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "You have a new MoveThisOut update." };
  }

  const title = payload.title || "MoveThisOut";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || "You have a new update.",
      icon: "/mto-icon.png",
      badge: "/mto-badge.png",
      tag: payload.tag || "mto-update",
      renotify: true,
      vibrate: [80, 40, 80],
      data: {
        url: payload.url || "/",
        ...payload.data,
      },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "/", self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return self.clients.openWindow ? self.clients.openWindow(targetUrl) : undefined;
    }),
  );
});
