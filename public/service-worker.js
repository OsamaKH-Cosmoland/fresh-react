const CACHE_VERSION = "natura-gloss-v1";
const OFFLINE_URL = "/offline.html";
const CORE_ASSETS = ["/", OFFLINE_URL, "/manifest.webmanifest", "/stories", "/admin"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

const isNavigationRequest = (request) =>
  request.mode === "navigate" || (request.method === "GET" && request.headers.get("accept")?.includes("text/html"));

self.addEventListener("fetch", (event) => {
  if (isNavigationRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          event.waitUntil(
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy))
          );
          return response;
        })
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          event.waitUntil(
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy))
          );
          return response;
        })
        .catch(() => cached);
    })
  );
});
