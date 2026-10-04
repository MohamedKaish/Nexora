'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/appStore'

export default function HomePage() {
  const router = useRouter()
  const onboardingComplete = useAppStore((s) => s.preferences.onboardingComplete)

  useEffect(() => {
    if (!onboardingComplete) {
      router.replace('/setup')
    } else {
      router.replace('/dashboard')
    }
  }, [onboardingComplete, router])

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
