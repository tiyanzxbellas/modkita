const CACHE_VERSION = 'modkita-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;

// App shell assets to pre-cache. Vite-hashed JS/CSS is cached on the fly below.
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/cerah.png',
  '/gelap.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('modkita-') && key !== STATIC_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never cache API calls or the download proxy — always go to the network.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(
        () => new Response(JSON.stringify({ status: false, message: 'Offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    return;
  }

  // Cross-origin (e.g. an1.com thumbnails) — network only, don't intercept.
  if (url.origin !== self.location.origin) return;

  // App shell / static assets — cache-first, fall back to network, update cache in background.
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
