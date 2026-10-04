'use client'

import React, { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MobileNav } from './MobileNav'
import { WorldBackground } from '@/features/companion/WorldBackground'
import { KyroChatPanel } from '@/features/kyro/KyroChatPanel'
import { SystemCompanionBanner } from '@/components/companion/SystemCompanionBanner'
import { SanctuaryTutorialModal } from '@/components/companion/SanctuaryTutorialModal'
import { useFocusStore } from '@/store/useFocusStore'
import { useAppStore } from '@/store/appStore'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const tickFocusTimer = useFocusStore((s) => s.tick)
  const isFocusRunning = useFocusStore((s) => s.isRunning)
  const theme = useAppStore((s) => s.preferences.theme)
  const onboardingComplete = useAppStore((s) => s.preferences.onboardingComplete)

  const [isTutorialOpen, setIsTutorialOpen] = useState(false)

  // Enforce First-Time 5-Question Onboarding for any new user
  useEffect(() => {
    if (!onboardingComplete && pathname !== '/setup') {
      router.replace('/setup')
    }
  }, [onboardingComplete, pathname, router])

  // Synchronize dynamic Theme (Light Sanctuary vs Dark Deep Space)
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'light') {
      root.classList.remove('dark')
      root.classList.add('light')
    } else if (theme === 'dark') {
      root.classList.remove('light')
      root.classList.add('dark')
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        root.classList.add('dark')
        root.classList.remove('light')
      } else {
        root.classList.remove('dark')
        root.classList.add('light')
      }
    }
  }, [theme])

  // Global 1s ticker for focus countdown
  useEffect(() => {
    if (!isFocusRunning) return
    const interval = setInterval(() => {
      tickFocusTimer()
    }, 1000)
    return () => clearInterval(interval)
  }, [isFocusRunning, tickFocusTimer])

  // In setup mode, render isolated setup layout without sidebar clutter
  if (pathname === '/setup') {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col relative transition-colors duration-300">
        <WorldBackground />
        <main className="flex-1 flex items-center justify-center p-4 relative z-10">
          {children}
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative transition-colors duration-300">
      {/* Environmental Atmospheric Background */}
      <WorldBackground />

      <div className="relative z-10 flex min-h-screen">
        {/* Navigation Sidebar for Desktop */}
        <Sidebar />

        {/* Primary Content Container */}
        <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
          <Header onOpenTutorial={() => setIsTutorialOpen(true)} />
          <main className="flex-1 p-3.5 sm:p-6 md:p-8 pb-32 lg:pb-12 max-w-7xl mx-auto w-full space-y-6">
            {/* System-wide active companion commentary across sub-pages */}
            <SystemCompanionBanner />
            {children}
          </main>
        </div>
      </div>

      {/* Kyro AI Conversational Assistant Panel */}
      <KyroChatPanel />

      {/* Interactive Sanctuary Companion Guide Modal */}
      <SanctuaryTutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />

      {/* Bottom Bar for Mobile */}
      <MobileNav />
    </div>
  )
}
