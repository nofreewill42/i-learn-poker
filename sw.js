/* i-learn-poker — service worker: hálózat elsőként, gyorsítótár tartaléknak (offline is megnyílik) */
const CACHE = 'ilp-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/fonts.css',
  './css/app.css',
  './assets/icon.svg',
  './assets/icon-192.png',
  './js/core/util.js',
  './js/core/cards.js',
  './js/core/ranges.js',
  './js/core/spot.js',
  './js/core/icm.js',
  './js/core/equity.js',
  './js/data/concepts.js',
  './js/data/charts.js',
  './js/data/spots-early.js',
  './js/data/spots-middle.js',
  './js/data/spots-late.js',
  './js/data/techniques.js',
  './js/data/plan.js',
  './js/data/venue.js',
  './js/core/scoring.js',
  './js/core/srs.js',
  './js/core/drills.js',
  './js/core/store.js',
  './js/core/speech.js',
  './js/core/report.js',
  './js/ui/dom.js',
  './js/ui/table.js',
  './js/ui/viz.js',
  './js/ui/recorder.js',
  './js/ui/views/train.js',
  './js/ui/views/drills.js',
  './js/ui/views/profile.js',
  './js/ui/views/journal.js',
  './js/ui/views/learn.js',
  './js/ui/views/tools.js',
  './js/ui/views/data.js',
  './js/app.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => Promise.all(ASSETS.map((u) => c.add(u).catch(() => null))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('./index.html'))),
  );
});
