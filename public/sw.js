// Minimal app-shell service worker. Caches static assets for instant re-loads
// and keeps the site usable on flaky networks. Round data always hits the
// network — we never serve stale standings.
const VERSION = "v1";
const SHELL = `shell-${VERSION}`;
const SHELL_ASSETS = ["/", "/manifest.webmanifest", "/icon", "/apple-icon"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== SHELL).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  // App shell assets: cache-first. Everything else: network-first.
  const isShell = /\.(js|css|woff2?|png|jpg|svg|webp)$/.test(url.pathname) || url.pathname === "/icon" || url.pathname === "/apple-icon";
  if (isShell) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(SHELL).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }))
    );
  } else {
    e.respondWith(fetch(req).catch(() => caches.match(req).then((hit) => hit || new Response("Offline", { status: 503 }))));
  }
});
