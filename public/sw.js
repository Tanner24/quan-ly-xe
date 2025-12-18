// Service Worker for Vincons PWA
const CACHE_NAME = 'vincons-v1'
const urlsToCache = [
    '/',
    '/vehicles',
    '/logs',
    '/maintenance',
    '/settings'
]

// Install event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    )
    self.skipWaiting()
})

// Activate event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName)
                    }
                })
            )
        })
    )
    self.clients.claim()
})

// Fetch event - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone response before caching
                const responseToCache = response.clone()
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache)
                })
                return response
            })
            .catch(() => {
                // If network fails, try cache
                return caches.match(event.request).then((response) => {
                    return response || new Response('Offline. Please check your connection.', {
                        status: 503,
                        statusText: 'Service Unavailable',
                        headers: new Headers({
                            'Content-Type': 'text/plain'
                        })
                    })
                })
            })
    )
})

// Push notification handler
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'Có cập nhật mới!',
        icon: '/logo-192.png',
        badge: '/logo-192.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 'notification-1'
        },
        actions: [
            { action: 'explore', title: 'Xem ngay', icon: '/check.png' },
            { action: 'close', title: 'Đóng', icon: '/cross.png' }
        ]
    }

    event.waitUntil(
        self.registration.showNotification('Vincons Alert', options)
    )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close()

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        )
    }
})
