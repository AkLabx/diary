const CACHE_NAME = 'diary-cache-v2'; // Updated version
const APP_SHELL_URL = '/index.html';

// Files that constitute the app shell.
const urlsToCache = [
  '/',
  APP_SHELL_URL,
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/manifest.json',
  '/privacy.html',
  '/terms.html'
];

// Install: Cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate: Clean up old caches to ensure the new SW takes control
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch: Serve from cache or network with offline-first strategies
self.addEventListener('fetch', (event) => {
  // We only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Strategy for navigation requests (the HTML page): Network-first, falling back to cache.
  // This ensures the user gets the latest app version if online, but it still works offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If the network fails, serve the cached app shell.
          return caches.match(APP_SHELL_URL);
        })
    );
    return;
  }

  // Strategy for all other requests (assets like JS, CSS, images): Cache-first.
  // This is fast and efficient for assets that don't change often.
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // If we have a cached response, return it.
        if (response) {
          return response;
        }

        // If not in cache, fetch from the network.
        return fetch(event.request).then((networkResponse) => {
          // Check for a valid response before caching
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          // Cache the new resource for future offline use.
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return networkResponse;
        });
      })
  );
});
