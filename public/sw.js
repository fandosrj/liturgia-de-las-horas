/* ============================================================
   Service Worker · Liturgia de las Horas (PWA offline)
   Precarga la app y la librería de rezo (una sola vez).
   ============================================================ */

const CACHE = 'liturgia-horas-v8';
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
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        // Guarda en caché los activos estáticos (no respuestas de error)
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, clone));
        }
        return res;
      }).catch(() => {
        // Fallback para navegación sin conexión
        if (req.mode === 'navigate') return caches.match('./index.html');
        return new Response('Sin conexión', { status: 503, statusText: 'Offline' });
      });
    })
  );
});