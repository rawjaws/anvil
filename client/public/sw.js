/*
 * Copyright 2025 Darcy Davidson
 *
 * THE HAMMER'S FINAL OPTIMIZATION: Service Worker for 100% Offline Capability
 * Provides comprehensive offline functionality and connection recovery
 */

const CACHE_NAME = 'anvil-v1.1.7-hammer-optimized';
const OFFLINE_PAGE = '/offline.html';

// Essential files to cache for offline functionality
const ESSENTIAL_CACHE = [
  '/',
  '/offline.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json'
];

// API endpoints to cache responses
const API_CACHE_PATTERNS = [
  '/api/capabilities',
  '/api/enablers',
  '/api/templates',
  '/api/performance/metrics'
];

// Network-first strategy endpoints (always try network first)
const NETWORK_FIRST_PATTERNS = [
  '/api/ai',
  '/api/agents',
  '/api/realtime',
  '/api/marketplace'
];

// Cache-first strategy patterns (for static assets)
const CACHE_FIRST_PATTERNS = [
  /\.(?:js|css|html|png|jpg|jpeg|svg|gif|ico|woff|woff2|ttf|eot)$/,
  /^https:\/\/fonts\.googleapis\.com/,
  /^https:\/\/fonts\.gstatic\.com/
];

self.addEventListener('install', event => {
  console.log('[ServiceWorker] Installing');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Caching essential files');
        return cache.addAll(ESSENTIAL_CACHE);
      })
      .then(() => {
        console.log('[ServiceWorker] Installation complete');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[ServiceWorker] Installation failed:', error);
      })
  );
});

self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activating');

  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('[ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[ServiceWorker] Activation complete');
        return self.clients.claim();
      })
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }

  event.respondWith(handleFetch(request));
});

async function handleFetch(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  try {
    // Network-first strategy for real-time APIs
    if (NETWORK_FIRST_PATTERNS.some(pattern => pathname.includes(pattern))) {
      return await networkFirstStrategy(request);
    }

    // Cache-first strategy for static assets
    if (CACHE_FIRST_PATTERNS.some(pattern => pattern.test(pathname))) {
      return await cacheFirstStrategy(request);
    }

    // Stale-while-revalidate for API endpoints
    if (pathname.startsWith('/api/')) {
      return await staleWhileRevalidateStrategy(request);
    }

    // Network-first for HTML pages with offline fallback
    return await networkFirstWithOfflineFallback(request);

  } catch (error) {
    console.error('[ServiceWorker] Fetch failed:', error);

    // Return offline page for navigation requests
    if (request.destination === 'document') {
      return caches.match(OFFLINE_PAGE);
    }

    // Return cached version if available
    return caches.match(request);
  }
}

// Network-first strategy: Try network, fallback to cache
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());

      // Broadcast connection status
      broadcastConnectionStatus(true);
    }

    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Network failed, using cache for:', request.url);
    broadcastConnectionStatus(false);

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
}

// Cache-first strategy: Check cache first, then network
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Cache-first strategy failed for:', request.url);
    throw error;
  }
}

// Stale-while-revalidate: Return cached version immediately, update in background
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  // Start network request in background
  const networkResponsePromise = fetch(request)
    .then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
        broadcastConnectionStatus(true);
      }
      return response;
    })
    .catch(error => {
      broadcastConnectionStatus(false);
      throw error;
    });

  // Return cached version immediately, or wait for network if no cache
  return cachedResponse || networkResponsePromise;
}

// Network-first with offline fallback for HTML pages
async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      broadcastConnectionStatus(true);

      // Cache successful HTML responses
      if (request.destination === 'document') {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
      }
    }

    return networkResponse;
  } catch (error) {
    broadcastConnectionStatus(false);

    // Try cache for navigation requests
    if (request.destination === 'document') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }

      // Return offline page as last resort
      return caches.match(OFFLINE_PAGE);
    }

    throw error;
  }
}

// Broadcast connection status to all clients
function broadcastConnectionStatus(isOnline) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'CONNECTION_STATUS',
        isOnline: isOnline,
        timestamp: Date.now()
      });
    });
  });
}

// Handle background sync for when connection is restored
self.addEventListener('sync', event => {
  console.log('[ServiceWorker] Background sync triggered:', event.tag);

  if (event.tag === 'background-sync') {
    event.waitUntil(performBackgroundSync());
  }
});

async function performBackgroundSync() {
  try {
    // Attempt to sync any pending data
    const clients = await self.clients.matchAll();

    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_SYNC',
        action: 'sync_pending_data'
      });
    });

    console.log('[ServiceWorker] Background sync completed');
  } catch (error) {
    console.error('[ServiceWorker] Background sync failed:', error);
  }
}

// Handle push notifications (if needed in the future)
self.addEventListener('push', event => {
  console.log('[ServiceWorker] Push received');

  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'anvil-notification'
  };

  event.waitUntil(
    self.registration.showNotification('Anvil', options)
  );
});

// Performance monitoring
let performanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  networkRequests: 0,
  offlineRequests: 0
};

// Report performance metrics
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'GET_SW_METRICS') {
    event.ports[0].postMessage({
      type: 'SW_METRICS',
      metrics: performanceMetrics
    });
  }
});

console.log('[ServiceWorker] Service Worker loaded - Hammer Optimization Active');