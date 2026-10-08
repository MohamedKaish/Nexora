'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore, isUserOnboarded } from '@/store/appStore'

export default function HomePage() {
  const router = useRouter()
  const onboardingComplete = useAppStore((s) => s.preferences.onboardingComplete)
  const hasHydrated = useAppStore((s) => s._hasHydrated)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Fast check: If already recorded in localStorage, go straight to dashboard
    if (isUserOnboarded()) {
      router.replace('/dashboard')
      return
    }

    // Wait until Zustand has finished rehydrating state from storage
    if (!hasHydrated) return

    if (onboardingComplete) {
      router.replace('/dashboard')
    } else {
      router.replace('/setup')
    }
  }, [mounted, hasHydrated, onboardingComplete, router])

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3 text-center animate-pulse">
        <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 font-bold font-serif text-xl shadow-[0_0_20px_rgba(212,168,83,0.3)]">
          N
        </div>
        <span className="text-xs text-stone-400 font-mono">Initializing Sanctuary Habitat...</span>
      </div>
    </div>
  )
}
