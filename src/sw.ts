/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import { PrecacheEntry, precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute, setDefaultHandler } from 'workbox-routing'
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { BackgroundSyncPlugin } from 'workbox-background-sync'
import { Queue } from 'workbox-background-sync'

declare const self: ServiceWorkerGlobalScope

clientsClaim()

// Precache all static assets
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST as PrecacheEntry[])

// Background sync for task results
const taskResultsQueue = new Queue('task-results-queue', {
  maxRetentionTime: 24 * 60 // 24 hours
})

// API caching for task execution results
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/tasks'),
  new NetworkFirst({
    cacheName: 'task-api-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 // 24 hours
      })
    ]
  }),
  'POST'
)

// Cache static assets
registerRoute(
  ({ request }) => 
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font',
  new CacheFirst({
    cacheName: 'static-resources',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
      })
    ]
  })
)

// Cache API requests with network first strategy
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 // 1 hour
      })
    ]
  })
)

// Handle navigation requests
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'page-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      })
    ]
  })
)

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const options = {
    body: data.body || 'BabyAGI notification',
    icon: '/pwa-192x192.png',
    badge: '/pwa-96x96.png',
    tag: data.tag || 'babyagi-notification',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    data: data.data || {},
    vibrate: [100, 50, 100],
    silent: false,
    renotify: true
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'BabyAGI', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const notificationData = event.notification.data
  const urlToOpen = notificationData?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus()
          }
        }
        // If not, open a new window/tab
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen)
        }
      })
  )
})

// Background sync for failed requests
const backgroundSyncPlugin = new BackgroundSyncPlugin('task-results-queue', {
  maxRetentionTime: 24 * 60 // 24 hours in minutes
})

// Handle background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-task-results') {
    event.waitUntil(
      taskResultsQueue.replayRequests()
    )
  }
})

// Handle task execution offline
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'TASK_EXECUTION_OFFLINE') {
    // Store task execution request for later replay
    (taskResultsQueue as any).pushRequest({
      url: event.data.url,
      method: event.data.method,
      body: event.data.body,
      headers: event.data.headers
    })
  }
})

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing')
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating')
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys()
      const oldCaches = cacheNames.filter(name => 
        !name.startsWith('workbox-') && 
        !['task-api-cache', 'static-resources', 'api-cache', 'page-cache'].includes(name)
      )
      await Promise.all(
        oldCaches.map(name => caches.delete(name))
      )
      await self.clients.claim()
    })()
  )
})

// Default handler for all requests
setDefaultHandler(new StaleWhileRevalidate())

// Handle app shell updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})