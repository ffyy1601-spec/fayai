const CACHE_NAME = 'fay-ai-v1';
const SHELL_ASSETS = ['/', '/style.css', '/app.js'];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    // Only cache GET requests for shell assets; let API calls through
    if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
        return;
    }
    event.respondWith(
        caches.match(event.request).then(cached => cached || fetch(event.request))
    );
});
