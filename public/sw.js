/* Sans Sucre staff station service worker — precache + nav fallback + push. */
const VERSION = "v2";
const CACHE = `sanssucre-station-${VERSION}`;
const NAV_SHELL = "/redeem";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll([NAV_SHELL])).catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Never cache Supabase API or any cross-origin POST-like endpoints.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/_serverFn") || url.pathname.startsWith("/api/")) return;

  // Navigation requests: network-first, fall back to cached /redeem shell.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => undefined);
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match(NAV_SHELL))),
    );
    return;
  }

  // Static assets: cache-first.
  if (
    url.pathname.startsWith("/assets/") ||
    /\.(?:js|css|png|jpg|jpeg|webp|svg|woff2?|ico)$/.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => undefined);
            }
            return res;
          }),
      ),
    );
  }
});

self.addEventListener("push", (event) => {
  let data = { title: "Sans Sucre", body: "", url: "/admin" };
  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch (_e) {
    try {
      const txt = event.data && event.data.text();
      if (txt) data.body = txt;
    } catch (_e2) {}
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      data: { url: data.url || "/admin" },
      tag: "sanssucre-staff",
      renotify: true,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/admin";
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const c of all) {
        if (c.url.includes(targetUrl)) {
          await c.focus();
          return;
        }
      }
      await self.clients.openWindow(targetUrl);
    })(),
  );
});