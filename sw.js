/* =========================================================
   SERVICE WORKER
   Caches the core app files so the app still opens
   (with the last-loaded data) even with a poor/no connection.
   ========================================================= */

const CACHE_NAME = "schooltasks-cache-v4";

const FILES_TO_CACHE = [
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// Install: cache each core file. Using allSettled instead of addAll
// so that if one file fails, the others still get cached and the
// service worker still activates successfully.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        FILES_TO_CACHE.map((file) =>
          cache.add(file).catch((err) => {
            console.warn("Failed to cache:", file, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// Activate: remove any old caches from previous versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: serve from cache first, fall back to network,
// and cache anything new we successfully fetch.
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          return caches.match("./index.html");
        });
    })
  );
});
