// Configuration
const CACHE_NAME = 'sotutrasm-v1.0.0';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  // Vous pouvez ajouter d'autres ressources statiques ici
];

// Installation
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache ouvert');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Stratégie: Cache d'abord, puis réseau
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        
        // Si pas dans le cache, récupérer du réseau
        return fetch(event.request)
          .then(response => {
            // Vérifier si la réponse est valide
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Mettre en cache pour la prochaine fois
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Fallback pour les pages
            if (event.request.mode === 'navigate') {
              return caches.match('./');
            }
            
            // Fallback pour les images
            if (event.request.destination === 'image') {
              return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f0f0f0"/><text x="100" y="100" font-family="Arial" font-size="14" fill="#666" text-anchor="middle" dominant-baseline="middle">Image non disponible hors ligne</text></svg>',
                {
                  headers: { 'Content-Type': 'image/svg+xml' }
                }
              );
            }
          });
      })
  );
});

// Synchronisation en arrière-plan
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// Notification push
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'Nouvelle notification',
    icon: 'icon-192x192.png',
    badge: 'icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || './'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'SOTUTRASM', options)
  );
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});

// Fonction de synchronisation
async function syncData() {
  try {
    // Récupérer les données en attente
    const pendingData = await getPendingData();
    
    // Synchroniser avec le serveur
    if (pendingData.length > 0) {
      const response = await fetch('https://api.example.com/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pendingData)
      });

      if (response.ok) {
        // Supprimer les données synchronisées
        await clearPendingData();
        console.log('Synchronisation réussie');
        
        // Notifier les clients
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SYNC_COMPLETE',
              data: pendingData.length
            });
          });
        });
      }
    }
  } catch (error) {
    console.error('Erreur de synchronisation:', error);
  }
}

// Stockage local pour les données en attente
async function getPendingData() {
  const cache = await caches.open('pending-data');
  const response = await cache.match('data');
  return response ? response.json() : [];
}

async function clearPendingData() {
  const cache = await caches.open('pending-data');
  return cache.delete('data');
}

// Écouter les messages du client
self.addEventListener('message', event => {
  if (event.data.type === 'SAVE_PENDING_DATA') {
    savePendingDataToCache(event.data.data);
  }
});

async function savePendingDataToCache(data) {
  const cache = await caches.open('pending-data');
  const currentData = await getPendingData();
  currentData.push(data);
  await cache.put('data', new Response(JSON.stringify(currentData)));
}