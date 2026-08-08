'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({
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
    <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[60vh] animate-in fade-in zoom-in duration-500">
      <div className="h-20 w-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="h-10 w-10 text-red-500" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight mb-2">Something went wrong!</h2>
      <p className="text-muted-foreground max-w-md text-center mb-8">
        We encountered an unexpected error while loading this page. 
      </p>
      <Button 
        onClick={() => reset()}
        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 h-12 rounded-full shadow-lg hover:scale-105 transition-all flex items-center gap-2"
      >
        <RefreshCcw className="h-4 w-4" />
        Try again
      </Button>
    </div>
  )
}
