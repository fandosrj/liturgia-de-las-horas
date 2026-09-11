/* ============================================================
   Service Worker · Liturgia de las Horas (PWA offline)
   Precarga la app y la librería de rezo (una sola vez).
   ============================================================ */

const CACHE = 'liturgia-horas-v17';
const CORE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './lib/store.js',
  './lib/favs.js',
  './lib/latin.js',
  './lib/ortodoxo.js',
  './lib/salterio.js',
  './lib/santos.js',
  './lib/oraciones.js',
  './lib/liturgy.js',
  './lib/biblia.js',
  './lib/community.js',
  './vendor/breviarium.umd.js',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn('Precache incompleto:', err))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Solo mismo origen y nunca la API (siempre en vivo)
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const base = new URL('./', self.registration.scope).pathname.replace(/\/$/, '');
  if (url.pathname.startsWith(base + '/api/')) return;
  if (url.pathname === base + '/ws') return;

  event.respondWith(
    (function networkFirst() {
      const isLive = req.mode === 'navigate' ||
        url.pathname.endsWith('/app.js') ||
        url.pathname.endsWith('/styles.css') ||
        url.pathname.endsWith('/index.html') ||
        url.pathname.includes('/icons/') ||
        url.pathname.endsWith('/og-image.png');
      if (!isLive) {
        return caches.match(req).then((cached) => {
          if (cached) return cached;
          return fetch(req).then((res) => {
            if (res && res.status === 200) {
              const clone = res.clone();
              caches.open(CACHE).then((cache) => cache.put(req, clone));
            }
            return res;
          });
        });
      }
      return fetch(req, { cache: 'no-store' }).then((res) => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, clone));
        }
        return res;
      }).catch(() => {
        if (req.mode === 'navigate') return caches.match('./index.html');
        return caches.match(req);
      });
    })()
  );
});