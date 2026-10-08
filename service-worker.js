/* Stoor-skandeerder – eenvoudige "cache-first" service worker.
   Verhoog KAS_NAAM se weergawe wanneer jy lêers verander, sodat die foon die nuwe weergawe laai. */
const KAS_NAAM = 'stoor-skandeerder-v3';
const LIB_URL = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
const LEERS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  LIB_URL
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(KAS_NAAM).then((kas) => kas.addAll(LEERS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  // Ruim ou kasse op
  e.waitUntil(
    caches.keys()
      .then((name) => Promise.all(name.filter((n) => n !== KAS_NAAM).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// "Network-first": probeer altyd die nuutste van die web af, val terug op die
// kas as daar geen internet is nie. So bly die app aanlyn altyd op datum, maar
// werk steeds vanlyn.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then((antw) => {
      if (antw && antw.ok && (e.request.url.startsWith(self.location.origin) || e.request.url === LIB_URL)) {
        const kopie = antw.clone();
        caches.open(KAS_NAAM).then((kas) => kas.put(e.request, kopie));
      }
      return antw;
    }).catch(() =>
      caches.match(e.request, { ignoreSearch: true }).then((gekas) => {
        if (gekas) return gekas;
        if (e.request.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      })
    )
  );
});
