'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { register, signInWithGoogle } from '@/features/auth/actions'
import { Loader2, AlertCircle, Mail } from 'lucide-react'

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" className="shrink-0">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [defaultName, setDefaultName] = useState('')
  const turnstileRef = useRef<HTMLDivElement>(null)
  const turnstileWidgetId = useRef<string | null>(null)

  const renderTurnstile = useCallback(() => {
    if (!TURNSTILE_SITE_KEY || !turnstileRef.current) return
    if (typeof window === 'undefined' || !(window as unknown as Record<string, unknown>).turnstile) return

    const turnstile = (window as unknown as { turnstile: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      reset: (id: string) => void
      remove: (id: string) => void
    } }).turnstile

    if (turnstileWidgetId.current) {
      try { turnstile.remove(turnstileWidgetId.current) } catch { /* ignore */ }
    }

    turnstileWidgetId.current = turnstile.render(turnstileRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: (token: string) => setCaptchaToken(token),
      'expired-callback': () => setCaptchaToken(null),
      'error-callback': () => setCaptchaToken(null),
      theme: 'dark',
      size: 'flexible',
    })
  }, [])

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return

    if (!(window as unknown as Record<string, unknown>).turnstile) {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit'
      script.async = true
      ;(window as unknown as Record<string, () => void>).onTurnstileLoad = renderTurnstile
      document.head.appendChild(script)
    } else {
      renderTurnstile()
    }
  }, [renderTurnstile])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDefaultName(localStorage.getItem('nexora_guest_name') || '')
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    if (captchaToken) {
      formData.set('captchaToken', captchaToken)
    }

    try {
      const result = await register(formData)
      if (result) {
        if (!result.success && result.error) {
          setError(result.error)
        } else if (result.success && result.requiresVerification) {
          setSuccessMessage(result.message || 'Account created! Please check your email to verify your account.')
        }
      }
    } catch (err: unknown) {
      const isRedirect = err && typeof err === 'object' && 'digest' in err && typeof (err as { digest: string }).digest === 'string' && (err as { digest: string }).digest.startsWith('NEXT_REDIRECT')
      if (isRedirect) {
        throw err
      }
      setError('An unexpected error occurred during registration. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignup() {
    setError(null)
    setGoogleLoading(true)

    try {
      const result = await signInWithGoogle()
      if (result.success && result.url) {
        window.location.href = result.url
        return
      }
      if (!result.success && result.error) {
        setError(result.error)
      }
    } catch (err: unknown) {
      const isRedirect = err && typeof err === 'object' && 'digest' in err && typeof (err as { digest: string }).digest === 'string' && (err as { digest: string }).digest.startsWith('NEXT_REDIRECT')
      if (isRedirect) throw err
      setError('Unable to connect to Google. Please try again.')
    } finally {
      setGoogleLoading(false)
    }
  }

  const anyLoading = loading || googleLoading

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-brand-emerald/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-brand-blue/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-md space-y-8 rounded-2xl glass-card bg-card/40 border border-border/50 p-10 shadow-[0_8px_30px_rgb(0,0,0,0.4)] backdrop-blur-xl relative z-10 mx-4">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-emerald to-brand-blue flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl tracking-tighter">N</span>
            </div>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Create an account</h2>
          <p className="mt-3 text-sm text-muted-foreground font-medium">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-brand-blue hover:text-brand-blue/80 transition-colors">
              Sign in here
            </Link>
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3.5 flex items-start gap-3 text-sm text-destructive animate-in fade-in-50">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        {successMessage ? (
          <div className="space-y-6 animate-in fade-in-50 text-center py-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-emerald/10 text-brand-emerald">
              <Mail className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-foreground">Check your email</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {successMessage}
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex w-full justify-center items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all"
              >
                Proceed to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Google OAuth Button */}
            <div>
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={anyLoading}
                className="flex w-full justify-center items-center gap-3 rounded-xl border border-border/80 bg-secondary/40 px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm hover:bg-secondary/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary transition-all disabled:opacity-60"
              >
                {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
                {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
              </button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider font-bold">
                <span className="bg-card/40 backdrop-blur-xl px-3 text-muted-foreground">or</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                <div>
                  <label htmlFor="register-name" className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
                  <input
                    id="register-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    disabled={anyLoading}
                    defaultValue={defaultName}
                    className="block w-full rounded-xl border border-border/80 bg-secondary/50 py-2.5 px-4 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-brand-emerald focus:border-brand-emerald sm:text-sm transition-all outline-none disabled:opacity-50"
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label htmlFor="register-email" className="block text-sm font-medium text-foreground mb-1.5">Email address</label>
                  <input
                    id="register-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    disabled={anyLoading}
                    className="block w-full rounded-xl border border-border/80 bg-secondary/50 py-2.5 px-4 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-brand-emerald focus:border-brand-emerald sm:text-sm transition-all outline-none disabled:opacity-50"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="register-password" className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                  <input
                    id="register-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    disabled={anyLoading}
                    className="block w-full rounded-xl border border-border/80 bg-secondary/50 py-2.5 px-4 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-brand-emerald focus:border-brand-emerald sm:text-sm transition-all outline-none disabled:opacity-50"
                    placeholder="••••••••"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Minimum 6 characters</p>
                </div>
              </div>

              {/* Cloudflare Turnstile CAPTCHA Widget */}
              {TURNSTILE_SITE_KEY && (
                <div ref={turnstileRef} className="flex justify-center" />
              )}

              <div>
                <button
                  type="submit"
                  disabled={anyLoading || (!!TURNSTILE_SITE_KEY && !captchaToken)}
                  className="flex w-full justify-center items-center gap-2 rounded-xl bg-brand-emerald px-4 py-2.5 text-sm font-bold text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:bg-brand-emerald/90 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-emerald transition-all disabled:opacity-60"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? 'Creating account...' : 'Sign up'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
