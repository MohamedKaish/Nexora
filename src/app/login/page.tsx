'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { SanctuaryCalibrationWizard } from '@/components/auth/SanctuaryCalibrationWizard'
import { useAppStore, isUserOnboarded, isUserAuthenticated } from '@/store/appStore'
import { useKyroStore } from '@/store/kyroStore'
import { playChime } from '@/utils/soundEngine'
import { NexoraLogo } from '@/components/brand/NexoraLogo'
import {
  Sparkles,
  Lock,
  Mail,
  ArrowRight,
  Shield,
  CheckCircle2,
  User,
  Zap,
  RotateCcw,
  Bot,
} from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-950 text-foreground flex items-center justify-center p-6">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-stone-900 border border-stone-800 text-amber-400 font-mono text-xs">
            <Zap className="w-4 h-4 animate-spin text-amber-400" />
            <span>Initializing Sanctuary Quantum Gateway...</span>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const recalibrateParam = searchParams.get('recalibrate')

  const { preferences, login } = useAppStore()
  const { speak, setAnimationState } = useKyroStore()

  const [activeTab, setActiveTab] = useState<'calibration' | 'returning'>(() => {
    if (tabParam === 'returning' || (!recalibrateParam && isUserOnboarded())) {
      return 'returning'
    }
    return 'calibration'
  })

  // Returning User Form State
  const [returnEmail, setReturnEmail] = useState(preferences.email || 'architect@nexora.local')
  const [returnPassword, setReturnPassword] = useState('nexora2026')
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  useEffect(() => {
    if (recalibrateParam === 'true') {
      setActiveTab('calibration')
    }
  }, [recalibrateParam])

  const handleReturningLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!returnEmail.trim() || !returnPassword.trim()) {
      toast.error('Please enter your email and passcode.')
      return
    }

    setIsAuthenticating(true)
    playChime('celebrate')

    setTimeout(() => {
      login(returnEmail.trim(), preferences.displayName || 'Explorer')
      setAnimationState('CELEBRATING', 3500)
      speak(
        `Welcome back to your Sanctuary, ${preferences.preferredTitle || 'Commander'} ${preferences.displayName || ''}! All orbital systems are nominal.`,
        6000,
        undefined,
        true
      )
      toast.success('Identity verified. Entering Nexora Sanctuary.')
      router.push('/dashboard')
    }, 600)
  }

  return (
    <div className="min-h-screen bg-stone-950 text-foreground flex flex-col justify-between selection:bg-amber-400 selection:text-stone-950 relative overflow-x-hidden">
      {/* Ambient Sovereign Gold Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-amber-500/10 blur-[140px] rounded-full pointer-events-none" />

      {/* Top Header */}
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
            <p className="text-[10px] text-stone-400 font-mono">Sanctuary Gateway</p>
          </div>
        </Link>

        {/* Tab Switcher in Header */}
        <div className="flex items-center p-1 rounded-2xl bg-stone-900/90 border border-stone-800 text-xs">
          <button
            onClick={() => {
              playChime('click')
              setActiveTab('calibration')
            }}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'calibration'
                ? 'bg-amber-400 text-stone-950 font-bold shadow-[0_0_15px_rgba(212,168,83,0.3)]'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">✨ 5-Step Calibration</span>
            <span className="sm:hidden">Setup</span>
          </button>

          <button
            onClick={() => {
              playChime('click')
              setActiveTab('returning')
            }}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'returning'
                ? 'bg-amber-400 text-stone-950 font-bold shadow-[0_0_15px_rgba(212,168,83,0.3)]'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">🔐 Returning User</span>
            <span className="sm:hidden">Sign In</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col items-center justify-center z-10">
        {activeTab === 'calibration' ? (
          <SanctuaryCalibrationWizard
            initialStep={1}
            onComplete={() => router.push('/dashboard')}
          />
        ) : (
          <div className="w-full max-w-md mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Returning User Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-stone-950/90 border border-stone-800 backdrop-blur-2xl shadow-2xl relative overflow-hidden space-y-6">
              <div className="absolute top-0 right-0 w-60 h-60 bg-amber-500/5 blur-[80px] pointer-events-none rounded-full" />

              <div className="text-center space-y-2">
                <div className="inline-flex p-3 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 mb-1">
                  <Shield className="w-6 h-6" />
                </div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-100">
                  Welcome Back, Explorer
                </h2>
                <p className="text-xs text-stone-400">
                  Enter your local sanctuary passcode to unlock your tasks, habit streaks, and Kyro companion.
                </p>
              </div>

              {/* Detected Existing Identity Badge */}
              {preferences.displayName && preferences.onboardingComplete && (
                <div className="p-3.5 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 font-bold flex items-center justify-center text-xs">
                      {preferences.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-amber-300 block">
                        {preferences.preferredTitle || 'Commander'} {preferences.displayName}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {preferences.email || 'Local Sanctuary Vault'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold">
                    Active
                  </span>
                </div>
              )}

              <form onSubmit={handleReturningLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-300 block">
                    Sanctuary Email / ID
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={returnEmail}
                      onChange={(e) => setReturnEmail(e.target.value)}
                      required
                      placeholder="you@domain.com"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 focus:border-amber-400 text-sm text-stone-100 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-300 block">
                    Sanctuary Passcode
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={returnPassword}
                      onChange={(e) => setReturnPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 focus:border-amber-400 text-sm text-stone-100 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold text-sm shadow-[0_0_20px_rgba(212,168,83,0.35)] flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-stone-950" />
                  <span>{isAuthenticating ? 'Decrypting Vault...' : 'Enter Sanctuary Dashboard'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="pt-2 border-t border-stone-800/80 flex flex-col items-center gap-2 text-center text-xs text-stone-400">
                <span>Want to recalibrate your 5-step goals &amp; Kyro companion?</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('calibration')}
                  className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Launch 5-Step Calibration Wizard</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-stone-500 font-mono z-10 border-t border-stone-800/60">
        Nexora Sanctuary OS • Local-First Architecture • 60 FPS 3D Kyro Neural Companion
      </footer>
    </div>
  )
}
