import { useNotificationStore } from '@/store/useNotificationStore'
import { useKyroStore } from '@/store/kyroStore'
import { playChime, triggerHapticFeedback } from '@/utils/soundEngine'
import { toast } from 'sonner'

export function isNativeAndroid(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean(
    (window as unknown as { NexoraNativeBridge?: unknown }).NexoraNativeBridge ||
    /NexoraNativeAndroid/i.test(navigator.userAgent)
  )
}

export function getPhoneNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined') return 'unsupported'

  if (isNativeAndroid()) {
    const bridge = (window as unknown as {
      NexoraNativeBridge?: {
        hasNotificationPermission?: () => boolean
      }
    }).NexoraNativeBridge

    if (bridge && typeof bridge.hasNotificationPermission === 'function') {
      try {
        return bridge.hasNotificationPermission() ? 'granted' : 'default'
      } catch {
        return 'default'
      }
    }
    return 'default'
  }

  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export async function requestPhoneNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined') return 'unsupported'

  // 1. Android APK Native Bridge permission invocation
  if (isNativeAndroid()) {
    const bridge = (window as unknown as {
      NexoraNativeBridge?: {
        requestNotificationPermission?: () => void
        hasNotificationPermission?: () => boolean
      }
    }).NexoraNativeBridge

    if (bridge?.requestNotificationPermission) {
      try {
        bridge.requestNotificationPermission()
        return 'granted'
      } catch (err) {
        console.warn('Native permission invocation error:', err)
      }
    }
    return 'granted'
  }

  // 2. Web browser HTML5 Notification permission
  if (!('Notification' in window)) return 'unsupported'

  try {
    const perm = await Notification.requestPermission()
    return perm
  } catch (err) {
    console.warn('Notification.requestPermission failed:', err)
    return Notification.permission
  }
}

export async function sendNexoraNotification(
  title: string,
  body: string,
  tag: string = 'nexora-alert',
  vocalize: boolean = true
): Promise<boolean> {
  const messageTitle = title.trim() || '⚡ Nexora Sanctuary'
  const messageBody = body.trim() || 'Scheduled sanctuary alert active.'

  // 1. Play crystal-clear audio chime & tactile haptics
  playChime('notification')
  triggerHapticFeedback([150, 80, 150])

  // 2. Log in Sanctuary Transmissions Inbox
  const resolvedLink = tag.includes('habit')
    ? '/habits'
    : tag.includes('note')
    ? '/notes'
    : tag.includes('hydration')
    ? '/dashboard?modal=hydration'
    : tag.includes('expense')
    ? '/dashboard?modal=finance'
    : '/tasks'

  try {
    useNotificationStore.getState().addNotification({
      title: messageTitle,
      message: messageBody,
      type: tag.includes('habit') ? 'habit' : tag.includes('note') ? 'kyro' : 'task',
      link: resolvedLink,
    })
  } catch (err) {
    console.warn('Failed to store notification record:', err)
  }

  // 3. Trigger Sonner Toast for in-app awareness
  toast(messageTitle, {
    description: messageBody,
    duration: 5000,
  })

  // 4. Have Kyro 3D companion speak and animate
  if (vocalize) {
    try {
      useKyroStore.getState().speak(`${messageTitle}: ${messageBody}`, 6000)
      useKyroStore.getState().setAnimationState('TALKING', 3500)
    } catch {}
  }

  // 5. Ensure notification permission is requested if still default
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
    try {
      await Notification.requestPermission()
    } catch {}
  }

  // 6. Native Android APK Bridge Delivery (PRIORITY #1 - Android System Bar)
  if (typeof window !== 'undefined') {
    const bridge = (window as unknown as {
      NexoraNativeBridge?: {
        showNotification?: (t: string, m: string, tag: string) => void
      }
    }).NexoraNativeBridge

    if (bridge?.showNotification) {
      try {
        bridge.showNotification(messageTitle, messageBody, tag)
        return true
      } catch (e) {
        console.warn('NexoraNativeBridge.showNotification error:', e)
      }
    }
  }

  // 7. Service Worker Delivery (Android Status Bar, Lock Screen & Chrome PWA)
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const notifData = {
        body: messageBody,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag,
        vibrate: [250, 100, 250, 100, 250],
        requireInteraction: true,
        renotify: true,
        silent: false,
        data: { url: resolvedLink },
      }

      // Relay to active Service Worker controller
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title: messageTitle,
          options: notifData,
        })
      }

      // Also invoke directly on registration
      const reg = await navigator.serviceWorker.ready
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(messageTitle, notifData as NotificationOptions)
        return true
      }
    } catch (e) {
      console.warn('Service worker notification failed:', e)
    }
  }

  // 8. Desktop / Web Notification API Fallback
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(messageTitle, {
        body: messageBody,
        icon: '/icon-192.png',
        tag,
      })
      return true
    } catch {}
  }

  return true
}

