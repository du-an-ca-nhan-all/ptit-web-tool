// Service Worker for PTIT EduSync PWA
const CACHE_VERSION = 'ptit-edusync-v1.0.0';
const STATIC_CACHE_NAME = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `dynamic-${CACHE_VERSION}`;
const API_CACHE_NAME = `api-${CACHE_VERSION}`;

// Critical assets to precache on install
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/site.webmanifest',
  '/favicon.ico',
  '/favicon.svg',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
];

// URLs/Patterns to ignore
const EXCLUDE_URL_PATTERNS = [
  /\/api\/auth\/login/,
  /\/api\/auth\/logout/,
  /\/api\/auth\/register/,
  /\/api\/auth\/impersonate/,
  /\/api\/auth\/revert-impersonate/,
  /\/api\/auth\/change-password/,
  /\/api\/auth\/reset-password/,
  /\/api\/backup/,
  /\/api\/cron\//,
  /\/api\/init-db/,
];

// Install Event - Precache critical App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(async (cache) => {
      // Use Promise.allSettled to avoid entire install failing if a single resource 404s
      const cachePromises = PRECACHE_ASSETS.map(async (url) => {
        try {
          const response = await fetch(url, { cache: 'no-cache' });
          if (response.ok) {
            await cache.put(url, response);
          }
        } catch (err) {
          console.warn(`[SW] Precache failed for ${url}:`, err);
        }
      });
      await Promise.allSettled(cachePromises);
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean up stale caches and claim clients
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME, API_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            console.log(`[SW] Deleting obsolete cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Message Event - Handle skipWaiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch Event - Dynamic caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle http/https requests
  if (!url.protocol.startsWith('http')) return;

  // 1. Non-GET requests (mutations) -> Always Network Only
  if (request.method !== 'GET') {
    return;
  }

  // 2. Check if URL matches excluded pattern
  if (EXCLUDE_URL_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
    return;
  }

  // 3. API Requests Strategy (Network-First with Cache Fallback for Read APIs)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(async (networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          return new Response(
            JSON.stringify({
              error: 'Offline mode active',
              message: 'Bạn đang ngoại tuyến. Dữ liệu này chưa được lưu vào bộ nhớ đệm.',
              offline: true,
            }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
    );
    return;
  }

  // 4. Static Assets Strategy (Cache-First / Stale-While-Revalidate)
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(js|css|woff2|woff|ttf|png|jpg|jpeg|gif|svg|ico|webp)$/i);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Revalidate in background
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(STATIC_CACHE_NAME).then((cache) => {
                  cache.put(request, networkResponse);
                });
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 5. HTML Navigation Strategy (Network-First with Offline Fallback)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(async (networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Try root cached page
          const rootCached = await caches.match('/');
          if (rootCached) {
            return rootCached;
          }
          // Return offline fallback HTML
          const offlinePage = await caches.match('/offline.html');
          if (offlinePage) {
            return offlinePage;
          }
          return new Response(
            '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Offline</title></head><body><h1>Bạn đang ngoại tuyến</h1><p>Vui lòng kiểm tra kết nối mạng.</p></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // Default: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
