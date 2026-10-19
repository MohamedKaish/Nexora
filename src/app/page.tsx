'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAppStore, isUserOnboarded } from '@/store/appStore'
import { NexoraLogo } from '@/components/brand/NexoraLogo'
import { ArrowRight, Download, Sparkles, Shield, Compass, CheckCircle2 } from 'lucide-react'

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

    // Quick redirect if already onboarded
    if (isUserOnboarded()) {
      router.replace('/dashboard')
      return
    }

    if (hasHydrated) {
      if (onboardingComplete) {
        router.replace('/dashboard')
      } else {
        router.replace('/login')
      }
    }
  }, [mounted, hasHydrated, onboardingComplete, router])

  return (
    <div className="min-h-screen bg-stone-950 text-foreground flex flex-col justify-between selection:bg-amber-400 selection:text-stone-950">
      {/* Ambient Gold Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header Bar */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between border-b border-stone-800/60 z-10">
        <div className="flex items-center gap-3">
          <NexoraLogo size={36} />
          <div>
            <h1 className="text-base font-bold font-serif tracking-tight text-stone-100 flex items-center gap-2">
              <span>Nexora</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold">
                OS
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/download"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-900 border border-stone-800 hover:border-amber-400/50 text-stone-300 hover:text-amber-300 text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Get App</span>
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold text-xs shadow-[0_0_12px_rgba(212,168,83,0.3)] transition-all"
          >
            <span>Launch</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Hero & Content for Play Store / PWA Crawlers */}
      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex flex-col items-center text-center z-10 space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Adaptive Productivity Ecosystem</span>
        </div>

        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-stone-100 tracking-tight max-w-3xl leading-tight">
          Your Living Digital Habitat for Peak Focus & Mastery
        </h2>

        <p className="text-sm sm:text-base text-stone-400 max-w-2xl leading-relaxed">
          Integrated task matrix, habit momentum streaks, Kyro AI companion strategist, and deep focus chamber. Fully installable as an Android app and desktop PWA with offline caching.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold text-sm shadow-[0_0_20px_rgba(212,168,83,0.35)] flex items-center justify-center gap-2 transition-all"
          >
            <span>Enter Sanctuary</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/download"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-stone-900/90 hover:bg-stone-800 border border-stone-800 hover:border-amber-400/50 text-stone-200 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Download Android App &amp; APK</span>
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full pt-10 text-left">
          <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800/80">
            <Compass className="w-5 h-5 text-amber-400 mb-2" />
            <h3 className="text-sm font-bold text-stone-200">Kyro Companion</h3>
            <p className="text-xs text-stone-400 mt-1">Autonomous neural guide offering productivity strategy and quest coaching.</p>
          </div>
          <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800/80">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-2" />
            <h3 className="text-sm font-bold text-stone-200">Task &amp; Habit Matrix</h3>
            <p className="text-xs text-stone-400 mt-1">Gamified progression, streaks, and horizon planning with local-first offline support.</p>
          </div>
          <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800/80">
            <Shield className="w-5 h-5 text-blue-400 mb-2" />
            <h3 className="text-sm font-bold text-stone-200">Verified PWA + TWA</h3>
            <p className="text-xs text-stone-400 mt-1">Standalone fullscreen experience across Android Chrome, desktop, and tablets.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 border-t border-stone-900 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-3 z-10">
        <span>&copy; {new Date().getFullYear()} Nexora Habitat. All rights reserved.</span>
        <div className="flex items-center gap-4">
          <Link href="/download" className="hover:text-amber-400 transition-colors">Download App</Link>
          <Link href="/settings" className="hover:text-amber-400 transition-colors">Settings</Link>
          <Link href="/dashboard" className="hover:text-amber-400 transition-colors">Sanctuary</Link>
        </div>
      </footer>
    </div>
  )
}
