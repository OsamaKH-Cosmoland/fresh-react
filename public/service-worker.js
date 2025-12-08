const CACHE_VERSION = "ng-static-v1";
const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/offline.html",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE_URLS))
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

const cacheFirst = (event) => {
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
        .catch(() => caches.match(OFFLINE_URL));
    })
  );
};

const networkFirst = (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        event.waitUntil(
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy))
        );
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match("/index.html") || caches.match(OFFLINE_URL))
      )
  );
};

self.addEventListener("fetch", (event) => {
  if (isNavigationRequest(event.request)) {
    networkFirst(event);
    return;
  }

  const destination = event.request.destination;
  if (["script", "style", "image", "font"].includes(destination)) {
    cacheFirst(event);
    return;
  }

  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match(OFFLINE_URL)))
  );
});
