'use client'

import React, { useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MobileNav } from './MobileNav'
import { WorldBackground } from '@/features/companion/WorldBackground'
import { KyroChatPanel } from '@/features/kyro/KyroChatPanel'
import { useFocusStore } from '@/store/useFocusStore'

export function AppShell({ children }: { children: React.ReactNode }) {
  const tickFocusTimer = useFocusStore((s) => s.tick)
  const isFocusRunning = useFocusStore((s) => s.isRunning)

  // Global 1s ticker for focus countdown
  useEffect(() => {
    if (!isFocusRunning) return
    const interval = setInterval(() => {
      tickFocusTimer()
    }, 1000)
    return () => clearInterval(interval)
  }, [isFocusRunning, tickFocusTimer])

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative">
      {/* Environmental Atmospheric Background */}
      <WorldBackground />

      <div className="relative z-10 flex min-h-screen">
        {/* Navigation Sidebar for Desktop */}
        <Sidebar />

        {/* Primary Content Container */}
        <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
          <Header />
          <main className="flex-1 p-4 md:p-8 pb-24 lg:pb-12 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>
      </div>

      {/* Kyro AI Conversational Assistant Panel */}
      <KyroChatPanel />

      {/* Bottom Bar for Mobile */}
      <MobileNav />
    </div>
  )
}
