// PWA service worker for offline-first disc golf app
// Caches: app shell (instant load), disc database (works offline), API calls (network-first)
const VERSION = "v2";
const SHELL = `shell-${VERSION}`;
const API_CACHE = `api-${VERSION}`;
const SHELL_ASSETS = ["/", "/manifest.webmanifest", "/icon", "/apple-icon"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== SHELL && k !== API_CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;

  // App shell assets: cache-first, always use cached version if available
  const isShell = /\.(js|css|woff2?|png|jpg|svg|webp)$/.test(url.pathname) || url.pathname === "/icon" || url.pathname === "/apple-icon";

  // API calls: network-first, fallback to cache for offline
  const isAPI = url.pathname.startsWith("/api/") || url.pathname.includes("_next/data");

  if (isShell) {
    // Shell assets: cache-first (instant load, always use cache)
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(SHELL).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }))
    );
  } else if (isAPI) {
    // API calls: network-first, cache as fallback for offline
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(API_CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || new Response("Offline - Data not cached", { status: 503 })))
    );
  } else {
    // Navigation requests: network-first, fallback to app shell
    e.respondWith(
      fetch(req).catch(() => caches.match("/").then((hit) => hit || new Response("Offline", { status: 503 })))
    );
  }
});
