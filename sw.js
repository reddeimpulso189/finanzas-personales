// Red de Impulso — Service Worker v2
const CACHE = 'ri-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install: cache core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network first, fallback to cache
self.addEventListener('fetch', e => {
  // Skip non-GET and Firebase/external requests
  if(e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if(url.hostname.includes('firebase') ||
     url.hostname.includes('googleapis') ||
     url.hostname.includes('gstatic') ||
     url.hostname.includes('fonts') ||
     url.hostname.includes('cdnjs') ||
     url.hostname.includes('jsdelivr')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Cache successful responses for app shell
        if(res.ok && url.origin === self.location.origin) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('/index.html')))
  );
});
