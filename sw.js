/**
 * Craftsmen.it - High-Performance Service Worker Caching
 * Ultra-fast Stale-While-Revalidate caching for static assets
 * Network-First for HTML navigation requests
 */

const CACHE_NAME = 'craftsmen-cache-v1';

// Critical static assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/logo/Craftsmen%20Black%20Horizontal.svg',
  '/facicon.png',
  '/wp-content/themes/tecnologia/vamtam/assets/css/dist/elementor/elementor-all.css',
  '/wp-content/themes/tecnologia/vamtam/assets/css/dist/elementor/responsive/elementor-max.css',
  '/wp-content/uploads/elementor/css/post-146.css',
  '/wp-content/uploads/elementor/css/post-1273.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Pre-caching non-fatal warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests or Netlify function API calls
  if (request.method !== 'GET' || url.pathname.startsWith('/.netlify/') || url.pathname.startsWith('/api/')) {
    return;
  }

  // HTML Navigation Requests -> Network First, Fallback to Cache
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const fallback = await caches.match('/index.html');
          return fallback;
        })
    );
    return;
  }

  // Static Assets (CSS, JS, Fonts, Images) -> Stale While Revalidate (0ms Cache Hit)
  const isStaticAsset = (
    url.pathname.match(/\.(css|js|woff2|woff|ttf|otf|eot|svg|png|jpg|jpeg|webp|ico|gif)$/i) ||
    url.pathname.includes('/wp-content/') ||
    url.pathname.includes('/wp-includes/') ||
    url.pathname.includes('/asset/')
  );

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        }).catch(() => {});

        // Return cached response instantly (0ms) if available, otherwise wait for network
        return cachedResponse || fetchPromise;
      })
    );
  }
});
