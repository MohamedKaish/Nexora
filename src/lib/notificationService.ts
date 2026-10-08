export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported'
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported'

  try {
    const permission = await Notification.requestPermission()
    return permission
  } catch (err) {
    console.warn('Failed to request notification permission:', err)
    return Notification.permission
  }
}

export async function sendNotification(
  title: string,
  options: {
    body?: string
    icon?: string
    badge?: string
    tag?: string
    data?: unknown
  } = {}
): Promise<boolean> {
  if (!isNotificationSupported()) return false

  if (Notification.permission !== 'granted') {
    const perm = await requestNotificationPermission()
    if (perm !== 'granted') return false
  }

  const notificationOptions = {
    body: options.body || 'Habit reminder from Nexora',
    icon: options.icon || '/icon-192.png',
    badge: options.badge || '/icon-192.png',
    tag: options.tag || 'nexora-habit-alert',
    vibrate: [150, 80, 150],
    data: options.data,
  }

  // 1. Android & PWA Service Worker Delivery (Highest reliability on mobile)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, notificationOptions as NotificationOptions)
        // Vibrate if supported
        if ('vibrate' in navigator) {
          navigator.vibrate([150, 80, 150])
        }
        return true
      }
    } catch (swErr) {
      console.warn('Service worker notification delivery failed, trying desktop fallback:', swErr)
    }
  }

  // 2. Desktop Browser Native Notification Fallback
  try {
    new Notification(title, notificationOptions as NotificationOptions)
    return true
  } catch (fallbackErr) {
    console.warn('Standard Notification constructor failed:', fallbackErr)
    return false
  }
}

export async function sendTestNotification(): Promise<boolean> {
  return sendNotification('⚡ Nexora Habit Notification Test', {
    body: 'Your device is successfully connected! You will receive timely alerts when scheduled habit windows open.',
    icon: '/icon-192.png',
    tag: 'nexora-test-alert',
  })
}
