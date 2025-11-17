const CACHE_NAME = 'diary-cache-v5'; // Updated version to trigger SW update

const urlsToCache = [
  '/',
  '/index.html',
  '/index.css',
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
        console.log('Opened cache and caching app shell');
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

// Fetch: Implement a robust strategy for SPAs and offline functionality
self.addEventListener('fetch', (event) => {
  // We only handle GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  // For navigation requests (loading the app page), use a network-first strategy.
  // This ensures users get the latest version if online, but the app still loads offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // If the network fails, serve the main app page from the cache.
        return caches.match('/index.html');
      })
    );
    return;
  }

  // For all other requests (assets like CSS, images), use a cache-first strategy.
  // This is fast and reliable for static assets.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      // If not in cache, fetch from the network and cache the new version.
      return fetch(event.request).then((networkResponse) => {
        // Check for a valid response before caching
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      });
    })
  );
});
