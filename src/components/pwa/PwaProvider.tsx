'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

interface PwaContextType {
  isInstallable: boolean
  isInstalled: boolean
  isIos: boolean
  installApp: () => Promise<boolean>
  dismissInstallBanner: () => void
  showBanner: boolean
  openInstallGuide: () => void
}

const PwaContext = createContext<PwaContextType>({
  isInstallable: false,
  isInstalled: false,
  isIos: false,
  installApp: async () => false,
  dismissInstallBanner: () => {},
  showBanner: false,
  openInstallGuide: () => {},
})

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // 1. Register Service Worker in production/supporting browsers
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('Nexora PWA ServiceWorker registered with scope:', reg.scope)
          })
          .catch((err) => {
            console.warn('ServiceWorker registration error:', err)
          })
      })
    }

    // 2. Check if already installed / standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://')

    if (isStandalone) {
      setIsInstalled(true)
    }

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|crmo/.test(userAgent)

    if (isIosDevice && isSafari && !isStandalone) {
      setIsIos(true)
      setIsInstallable(true)
    }

    // 4. Listen for Chrome's native beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const installEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(installEvent)
      setIsInstallable(true)

      // Only show banner if user hasn't dismissed it in current session
      const dismissed = sessionStorage.getItem('nexora_pwa_banner_dismissed')
      if (!dismissed && !isStandalone) {
        setShowBanner(true)
      }
    }

    // 5. Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setShowBanner(false)
      setDeferredPrompt(null)
      console.log('Nexora was successfully installed as a Web App.')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const installApp = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      if (isIos) {
        alert("To install Nexora on your iPhone/iPad:\n1. Tap the Share icon ⎋ at the bottom of Safari.\n2. Scroll down and tap 'Add to Home Screen' ⊕.")
        return false
      }
      return false
    }

    try {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === 'accepted') {
        setIsInstalled(true)
        setShowBanner(false)
        setDeferredPrompt(null)
        return true
      }
      return false
    } catch (err) {
      console.error('Error invoking PWA install prompt:', err)
      return false
    }
  }

  const dismissInstallBanner = () => {
    setShowBanner(false)
    sessionStorage.setItem('nexora_pwa_banner_dismissed', 'true')
  }

  const openInstallGuide = () => {
    if (deferredPrompt) {
      installApp()
    } else if (isIos) {
      alert("To install Nexora on iOS:\n1. Tap Share ⎋ in Safari\n2. Select 'Add to Home Screen' ⊕\n3. Tap 'Add' to launch full screen!")
    } else {
      alert("To install Nexora on your PC or Mobile:\n• In Chrome/Edge: Click the Install icon in the browser address bar (top right) or press the Install button in the header.\n• On Android: Tap the menu (⋮) -> 'Add to Home screen' / 'Install app'.")
    }
  }

  return (
    <PwaContext.Provider
      value={{
        isInstallable,
        isInstalled,
        isIos,
        installApp,
        dismissInstallBanner,
        showBanner,
        openInstallGuide,
      }}
    >
      {children}
    </PwaContext.Provider>
  )
}

export function usePwa() {
  return useContext(PwaContext)
}
