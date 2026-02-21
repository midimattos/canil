// Service Worker para PWA Offline

const CACHE_NAME = 'spitz-genetics-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.log('Erro ao cachear:', err))
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', event => {
  // Estratégia: Cache First, Fall back to Network
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(response => {
          // Não cachear respostas não-sucesso
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }
          // Clonar a resposta
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          return response;
        });
      })
      .catch(err => {
        console.log('Erro no fetch:', err);
        // Retornar página offline ou cache fallback
        return caches.match('/index.html');
      })
  );
});

// Background sync para salvar dados
self.addEventListener('sync', event => {
  if (event.tag === 'sync-results') {
    event.waitUntil(syncResults());
  }
});

async function syncResults() {
  try {
    const data = await self.registration.scope;
    console.log('Sincronizando resultados:', data);
  } catch (err) {
    console.log('Erro ao sincronizar:', err);
  }
}

// Push notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Notificação de Spitz Genetics',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'spitz-notification',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification('🐕 Spitz Genetic Predictor', options)
  );
});

// Notification click
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (let client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});