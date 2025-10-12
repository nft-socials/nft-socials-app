// OnePostDaily Service Worker
const CACHE_NAME = 'onepostdaily-v1';
const STATIC_CACHE = 'onepostdaily-static-v1';
const DYNAMIC_CACHE = 'onepostdaily-dynamic-v1';

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  // Add other static assets as needed
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /^https:\/\/ipfs\.io\/ipfs\//,
  /^https:\/\/api\.pinata\.cloud\//,
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static files', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests
  if (request.destination === 'document') {
    // HTML documents - network first, fallback to cache
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone response for caching
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => {
          // Fallback to cache
          return caches.match(request)
            .then((cachedResponse) => {
              return cachedResponse || caches.match('/');
            });
        })
    );
  } else if (API_CACHE_PATTERNS.some(pattern => pattern.test(request.url))) {
    // API requests - cache first, fallback to network
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            // Return cached version and update in background
            fetch(request)
              .then((response) => {
                const responseClone = response.clone();
                caches.open(DYNAMIC_CACHE)
                  .then((cache) => cache.put(request, responseClone));
              })
              .catch(() => {
                // Network failed, but we have cache
              });
            return cachedResponse;
          }
          
          // Not in cache, fetch from network
          return fetch(request)
            .then((response) => {
              const responseClone = response.clone();
              caches.open(DYNAMIC_CACHE)
                .then((cache) => cache.put(request, responseClone));
              return response;
            });
        })
    );
  } else {
    // Other resources - network first, fallback to cache
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response && response.status === 200 && response.type === 'basic') {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => cache.put(request, responseClone))
              .catch((error) => console.log('Cache put error:', error));
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache
          return caches.match(request);
        })
    );
  }
});

// Background sync for offline post creation
self.addEventListener('sync', (event) => {
  
  if (event.tag === 'background-post-sync') {
    event.waitUntil(
      // Handle offline post synchronization
      syncOfflinePosts()
    );
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  
  const options = {
    body: event.data ? event.data.text() : 'New activity on OnePostDaily!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/icon-192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('OnePostDaily', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper function to sync offline posts
async function syncOfflinePosts() {
  try {
    // Get offline posts from IndexedDB or localStorage
    const offlinePosts = await getOfflinePosts();
    
    for (const post of offlinePosts) {
      try {
        // Attempt to sync each post
        await syncPost(post);
        // Remove from offline storage on success
        await removeOfflinePost(post.id);
      } catch (error) {
        console.error('Failed to sync post:', error);
        // Keep in offline storage for next sync attempt
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Placeholder functions for offline post management
async function getOfflinePosts() {
  // Implementation would use IndexedDB or localStorage
  return [];
}

async function syncPost(post) {
  // Implementation would call the actual API
}

async function removeOfflinePost(postId) {
  // Implementation would remove from IndexedDB or localStorage
}
