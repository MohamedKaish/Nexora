'use client'

import { useState } from 'react'
import Link from 'next/link'
import { login, loginAsDeveloper } from '@/features/auth/actions'
import { Loader2, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [devLoading, setDevLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    try {
      const result = await login(formData)
      if (result && !result.success && result.error) {
        setError(result.error)
      }
    } catch (err: unknown) {
      // In Next.js, redirect throws a NEXT_REDIRECT error which should propagate
      const isRedirect = err && typeof err === 'object' && 'digest' in err && typeof (err as { digest: string }).digest === 'string' && (err as { digest: string }).digest.startsWith('NEXT_REDIRECT')
      if (isRedirect) {
        throw err
      }
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during login.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeveloperLogin() {
    setError(null)
    setDevLoading(true)

    try {
      const result = await loginAsDeveloper()
      if (result && !result.success && result.error) {
        setError(result.error)
      }
    } catch (err: unknown) {
      const isRedirect = err && typeof err === 'object' && 'digest' in err && typeof (err as { digest: string }).digest === 'string' && (err as { digest: string }).digest.startsWith('NEXT_REDIRECT')
      if (isRedirect) {
        throw err
      }
      setError(err instanceof Error ? err.message : 'Failed to continue as developer.')
    } finally {
      setDevLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-brand-blue/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-brand-purple/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-md space-y-8 rounded-2xl glass-card bg-card/40 border border-border/50 p-10 shadow-[0_8px_30px_rgb(0,0,0,0.4)] backdrop-blur-xl relative z-10 mx-4">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl tracking-tighter">N</span>
            </div>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Welcome to Nexora</h2>
          <p className="mt-3 text-sm text-muted-foreground font-medium">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-brand-blue hover:text-brand-blue/80 transition-colors">
              Create one now
            </Link>
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3.5 flex items-start gap-3 text-sm text-destructive animate-in fade-in-50">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={loading || devLoading}
                className="block w-full rounded-xl border border-border/80 bg-secondary/50 py-2.5 px-4 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-brand-blue focus:border-brand-blue sm:text-sm transition-all outline-none disabled:opacity-50"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={loading || devLoading}
                className="block w-full rounded-xl border border-border/80 bg-secondary/50 py-2.5 px-4 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-brand-blue focus:border-brand-blue sm:text-sm transition-all outline-none disabled:opacity-50"
                placeholder="••••••••"
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={loading || devLoading}
              className="flex w-full justify-center items-center gap-2 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-bold text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:bg-brand-blue/90 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue transition-all disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 border-t border-border/50 pt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider font-bold">
                <span className="bg-card px-3 text-muted-foreground">Developer Mode</span>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                type="button"
                onClick={handleDeveloperLogin}
                disabled={loading || devLoading}
                className="flex w-full justify-center items-center gap-2 rounded-xl border border-border/60 bg-secondary/40 px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary transition-all disabled:opacity-60"
              >
                {devLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {devLoading ? 'Connecting Developer Session...' : 'Continue as Developer'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
