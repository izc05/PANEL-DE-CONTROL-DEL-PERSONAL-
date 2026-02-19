// Panel Central — Service Worker v1
// Estrategia: Cache-first para assets estáticos, network-first para datos
const CACHE_NAME = 'panel-central-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
];

// Instalar: pre-cachear assets principales
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activar: limpiar caches viejas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first para assets locales, network para CDN/externo
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Solo manejamos requests GET
  if (event.request.method !== 'GET') return;

  // Para CDN externos (xlsx, jspdf, qr-scanner): network-first con fallback a cache
  const isExternal = url.origin !== self.location.origin;

  if (isExternal) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Para assets locales: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      });
    })
  );
});
