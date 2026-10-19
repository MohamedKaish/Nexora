'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SanctuaryCalibrationWizard } from '@/components/auth/SanctuaryCalibrationWizard'
import { NexoraLogo } from '@/components/brand/NexoraLogo'

export default function OnboardingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-stone-950 text-foreground flex flex-col justify-between selection:bg-amber-400 selection:text-stone-950 relative overflow-x-hidden">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-amber-500/10 blur-[140px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between border-b border-stone-800/60 z-10">
        <Link href="/" className="flex items-center gap-3 group">
          <NexoraLogo size={36} />
          <div>
            <h1 className="text-base font-bold font-serif tracking-tight text-stone-100 flex items-center gap-2">
              <span>Nexora</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold">
                OS
              </span>
            </h1>
            <p className="text-[10px] text-stone-400 font-mono">Sanctuary Calibration</p>
          </div>
        </Link>

        <Link
          href="/login?tab=returning"
          className="px-3.5 py-1.5 rounded-xl bg-stone-900 border border-stone-800 hover:border-amber-400/40 text-stone-300 hover:text-amber-300 text-xs font-semibold transition-colors"
        >
          Existing User Sign In →
        </Link>
      </header>

      {/* Main Wizard */}
      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col items-center justify-center z-10">
        <SanctuaryCalibrationWizard
          initialStep={1}
          onComplete={() => router.push('/dashboard')}
        />
      </main>

      <footer className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-stone-500 font-mono z-10 border-t border-stone-800/60">
        Nexora Sanctuary OS • Multi-Step Gated Progression • 100% Offline Compatible
      </footer>
    </div>
  )
}
