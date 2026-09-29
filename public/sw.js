const CACHE_VERSION = 'v1'
const CACHE_NAME = `nexora-cache-${CACHE_VERSION}`

const STATIC_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/icon'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('nexora-cache-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  
  const url = new URL(event.request.url)

  // Do NOT intercept Next.js RSC requests, API routes, or development chunks
  if (
    event.request.headers.get('RSC') === '1' ||
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('/development/') ||
    url.pathname.includes('webpack') ||
    url.pathname.includes('turbopack') ||
    (!url.pathname.startsWith('/_next/static/') && !url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/))
  ) {
    return
  }
  
  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }
        return networkResponse
      })
    })
  )
})

// Background Sync for offline mutations
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-mutations') {
    event.waitUntil(
      // Trigger a postMessage to clients to flush queue
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'FLUSH_QUEUE' })
        })
      })
    )
  }
})
