const CACHE = "fightquest-shell-v41";
const FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./style.css?v=34",
  "./app.js",
  "./app.js?v=34",
  "./instructor3d.js",
  "./instructor3d.js?v=38",
  "./manifest.json",
  "./icons/icon.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put("./index.html", copy));
          }
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  const isShellAsset = /\/(?:index\.html|app\.js|instructor3d\.js|style\.css|manifest\.json|icon\.svg)$/.test(url.pathname);
  if (!isShellAsset) return;

  event.respondWith(
    caches.match(request).then(cached => {
      const fallback = cached || caches.match(url.pathname);
      if (cached) {
        fetch(request).then(response => {
          if (response.ok) caches.open(CACHE).then(cache => cache.put(request, response.clone()));
        }).catch(() => {});
        return cached;
      }
      return fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, copy));
        }
        return response;
      }).catch(() => fallback);
    })
  );
});
