import { useNotificationStore } from '@/store/useNotificationStore'

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
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

  if (!isNotificationSupported()) return true

  if (Notification.permission !== 'granted') {
    const perm = await requestNotificationPermission()
    if (perm !== 'granted') return false
  }

  const notificationOptions = {
    body: messageBody,
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
