'use client'

import { useState } from 'react'
import Link from 'next/link'
import { register } from '@/features/auth/actions'
import { Loader2, AlertCircle, Mail } from 'lucide-react'

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
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
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during registration.')
    } finally {
      setLoading(false)
    }
  }

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
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  disabled={loading}
                  className="block w-full rounded-xl border border-border/80 bg-secondary/50 py-2.5 px-4 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-brand-emerald focus:border-brand-emerald sm:text-sm transition-all outline-none disabled:opacity-50"
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={loading}
                  className="block w-full rounded-xl border border-border/80 bg-secondary/50 py-2.5 px-4 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-brand-emerald focus:border-brand-emerald sm:text-sm transition-all outline-none disabled:opacity-50"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  disabled={loading}
                  className="block w-full rounded-xl border border-border/80 bg-secondary/50 py-2.5 px-4 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-brand-emerald focus:border-brand-emerald sm:text-sm transition-all outline-none disabled:opacity-50"
                  placeholder="••••••••"
                />
                <p className="mt-1 text-xs text-muted-foreground">Minimum 6 characters</p>
              </div>
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center items-center gap-2 rounded-xl bg-brand-emerald px-4 py-2.5 text-sm font-bold text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:bg-brand-emerald/90 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-emerald transition-all disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'Creating account...' : 'Sign up'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
