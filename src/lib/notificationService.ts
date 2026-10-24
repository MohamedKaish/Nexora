import { useNotificationStore } from '@/store/useNotificationStore'

export function isNativeAndroidApp(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean(
    (window as unknown as { NexoraNativeBridge?: unknown }).NexoraNativeBridge ||
    /NexoraNativeAndroid/i.test(navigator.userAgent)
  )
}

export function isNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false
  if (isNativeAndroidApp()) return true
  return 'Notification' in window
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined') return 'unsupported'
  if (isNativeAndroidApp()) {
    const bridge = (window as unknown as { NexoraNativeBridge?: { hasNotificationPermission?: () => boolean } }).NexoraNativeBridge
    if (bridge && typeof bridge.hasNotificationPermission === 'function') {
      try {
        return bridge.hasNotificationPermission() ? 'granted' : 'default'
      } catch {
        return 'default'
      }
    }
    return 'default'
  }
  if (!isNotificationSupported()) return 'unsupported'
  return Notification.permission
}

// Play a crystal-clear sanctuary alert chime using Web Audio API
export function playNotificationSound() {
  try {
    if (typeof window === 'undefined') return
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return

    const ctx = new AudioContextClass()
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(587.33, now) // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15) // A5

    gain.gain.setValueAtTime(0.25, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.45)
  } catch (e) {
    console.warn('Audio chime error:', e)
  }
}

// Trigger device haptics
export function triggerHapticFeedback(pattern: number[] = [150, 80, 150]) {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern)
    } catch {}
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  // 1. Native Android APK bridge permission invocation
  if (isNativeAndroidApp()) {
    const bridge = (window as unknown as { NexoraNativeBridge?: { requestNotificationPermission?: () => void; hasNotificationPermission?: () => boolean } }).NexoraNativeBridge
    if (bridge?.requestNotificationPermission) {
      try {
        bridge.requestNotificationPermission()
        return 'granted'
      } catch (e) {
        console.warn('Native permission request failed:', e)
      }
    }
    return 'granted'
  }

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
    type?: 'habit' | 'kyro' | 'focus' | 'task'
    link?: string
    silentStore?: boolean
    playSound?: boolean
  } = {}
): Promise<boolean> {
  const messageBody = options.body || 'Habit reminder from Nexora'

  // Trigger device sound & haptics
  if (options.playSound !== false) {
    playNotificationSound()
    triggerHapticFeedback([150, 80, 150])
  }

  // Always log to persistent Sanctuary Notifications Inbox so users never lose alerts
  if (!options.silentStore) {
    try {
      useNotificationStore.getState().addNotification({
        title,
        message: messageBody,
        type: options.type || 'habit',
        link: options.link || '/habits',
      })
    } catch (err) {
      console.warn('Could not record notification to store:', err)
    }
  }

  // 0. Native Android APK Bridge Delivery (PRIORITY 1 - Direct hardware transmission)
  if (typeof window !== 'undefined') {
    const bridge = (window as unknown as { NexoraNativeBridge?: { showNotification: (t: string, m: string, tag: string) => void } }).NexoraNativeBridge
    if (bridge?.showNotification) {
      try {
        bridge.showNotification(
          title,
          messageBody,
          options.tag || 'nexora-alert'
        )
        return true
      } catch (bridgeErr) {
        console.warn('Native APK bridge notification failed:', bridgeErr)
      }
    }
  }

  if (!isNotificationSupported()) return true

  if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
    const perm = await requestNotificationPermission()
    if (perm !== 'granted') return false
  }

  const notificationOptions = {
    body: messageBody,
    icon: options.icon || '/icon-192.png',
    badge: options.badge || '/icon-192.png',
    tag: options.tag || 'nexora-habit-alert',
    vibrate: [250, 100, 250, 100, 250],
    requireInteraction: true,
    renotify: true,
    data: options.data || { url: '/habits' },
  }

  // 1. Android & PWA Service Worker Delivery (Highest reliability on mobile)
  if ('serviceWorker' in navigator) {
    try {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title,
          options: notificationOptions,
        })
      }

      const reg = await navigator.serviceWorker.ready
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, notificationOptions as NotificationOptions)
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
  return sendNotification('⚡ Nexora Sanctuary System Alert', {
    body: 'Phone system is active! Your device will sound and vibrate when scheduled habit windows open.',
    icon: '/icon-192.png',
    tag: 'nexora-test-alert',
    type: 'habit',
    link: '/habits',
    playSound: true,
  })
}
