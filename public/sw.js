const CACHE_NAME = "phil-design-cache-v1";
const BASE = self.location.pathname.replace(/\/sw\.js$/, "");
const APP_SHELL = [`${BASE}/`, `${BASE}/index.html`, `${BASE}/manifest.webmanifest`, `${BASE}/favicon.svg`];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match(`${BASE}/index.html`)),
      ),
  );
});
