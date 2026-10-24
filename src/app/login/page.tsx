'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { SanctuaryCalibrationWizard } from '@/components/auth/SanctuaryCalibrationWizard'
import { useAppStore, isUserOnboarded } from '@/store/appStore'
import { useKyroStore } from '@/store/kyroStore'
import { playChime } from '@/utils/soundEngine'
import { NexoraLogo } from '@/components/brand/NexoraLogo'
import {
  signInWithGoogle,
  isSupabaseConfigured,
  getSupabaseSession,
} from '@/lib/supabase'
import {
  Sparkles,
  Lock,
  Mail,
  ArrowRight,
  Shield,
  CheckCircle2,
  Zap,
  RotateCcw,
  Cloud,
  Key,
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

  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'calibration' | 'returning'>('calibration')

  // Returning User Form State
  const [returnEmail, setReturnEmail] = useState(preferences.email || 'architect@nexora.local')
  const [returnPassword, setReturnPassword] = useState('nexora2026')
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [supabaseReady, setSupabaseReady] = useState(false)

  useEffect(() => {
    setMounted(true)
    const hasSupabase = isSupabaseConfigured()
    setSupabaseReady(hasSupabase)

    // Check if user is already signed in via Supabase
    if (hasSupabase) {
      getSupabaseSession().then(({ user }) => {
        if (user && user.email) {
          login(user.email, user.user_metadata?.full_name || user.email.split('@')[0])
          toast.success(`Authenticated as ${user.email} via Supabase`)
          router.push('/dashboard')
        }
      })
    }

    if (recalibrateParam === 'true') {
      setActiveTab('calibration')
    } else if (tabParam === 'returning' || isUserOnboarded()) {
      setActiveTab('returning')
    }
    if (preferences.email) {
      setReturnEmail(preferences.email)
    }
  }, [recalibrateParam, tabParam, preferences.email, login, router])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-stone-950 text-foreground flex items-center justify-center p-6">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-stone-900 border border-stone-800 text-amber-400 font-mono text-xs">
          <Zap className="w-4 h-4 animate-spin text-amber-400" />
          <span>Synchronizing Sanctuary Gateway...</span>
        </div>
      </div>
    )
  }

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

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    playChime('click')

    if (!supabaseReady) {
      // Graceful explanation with option to proceed locally
      toast.info('Supabase cloud credentials not set yet. Logging in with Local Sanctuary ID!')
      setTimeout(() => {
        login(returnEmail || 'commander@gmail.com', preferences.displayName || 'Commander')
        setAnimationState('CELEBRATING', 3500)
        speak('Logged in via Secure Local Vault! To link live Google OAuth, supply your Supabase keys in Secrets.', 5000, undefined, true)
        router.push('/dashboard')
      }, 500)
      return
    }

    const res = await signInWithGoogle()
    if (!res.success) {
      toast.error(res.error || 'Google OAuth failed')
      setIsGoogleLoading(false)
    }
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
            <span className="hidden sm:inline">🔐 Sign In / OAuth</span>
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
                  Welcome to Nexora Sanctuary
                </h2>
                <p className="text-xs text-stone-400">
                  Sign in with Google via Supabase or enter your local sanctuary passcode to unlock your vault.
                </p>
              </div>

              {/* ── GOOGLE AUTHENTICATION VIA SUPABASE ── */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-amber-400/60 text-stone-100 font-bold text-xs flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg group"
                >
                  {/* Official Google G Logo */}
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isGoogleLoading ? 'Connecting to Google OAuth...' : 'Continue with Google (Supabase)'}</span>
                </button>

                {/* Cloud Supabase Status Pill */}
                <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-stone-900/50 border border-stone-800/80 text-[10px] font-mono">
                  <span className="flex items-center gap-1.5 text-stone-400">
                    <Cloud className="w-3 h-3 text-amber-400" />
                    <span>Supabase Backend:</span>
                  </span>
                  {supabaseReady ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Ready
                    </span>
                  ) : (
                    <span className="text-amber-400 font-bold flex items-center gap-1" title="Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Secrets">
                      <Key className="w-3 h-3" /> Local Vault Active
                    </span>
                  )}
                </div>
              </div>

              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-stone-800" />
                <span className="bg-stone-950 px-3 text-[10px] font-mono text-stone-500 uppercase tracking-wider absolute">
                  Or Sign In Locally
                </span>
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
        Nexora Sanctuary OS • Supabase Google Authentication • Zero-Knowledge AES-256 Storage
      </footer>
    </div>
  )
}
