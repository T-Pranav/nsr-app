/* NSR Poultry Farms – offline support. Change VERSION after every update. */
const VERSION = 'nsr-v97';
const SHELL = ['./', './index.html', './manifest.json', './firebase-config.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const own = url.origin === self.location.origin;
  const lib = /(^|\.)gstatic\.com$|fonts\.googleapis\.com$/.test(url.hostname);
  if (!own && !lib) return;              // database traffic goes straight to Firebase
  if (own) {                             // app files: fresh copy when online; on a slow signal the saved copy after 3.5 s
    const net = fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(VERSION).then(x => x.put(req, c)); } return r; });
    const saved = () => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined));
    e.respondWith(new Promise(res => {
      let done = false; const fin = r => { if (!done && r) { done = true; res(r); } };
      const t = setTimeout(() => saved().then(fin), 3500);
      net.then(r => { clearTimeout(t); fin(r); }).catch(() => { clearTimeout(t); saved().then(r => r ? fin(r) : fin(Response.error())); });
    }));
  } else {                               // fonts & Firebase library: saved copy first
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      const c = r.clone(); caches.open(VERSION).then(x => x.put(req, c)); return r; })));
  }
});
