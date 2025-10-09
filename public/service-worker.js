// Service Worker for Bengo ERP PWA
const CACHE_NAME = 'bengo-erp-cache-v1';
const urlsToCache = ['/manifest.json', '/css/app.css', '/js/app.js', '/img/logo.png'];

// Install event - cache the essential files
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Opened cache');
            return cache.addAll(urlsToCache);
        })
    );
    // Activate immediately
    self.skipWaiting();
});

// Fetch event - serve from cache or fetch from network
self.addEventListener('fetch', (event) => {
    // Don't cache navigation or authentication-related requests
    const url = new URL(event.request.url);

    // Skip caching for navigation requests and API calls
    //if (event.request.mode === 'navigate' ||
    //     url.pathname.includes('/auth/') ||
    //     url.pathname.includes('/api/')) {
    //  return event.respondWith(fetch(event.request));
    //}

    // For other requests, try cache first, then network
    event.respondWith(
        caches.match(event.request).then((response) => {
            // Cache hit - return response
            if (response) {
                return response;
            }

            // Clone the request
            const fetchRequest = event.request.clone();

            return fetch(fetchRequest).then((response) => {
                // Check if valid response
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                // Clone the response
                const responseToCache = response.clone();

                // Cache the response
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            });
        })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
