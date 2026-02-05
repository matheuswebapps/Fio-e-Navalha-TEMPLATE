/* Basic PWA Service Worker (installability + offline shell)
   - Keeps caching minimal to avoid fighting with dynamic content (Supabase)
*/

const CACHE_NAME = 'fio-navalha-shell-v1';
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-512-maskable.png',
  '/icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : null))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Never cache the dynamic manifest function
  if (req.url.includes('/.netlify/functions/manifest')) {
    event.respondWith(fetch(req));
    return;
  }

  // HTML: network-first (so updates land)
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          return res;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Everything else: cache-first
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
