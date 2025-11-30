
const CACHE_NAME = 'diary-cache-v10';
const BASE_PATH = '/diary';

const urlsToCache = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/pwa-icon.svg`,
  `${BASE_PATH}/manifest.json`,
  // Cache external dependencies for offline functionality
  'https://aistudiocdn.com/react@^18.2.0',
  'https://aistudiocdn.com/react-dom@^18.2.0/client',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm',
  'https://aistudiocdn.com/dompurify@^3.3.0',
  'https://aistudiocdn.com/react-quill@^2.0.0',
  'https://aistudiocdn.com/quill@^2.0.0',
  'https://aistudiocdn.com/date-fns@^3.6.0',
  'https://esm.sh/compromise@14.14.0',
  'https://aistudiocdn.com/@zip.js/zip.js@2.7.53/index.js',
  'https://esm.sh/tslib@2.6.2',
  'https://esm.sh/react-easy-crop@5.0.7'
];

// Install: Cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache and caching app shell');
        // We use Promise.allSettled to ensure that one failing request doesn't break the entire install
        // However, for critical assets, we might want to ensure they are cached.
        // Given the importmap usage, many of these are critical.
        // We will try to cache all, but log failures.
        return Promise.all(
            urlsToCache.map(url => {
                return fetch(url).then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to fetch ${url} - Status: ${response.status}`);
                    }
                    return cache.put(url, response);
                }).catch(err => {
                    console.error(`Failed to cache ${url}:`, err);
                    // Decide if we want to fail the install or not.
                    // For now, we log but don't re-throw, so the SW still installs.
                    // This might mean some offline functionality is broken, but the app loads.
                });
            })
        );
      })
  );
  // Force the waiting service worker to become the active service worker.
  self.skipWaiting();
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
  // Tell the active service worker to take control of the page immediately.
  event.waitUntil(self.clients.claim());
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
        // Note: We explicitly check for the base path index.html
        return caches.match(`${BASE_PATH}/index.html`);
      })
    );
    return;
  }

  // For all other requests (assets like CSS, images), use a cache-first strategy.
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
