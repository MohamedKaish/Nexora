'use client'

import { useEffect, useState } from 'react'
import { useFocusStore } from '@/store/useFocusStore'
import { Play, Pause, Square, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { saveFocusSession } from '../actions'

export function GlobalTimer() {
  const { isActive, timeLeft, mode, taskId, duration, start, pause, reset, tick } = useFocusStore()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // The timer tick effect
  useEffect(() => {
    // If we are on the focus page, let FocusDashboard handle the ticking to avoid double ticks
    if (pathname === '/focus') return

    let interval: NodeJS.Timeout
    if (isActive && (timeLeft > 0 || mode === 'stopwatch')) {
      interval = setInterval(() => {
        tick()
      }, 1000)
    } else if (isActive && timeLeft <= 0 && mode !== 'stopwatch') {
      // Session finished logic
      pause()
      const durationMinutes = Math.floor(duration / 60)
      
      saveFocusSession(durationMinutes, mode, taskId)
        .then(() => {
          if (mode === 'pomodoro' || mode === 'deep_work' || mode === 'custom') {
            toast.success(`Session Complete!`, {
              description: `You focused for ${durationMinutes} minutes. Great job!`
            })
          } else {
            toast.info(`Break Complete`, {
              description: 'Time to get back to work.'
            })
          }
          useFocusStore.getState().completeSession()
        })
        .catch(console.error)
    }
    return () => clearInterval(interval)
  }, [isActive, timeLeft, tick, pause, duration, mode, taskId, pathname])

  // Do not show the floating timer if we are on the dedicated /focus page
  if (pathname === '/focus') return null

  // Also don't show on auth pages or before mounting
  if (!mounted || pathname === '/login' || pathname === '/register' || pathname === '/') return null

  // Also don't show on auth pages
  if (pathname === '/login' || pathname === '/register' || pathname === '/') return null

  // Format time (MM:SS)
  const minutes = Math.floor((timeLeft || 0) / 60)
  const seconds = (timeLeft || 0) % 60
  const formattedTime = `${(minutes || 0).toString().padStart(2, '0')}:${(seconds || 0).toString().padStart(2, '0')}`

  // Only show if user has interacted with it or we want it persistent. 
  // For Sprint 2: Global floating mini timer that persists.
  
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="flex items-center gap-4 bg-card/80 backdrop-blur-xl border border-border/50 shadow-2xl rounded-full p-2 pr-4 transition-all hover:bg-card/95">
        
        {/* Timer Display */}
        <div className="flex items-center gap-3 bg-secondary/50 rounded-full py-1.5 px-4 font-mono">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold leading-none mb-1">
              {mode ? mode.replace('_', ' ') : 'POMODORO'}
            </span>
            <span className={`text-lg font-bold leading-none ${isActive ? 'text-primary animate-pulse' : 'text-foreground'}`}>
              {formattedTime}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          {isActive ? (
            <Button variant="ghost" size="icon" onClick={pause} className="h-8 w-8 rounded-full text-foreground hover:bg-secondary">
              <Pause className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" onClick={start} className="h-8 w-8 rounded-full text-foreground hover:bg-secondary">
              <Play className="h-4 w-4 ml-0.5" />
            </Button>
          )}
          
          <Button variant="ghost" size="icon" onClick={reset} className="h-8 w-8 rounded-full text-foreground hover:bg-secondary">
            <Square className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          <Link href="/focus">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
        </div>

      </div>
    </div>
  )
}
