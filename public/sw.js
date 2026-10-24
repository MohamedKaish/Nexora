const CACHE_VERSION = 'v2.6'
const CACHE_NAME = `nexora-sanctuary-${CACHE_VERSION}`

const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/download',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-512.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon.svg',
  '/apple-touch-icon.png',
  '/favicon.ico',
]

// In-worker scheduled alarms map for Service Worker timer & Periodic Sync fallback
const swScheduledAlarms = new Map()
const swTimerHandles = new Map()

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Some static assets failed to pre-cache:', err)
      })
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('nexora-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

function buildNotificationActions(category) {
  if (category === 'task') {
    return [
      { action: 'complete_task', title: '✓ Mark Complete' },
      { action: 'open', title: 'Open Task' },
    ]
  }
  if (category === 'habit') {
    return [
      { action: 'complete_habit', title: '✓ Check Off Habit' },
      { action: 'open', title: 'Open Habit' },
    ]
  }
  if (category === 'hydration') {
    return [
      { action: 'drink_250ml', title: '+250 ml Water' },
      { action: 'open', title: 'Hydration Tracker' },
    ]
  }
  return [{ action: 'open', title: 'Open Nexora' }]
}

async function scheduleSwAlarm(spec) {
  if (!spec || !spec.id || !spec.triggerAtMs) return
  cancelSwAlarm(spec.id)

  const now = Date.now()
  const delayMs = spec.triggerAtMs - now
  if (delayMs <= 0) return

  swScheduledAlarms.set(spec.id, spec)

  const notifOptions = {
    body: spec.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: spec.id,
    vibrate: [250, 100, 250, 100, 250],
    requireInteraction: true,
    renotify: true,
    timestamp: spec.triggerAtMs,
    actions: buildNotificationActions(spec.category),
    data: {
      url: spec.targetUrl || '/dashboard',
      alarmId: spec.id,
      category: spec.category,
      sourceId: spec.sourceId,
    },
  }

  // 1. Use Android Chrome Notification Triggers API (TimestampTrigger) when supported by OS/browser
  if ('TimestampTrigger' in self) {
    try {
      const TriggerClass = self.TimestampTrigger
      await self.registration.showNotification(spec.title, {
        ...notifOptions,
        showTrigger: new TriggerClass(spec.triggerAtMs),
      })
      return
    } catch (err) {
      // Fallback to SW timer if TimestampTrigger is not enabled
    }
  }

  // 2. Service Worker timer for near-horizon alarms while SW stays alive
  if (delayMs <= 2147483647) {
    const handle = setTimeout(() => {
      swTimerHandles.delete(spec.id)
      swScheduledAlarms.delete(spec.id)
      self.registration.showNotification(spec.title, notifOptions).catch(() => {})
    }, delayMs)
    swTimerHandles.set(spec.id, handle)
  }
}

function cancelSwAlarm(alarmId) {
  swScheduledAlarms.delete(alarmId)
  if (swTimerHandles.has(alarmId)) {
    clearTimeout(swTimerHandles.get(alarmId))
    swTimerHandles.delete(alarmId)
  }
  if (self.registration && self.registration.getNotifications) {
    self.registration
      .getNotifications({ tag: alarmId, includeTriggered: true })
      .then((notifs) => {
        notifs.forEach((n) => n.close())
      })
      .catch(() => {})
  }
}

// Web Push Notification Support (Android TWA & Chrome PWA)
self.addEventListener('push', (event) => {
  let data = {
    title: 'Nexora — System Reminder',
    body: 'You have a scheduled reminder in Nexora.',
    icon: '/icons/icon-192.png',
    badge: '/icon-192.png',
    data: { url: '/dashboard' },
  }

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() }
    } catch {
      data.body = event.data.text()
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      data: data.data,
      vibrate: [200, 100, 200],
    })
  )
})

// Client message handler for Android APK & Web local notifications + scheduled alarms
self.addEventListener('message', (event) => {
  if (!event.data) return

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data
    const notifOptions = {
      body: options?.body || 'Reminder from Nexora',
      icon: options?.icon || '/icon-192.png',
      badge: options?.badge || '/icon-192.png',
      tag: options?.tag || 'nexora-alert',
      vibrate: options?.vibrate || [200, 100, 200],
      data: options?.data || { url: '/dashboard' },
      renotify: true,
    }

    event.waitUntil(self.registration.showNotification(title, notifOptions))
  } else if (event.data.type === 'SCHEDULE_ALARM') {
    event.waitUntil(scheduleSwAlarm(event.data.alarm))
  } else if (event.data.type === 'CANCEL_ALARM') {
    cancelSwAlarm(event.data.alarmId)
  } else if (event.data.type === 'CLEAR_ALL_ALARMS') {
    for (const id of Array.from(swScheduledAlarms.keys())) {
      cancelSwAlarm(id)
    }
  }
})

// Notification Click & Interactive Action Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const notifData = event.notification.data || {}
  const action = event.action || 'open'
  let targetUrl = notifData.url || '/dashboard'

  if (action === 'complete_task' && notifData.sourceId) {
    targetUrl = `/tasks?completeTaskId=${encodeURIComponent(notifData.sourceId)}`
  } else if (action === 'complete_habit' && notifData.sourceId) {
    targetUrl = `/habits?completeHabitId=${encodeURIComponent(notifData.sourceId)}`
  } else if (action === 'drink_250ml') {
    targetUrl = `/dashboard?quickHydrateMl=250#hydration`
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('postMessage' in client) {
          client.postMessage({
            type: 'NOTIFICATION_ACTION',
            action,
            sourceId: notifData.sourceId,
            category: notifData.category,
            targetUrl,
          })
        }
        if (client.url && 'focus' in client) {
          if ('navigate' in client) {
            return client.navigate(targetUrl).then((c) => (c ? c.focus() : null))
          }
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  if (
    event.request.headers.get('RSC') === '1' ||
    event.request.headers.get('next-router-prefetch') === '1' ||
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('/_next/data/') ||
    url.pathname.includes('/webpack') ||
    url.pathname.includes('/turbopack')
  ) {
    return
  }

  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|css)$/)
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }
        return fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone()
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache)
              })
            }
            return networkResponse
          })
          .catch(() => {
            return caches.match(event.request)
          })
      })
    )
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          event.request.mode === 'navigate'
        ) {
          const responseToCache = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }
        return networkResponse
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached
          return caches.match('/dashboard').then((dash) => dash || caches.match('/'))
        })
      })
  )
})
