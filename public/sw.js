const CACHE = 'ais-v1'
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(['/manifest.json']).catch(() => {}))) })
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())) })
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || e.request.url.includes('/api/')) return
  e.respondWith(fetch(e.request).then(r => { if(r.ok) caches.open(CACHE).then(c => c.put(e.request, r.clone())); return r }).catch(() => caches.match(e.request)))
})
