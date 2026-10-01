'use client'

import { useFocusStore } from '@/store/useFocusStore'
import { Play, Pause, Square, Maximize, Minimize, SkipForward, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { saveFocusSession } from '../actions'
import { useTaskStore } from '@/store/useTaskStore'

const MODE_THEMES: Record<string, { color: string; label: string; glow: string }> = {
  pomodoro: { color: '#D4A853', label: 'Pomodoro', glow: 'rgba(212,168,83,0.3)' },
  short_break: { color: '#34D399', label: 'Short Break', glow: 'rgba(52,211,153,0.3)' },
  long_break: { color: '#60A5FA', label: 'Long Break', glow: 'rgba(96,165,250,0.3)' },
  deep_work: { color: '#A78BFA', label: 'Deep Work', glow: 'rgba(167,139,250,0.3)' },
  stopwatch: { color: '#FBBF24', label: 'Stopwatch', glow: 'rgba(251,191,36,0.3)' },
}

export function FocusDashboard() {
  const [mounted, setMounted] = useState(false)
  const rawTasks = useTaskStore(s => s.tasks)
  const tasks = Array.isArray(rawTasks) ? rawTasks.filter(t => t && !t.deletedAt && t.status !== 'done') : []
  const {
    mode, duration, timeLeft, elapsedTime, isActive, taskId, isFullScreen,
    start, pause, reset, setMode, setTask, tick,
    toggleFullScreen, skipBreak, completeSession,
  } = useFocusStore()

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    let interval: NodeJS.Timeout
    if (isActive && (timeLeft > 0 || mode === 'stopwatch')) {
      interval = setInterval(() => tick(), 1000)
    } else if (isActive && timeLeft <= 0 && mode !== 'stopwatch') {
      pause()
      const durationMinutes = Math.floor((duration || 0) / 60)
      saveFocusSession(durationMinutes, mode, taskId)
        .then(() => {
          if (mode === 'pomodoro' || mode === 'deep_work' || mode === 'custom') {
            toast.success('Session Complete!', { description: `You focused for ${durationMinutes} minutes.` })
          } else {
            toast.info('Break Complete', { description: 'Time to get back to work.' })
          }
          completeSession()
        })
        .catch((err) => { console.error(err); toast.error('Failed to save'); completeSession() })
    }
    return () => clearInterval(interval)
  }, [isActive, timeLeft, tick, pause, duration, mode, taskId, completeSession, mounted])

  const displayTime = (mode === 'stopwatch' ? elapsedTime : timeLeft) || 0
  const minutes = Math.floor(displayTime / 60) || 0
  const seconds = displayTime % 60 || 0
  const formattedTime = `${(minutes || 0).toString().padStart(2, '0')}:${(seconds || 0).toString().padStart(2, '0')}`

  const handleStopwatchComplete = () => {
    pause()
    const durationMinutes = Math.floor((elapsedTime || 0) / 60)
    saveFocusSession(durationMinutes, mode, taskId)
      .then(() => { toast.success('Session Complete!', { description: `You focused for ${durationMinutes} minutes.` }); completeSession() })
      .catch((err) => { console.error(err); toast.error('Failed to save'); completeSession() })
  }

  const safeDuration = duration && duration > 0 ? duration : 1
  const rawProgress = mode === 'stopwatch' ? 100 : ((timeLeft || 0) / safeDuration) * 100
  const progress = isNaN(rawProgress) || !isFinite(rawProgress) ? 0 : rawProgress
  const circleRadius = 120
  const circleCircumference = 2 * Math.PI * circleRadius
  const strokeDashoffset = mode === 'stopwatch' ? 0 : circleCircumference - (progress / 100) * circleCircumference
  const theme = MODE_THEMES[mode] || MODE_THEMES.pomodoro

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="animate-pulse w-64 h-64 rounded-full bg-foreground/[0.02]" />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] page-enter">
      {/* Mode Selector */}
      <div className="flex flex-wrap justify-center gap-1.5 p-1.5 rounded-2xl world-glass mb-8">
        {Object.entries(MODE_THEMES).map(([key, cfg]) => (
          <Button
            key={key}
            variant="ghost"
            onClick={() => setMode(key as typeof mode)}
            className={`rounded-xl px-3 py-1.5 text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer ${
              mode === key
                ? 'text-white shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]'
            }`}
            style={mode === key ? { backgroundColor: cfg.color, boxShadow: `0 4px 20px ${cfg.glow}` } : {}}
          >
            {cfg.label}
          </Button>
        ))}
      </div>

      {/* Task Linker */}
      {tasks && tasks.length > 0 && (
        <div className="flex items-center gap-2.5 mb-8 px-4 py-2.5 rounded-xl world-glass">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Focusing on</span>
          <select
            value={taskId || 'none'}
            onChange={(e) => setTask(e.target.value === 'none' ? null : e.target.value)}
            className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer max-w-[220px] truncate"
          >
            <option value="none" className="bg-card text-foreground">No specific task</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id} className="bg-card text-foreground">{t?.title || 'Untitled Task'}</option>
            ))}
          </select>
        </div>
      )}

      {/* Timer Circle */}
      <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center mb-8 md:mb-12 group">
        {/* Ambient glow */}
        <div
          className="absolute inset-0 rounded-full blur-3xl opacity-30 transition-opacity duration-1000"
          style={{ backgroundColor: theme.color, transform: 'scale(1.2)' }}
        />

        <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 320 320">
          {/* Track */}
          <circle cx="160" cy="160" r={circleRadius} fill="none" strokeWidth="6" className="stroke-border/20" />
          {/* Progress */}
          <circle
            cx="160" cy="160" r={circleRadius}
            fill="none" strokeWidth="6" strokeLinecap="round"
            className="transition-all duration-1000 ease-linear"
            style={{
              strokeDasharray: circleCircumference,
              strokeDashoffset: strokeDashoffset,
              stroke: theme.color,
              filter: `drop-shadow(0 0 8px ${theme.glow})`,
            }}
          />
        </svg>

        <div className="flex flex-col items-center justify-center z-10">
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tighter text-foreground mb-1 font-serif tabular-nums">
            {formattedTime}
          </h1>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">
            {theme.label}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-6 mt-4">
        <div className="flex items-center gap-8">
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full world-glass border-border/20 hover:bg-foreground/[0.04] transition-all cursor-pointer"
            onClick={toggleFullScreen}
          >
            {isFullScreen ? <Minimize className="h-5 w-5 text-muted-foreground" /> : <Maximize className="h-5 w-5 text-muted-foreground" />}
          </Button>

          {isActive ? (
            <Button
              size="lg"
              className="h-20 w-20 rounded-full world-glass border-border/20 text-foreground transition-all active:scale-95 cursor-pointer"
              onClick={pause}
            >
              <Pause className="h-8 w-8" />
            </Button>
          ) : (
            <Button
              size="lg"
              className="h-20 w-20 rounded-full transition-all active:scale-95 border-none cursor-pointer text-white"
              style={{
                backgroundColor: theme.color,
                boxShadow: `0 0 40px ${theme.glow}`,
              }}
              onClick={start}
            >
              <Play className="h-8 w-8 ml-1" />
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full world-glass border-border/20 hover:bg-foreground/[0.04] transition-all cursor-pointer"
            onClick={reset}
          >
            <Square className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>

        <div className="flex gap-4">
          {(mode === 'short_break' || mode === 'long_break') && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full world-glass border-border/20 transition-all cursor-pointer font-semibold"
              onClick={skipBreak}
            >
              <SkipForward className="h-4 w-4 mr-2" /> Skip Break
            </Button>
          )}
          {mode === 'stopwatch' && !isActive && elapsedTime > 0 && (
            <Button
              size="sm"
              className="rounded-full transition-all cursor-pointer text-white font-semibold"
              style={{ backgroundColor: theme.color }}
              onClick={handleStopwatchComplete}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" /> Finish
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
