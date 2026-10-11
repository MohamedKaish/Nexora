'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { AppDownloadModal } from './AppDownloadModal'

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
  openDownloadModal: () => void
  closeDownloadModal: () => void
  isDownloadModalOpen: boolean
}

const PwaContext = createContext<PwaContextType>({
  isInstallable: false,
  isInstalled: false,
  isIos: false,
  installApp: async () => false,
  dismissInstallBanner: () => {},
  showBanner: false,
  openInstallGuide: () => {},
  openDownloadModal: () => {},
  closeDownloadModal: () => {},
  isDownloadModalOpen: false,
})

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [showBanner, setShowBanner] = useState(false)
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false)

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

    // 4. Listen for Chrome / Edge native beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const installEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(installEvent)
      setIsInstallable(true)

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
      setIsDownloadModalOpen(false)
      console.log('Nexora was successfully installed as a native app.')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const installApp = async (): Promise<boolean> => {
    // If browser install prompt is captured, run it directly
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt()
        const choice = await deferredPrompt.userChoice
        if (choice.outcome === 'accepted') {
          setIsInstalled(true)
          setShowBanner(false)
          setDeferredPrompt(null)
          setIsDownloadModalOpen(false)
          return true
        }
        return false
      } catch (err) {
        console.error('Error invoking install prompt:', err)
      }
    }

    // If deferredPrompt is not available (e.g. user already clicked once or desktop browser toolbar),
    // alert clear 1-click instruction for Chrome/Edge address bar install button
    if (typeof window !== 'undefined') {
      const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent)
      if (isMobile) {
        alert("To install Nexora on your phone:\n\n1. In Chrome: Tap the 3 dots (⋮) in the top-right.\n2. Tap 'Install app' or 'Add to Home screen'.\n\nNexora will immediately install onto your phone home screen!")
      } else {
        alert("To install Nexora on your PC Desktop:\n\nLook at the right side of your browser URL/address bar at the top:\nClick the 'Install' icon (⊕) or open menu (⋮) -> 'Cast, save, and share' -> 'Install Nexora'.\n\nThis creates a standalone desktop app on your PC Taskbar!")
      }
    }

    return false
  }

  const dismissInstallBanner = () => {
    setShowBanner(false)
    sessionStorage.setItem('nexora_pwa_banner_dismissed', 'true')
  }

  const openInstallGuide = () => {
    setIsDownloadModalOpen(true)
  }

  const openDownloadModal = () => {
    setIsDownloadModalOpen(true)
  }

  const closeDownloadModal = () => {
    setIsDownloadModalOpen(false)
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
        openDownloadModal,
        closeDownloadModal,
        isDownloadModalOpen,
      }}
    >
      {children}
      <AppDownloadModal
        isOpen={isDownloadModalOpen}
        onClose={closeDownloadModal}
      />
    </PwaContext.Provider>
  )
}

export function usePwa() {
  return useContext(PwaContext)
}
