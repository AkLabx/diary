const CACHE_NAME = 'diary-cache-v1';
// These are the files that make up the "app shell"
const urlsToCache = [
  '/',
  '/index.css',
  // NOTE: You will need to create these icon files and place them in your `public` folder.
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/manifest.json'
];

// Install the service worker and cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        // Add all the app shell files to the cache
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate the service worker and clean up old caches
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

// Intercept fetch requests and serve from cache if available (cache-first strategy)
self.addEventListener('fetch', (event) => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // If the resource is in the cache, return it
        if (response) {
          return response;
        }

        // If the resource is not in the cache, fetch it from the network
        return fetch(event.request).then((networkResponse) => {
          // Check if we received a valid response
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          // Clone the response because it's a stream and can only be consumed once.
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              // Cache the new resource for future use
              cache.put(event.request, responseToCache);
            });
          
          return networkResponse;
        }).catch(error => {
          // This is a simple offline fallback. In a real app, you might
          // want to return a custom offline page.
          console.error('Fetch failed; returning offline fallback.', error);
        });
      })
  );
});
