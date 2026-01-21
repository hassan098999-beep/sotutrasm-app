// Configuration
const CACHE_NAME = 'sotutrasm-v2.0.0';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  // Add other static resources here
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event with network-first strategy for API calls
self.addEventListener('fetch', event => {
  // For Firebase API calls, use network-first strategy
  if (event.request.url.includes('firebase')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          return response;
        })
        .catch(() => {
          // If network fails, show offline message
          return new Response(JSON.stringify({
            error: 'You are offline. Data will be synced when connection is restored.'
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
  } else {
    // For static resources, use cache-first strategy
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          
          return fetch(event.request)
            .then(response => {
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });

              return response;
            })
            .catch(() => {
              // Fallback for pages
              if (event.request.mode === 'navigate') {
                return caches.match('./');
              }
            });
        })
    );
  }
});

// Background sync for offline data
self.addEventListener('sync', event => {
  if (event.tag === 'sync-pending-data') {
    event.waitUntil(syncPendingData());
  }
});

// Push notifications
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'Nouvelle notification SOTUTRASM',
    icon: 'icon-192x192.png',
    badge: 'icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || './'
    },
    actions: [
      {
        action: 'open',
        title: 'Ouvrir'
      },
      {
        action: 'close',
        title: 'Fermer'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'SOTUTRASM', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// Function to sync pending data
async function syncPendingData() {
  try {
    // Get pending data from IndexedDB or cache
    const pendingData = await getPendingData();
    
    if (pendingData.length > 0) {
      console.log('Syncing pending data:', pendingData.length, 'items');
      
      // Send to server (simulated)
      // In real implementation, send to Firebase
      const response = await fetch('https://api.example.com/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pendingData)
      });

      if (response.ok) {
        console.log('Pending data synced successfully');
        await clearPendingData();
      }
    }
  } catch (error) {
    console.error('Background sync error:', error);
  }
}

// Helper functions for pending data
async function getPendingData() {
  // In a real app, use IndexedDB
  return [];
}

async function clearPendingData() {
  // In a real app, clear from IndexedDB
  return;
}

// Message handler from main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});