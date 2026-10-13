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
  isNativeApk: boolean
  installApp: () => Promise<boolean>
  markAsInstalled: () => void
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
  isNativeApk: false,
  installApp: async () => false,
  markAsInstalled: () => {},
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
  const [isNativeApk, setIsNativeApk] = useState(false)
  const [showBanner, setShowBanner] = useState(false)
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false)

  const markAsInstalled = () => {
    try {
      localStorage.setItem('nexora_apk_installed', 'true')
    } catch {}
    setIsInstalled(true)
    setShowBanner(false)
    setIsInstallable(false)
  }

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

    // 2. Comprehensive check for installed environment (Native Android APK / PWA Standalone / Previously Downloaded)
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent || ''
      const isApkWrapper =
        userAgent.includes('NexoraNativeAndroid') ||
        userAgent.includes('; wv') ||
        (userAgent.includes('Android') && userAgent.includes('Version/'))

      if (isApkWrapper) {
        setIsNativeApk(true)
      }

      const isStandaloneDisplay =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://') ||
        window.location.search.includes('source=pwa') ||
        window.location.search.includes('source=apk')

      const hasInstalledFlag =
        localStorage.getItem('nexora_apk_installed') === 'true' ||
        localStorage.getItem('nexora_pwa_installed') === 'true'

      if (isApkWrapper || isStandaloneDisplay || hasInstalledFlag) {
        setIsInstalled(true)
        setShowBanner(false)
        setIsInstallable(false)
        return
      }

      // 3. Detect iOS Safari
      const uaLower = userAgent.toLowerCase()
      const isIosDevice =
        /iphone|ipad|ipod/.test(uaLower) &&
        !(window as unknown as { MSStream?: unknown }).MSStream
      const isSafari =
        /safari/.test(uaLower) &&
        !/chrome|crios|crmo/.test(uaLower)

      if (isIosDevice && isSafari) {
        setIsIos(true)
        setIsInstallable(true)
      }
    }

    // 4. Listen for Chrome / Edge native beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const installEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(installEvent)
      setIsInstallable(true)

      const dismissed = sessionStorage.getItem('nexora_pwa_banner_dismissed')
      const hasInstalledFlag = localStorage.getItem('nexora_apk_installed') === 'true'

      if (!dismissed && !hasInstalledFlag) {
        setShowBanner(true)
      }
    }

    // 5. Listen for successful installation
    const handleAppInstalled = () => {
      markAsInstalled()
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
          markAsInstalled()
          return true
        }
      } catch (err) {
        console.warn('Install prompt error:', err)
      }
    }

    // Otherwise, open our download / installation modal
    openDownloadModal()
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
        isNativeApk,
        installApp,
        markAsInstalled,
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
