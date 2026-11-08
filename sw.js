// Offline-Unterstützung: immer zuerst die neueste Version aus dem Netz laden,
// nur ohne Verbindung die gespeicherte Version verwenden.
const CACHE = 'blubberbucht-1.11.0';
const FILES = ['./', 'index.html', 'style.css', 'js/species.js', 'js/audio.js', 'js/game.js', 'icon.svg', 'manifest.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Musik direkt streamen, Versionsprüfung immer frisch vom Server
  if (e.request.method !== 'GET' || url.pathname.endsWith('.mp3') || url.pathname.endsWith('version.json')) return;
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' }).then(r => {
      if (r.ok && new URL(e.request.url).origin === location.origin) {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
