'use client'

import { AlertCircle, RefreshCcw } from 'lucide-react'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center space-y-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive smooth-ring">
        <AlertCircle size={40} />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-black tracking-tight">Something went wrong</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          We encountered an unexpected error while loading this page. Our team has been notified.
        </p>
      </div>
      <div className="flex items-center gap-4">
        <Button onClick={() => window.location.reload()} variant="outline" className="glass-card">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Reload Page
        </Button>
        <Button onClick={() => reset()} className="shadow-[0_0_20px_rgba(var(--primary),0.3)]">
          Try Again
        </Button>
      </div>
      <p className="text-xs text-muted-foreground font-mono bg-secondary/30 p-2 rounded max-w-lg truncate">
        {error.message || 'Unknown error occurred'}
      </p>
    </div>
  )
}
