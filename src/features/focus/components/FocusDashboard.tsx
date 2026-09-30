'use client'

import { useFocusStore } from '@/store/useFocusStore'
import { Play, Pause, Square, Maximize, Minimize, SkipForward, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { saveFocusSession } from '../actions'

import { useTaskStore } from '@/store/useTaskStore'

export function FocusDashboard() {
  const [mounted, setMounted] = useState(false)
  const tasks = useTaskStore(s => s.tasks.filter(t => !t.deletedAt && t.status !== 'done'))
  const {
    mode,
    duration,
    timeLeft,
    elapsedTime,
    isActive,
    taskId,
    isFullScreen,
    start,
    pause,
    reset,
    setMode,
    setTask,
    tick,
    toggleFullScreen,
    skipBreak,
    completeSession,
  } = useFocusStore()

  // Timer Effect
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    let interval: NodeJS.Timeout
    if (isActive && (timeLeft > 0 || mode === 'stopwatch')) {
      interval = setInterval(() => {
        tick()
      }, 1000)
    } else if (isActive && timeLeft <= 0 && mode !== 'stopwatch') {
      const durationMinutes = Math.floor(duration / 60)

      saveFocusSession(durationMinutes, mode, taskId)
        .then(() => {
          if (mode === 'pomodoro' || mode === 'deep_work' || mode === 'custom') {
            toast.success('Session Complete!', {
              description: `You focused for ${durationMinutes} minutes. Great job!`,
            })
          } else {
            toast.info('Break Complete', {
              description: 'Time to get back to work.',
            })
          }
          completeSession()
        })
        .catch((err) => {
          console.error(err)
          toast.error('Failed to save focus session')
          completeSession()
        })
    }
    return () => clearInterval(interval)
  }, [isActive, timeLeft, tick, pause, duration, mode, taskId, completeSession])

  const displayTime = mode === 'stopwatch' ? elapsedTime : timeLeft
  const minutes = Math.floor(displayTime / 60)
  const seconds = displayTime % 60
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

  const handleStopwatchComplete = () => {
    pause()
    const durationMinutes = Math.floor(elapsedTime / 60)
    saveFocusSession(durationMinutes, mode, taskId)
      .then(() => {
        toast.success('Stopwatch Session Complete!', {
          description: `You focused for ${durationMinutes} minutes.`,
        })
        completeSession()
      })
      .catch((err) => {
        console.error(err)
        toast.error('Failed to save focus session')
        completeSession()
      })
  }

  // Calculate progress circle stroke dasharray
  const progress = mode === 'stopwatch' ? 100 : (timeLeft / duration) * 100
  const circleRadius = 120
  const circleCircumference = 2 * Math.PI * circleRadius
  const strokeDashoffset =
    mode === 'stopwatch' ? 0 : circleCircumference - (progress / 100) * circleCircumference

  if (!mounted) {
    return <div className="flex items-center justify-center min-h-[70vh]"><div className="animate-pulse w-80 h-80 rounded-full bg-secondary/30" /></div>
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] animate-in fade-in zoom-in-95 duration-500">
      {/* Mode Selector */}
      <div className="flex bg-secondary/30 p-1.5 rounded-full mb-8 backdrop-blur-xl border border-white/5 shadow-sm flex-wrap justify-center">
        <Button
          variant={mode === 'pomodoro' ? 'default' : 'ghost'}
          onClick={() => setMode('pomodoro')}
          className={`rounded-full px-6 transition-all duration-300 font-bold ${
            mode === 'pomodoro'
              ? 'bg-primary text-primary-foreground shadow-[0_4px_14px_0_rgba(99,102,241,0.39)]'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
          }`}
        >
          Pomodoro
        </Button>
        <Button
          variant={mode === 'short_break' ? 'default' : 'ghost'}
          onClick={() => setMode('short_break')}
          className={`rounded-full px-6 transition-all duration-300 font-bold ${
            mode === 'short_break'
              ? 'bg-brand-emerald text-white shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:bg-brand-emerald/90'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
          }`}
        >
          Short Break
        </Button>
        <Button
          variant={mode === 'long_break' ? 'default' : 'ghost'}
          onClick={() => setMode('long_break')}
          className={`rounded-full px-6 transition-all duration-300 font-bold ${
            mode === 'long_break'
              ? 'bg-brand-blue text-white shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] hover:bg-brand-blue/90'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
          }`}
        >
          Long Break
        </Button>
        <Button
          variant={mode === 'deep_work' ? 'default' : 'ghost'}
          onClick={() => setMode('deep_work')}
          className={`rounded-full px-6 transition-all duration-300 font-bold ${
            mode === 'deep_work'
              ? 'bg-brand-purple text-white shadow-[0_4px_14px_0_rgba(168,85,247,0.39)] hover:bg-brand-purple/90'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
          }`}
        >
          Deep Work
        </Button>
        <Button
          variant={mode === 'stopwatch' ? 'default' : 'ghost'}
          onClick={() => setMode('stopwatch')}
          className={`rounded-full px-6 transition-all duration-300 font-bold ${
            mode === 'stopwatch'
              ? 'bg-amber-500 text-white shadow-[0_4px_14px_0_rgba(245,158,11,0.39)] hover:bg-amber-600/90'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
          }`}
        >
          Stopwatch
        </Button>
      </div>

      {/* Task Linker */}
      {tasks && tasks.length > 0 && (
        <div className="flex items-center gap-2.5 mb-8 bg-secondary/30 px-4 py-2 rounded-xl border border-white/5">
          <span className="text-xs font-semibold text-muted-foreground">Focusing on:</span>
          <select
            value={taskId || 'none'}
            onChange={(e) => setTask(e.target.value === 'none' ? null : e.target.value)}
            className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer max-w-[220px] truncate"
          >
            <option value="none" className="bg-card text-foreground">
              No specific task
            </option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id} className="bg-card text-foreground">
                {t.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Timer Circle Display */}
      <div className="relative w-80 h-80 flex items-center justify-center mb-12 group">
        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
          <circle cx="160" cy="160" r={circleRadius} className="stroke-secondary fill-none" strokeWidth="8" />
          <circle
            cx="160"
            cy="160"
            r={circleRadius}
            className="fill-none transition-all duration-1000 ease-linear"
            strokeWidth="8"
            strokeLinecap="round"
            style={{
              strokeDasharray: circleCircumference,
              strokeDashoffset: strokeDashoffset,
              stroke:
                mode === 'short_break'
                  ? '#10b981'
                  : mode === 'long_break'
                  ? '#3b82f6'
                  : mode === 'deep_work'
                  ? '#9333ea'
                  : mode === 'stopwatch'
                  ? '#f59e0b'
                  : '#6366f1',
            }}
          />
        </svg>
        <div className="flex flex-col items-center justify-center z-10">
          <h1 className="text-7xl font-bold tracking-tighter text-foreground mb-2 drop-shadow-sm">
            {formattedTime}
          </h1>
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            {mode.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-6 mt-4">
        <div className="flex items-center gap-8">
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full bg-secondary/30 border-white/5 hover:bg-secondary/60 hover:border-white/10 transition-all duration-300 shadow-sm"
            onClick={toggleFullScreen}
          >
            {isFullScreen ? (
              <Minimize className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
            ) : (
              <Maximize className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
            )}
          </Button>

          {isActive ? (
            <Button
              size="lg"
              className="h-20 w-20 rounded-full bg-secondary/80 hover:bg-secondary text-foreground shadow-[0_8px_32px_rgba(0,0,0,0.2)] transition-all duration-300 active:scale-95 border border-white/5"
              onClick={pause}
            >
              <Pause className="h-8 w-8" />
            </Button>
          ) : (
            <Button
              size="lg"
              className="h-20 w-20 rounded-full shadow-[0_0_40px_rgba(99,102,241,0.4)] hover:shadow-[0_0_60px_rgba(99,102,241,0.6)] transition-all duration-300 active:scale-95 border-none"
              style={{
                backgroundColor:
                  mode === 'short_break'
                    ? '#10b981'
                    : mode === 'long_break'
                    ? '#3b82f6'
                    : mode === 'deep_work'
                    ? '#a855f7'
                    : mode === 'stopwatch'
                    ? '#f59e0b'
                    : '#6366f1',
              }}
              onClick={start}
            >
              <Play className="h-8 w-8 ml-1 text-white" />
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full bg-secondary/30 border-white/5 hover:bg-secondary/60 hover:border-white/10 transition-all duration-300 shadow-sm"
            onClick={reset}
          >
            <Square className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
          </Button>
        </div>

        <div className="flex gap-4">
          {(mode === 'short_break' || mode === 'long_break') && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full bg-secondary/30 border-white/5 hover:bg-secondary/60 transition-all shadow-sm"
              onClick={skipBreak}
            >
              <SkipForward className="h-4 w-4 mr-2" /> Skip Break
            </Button>
          )}

          {mode === 'stopwatch' && !isActive && elapsedTime > 0 && (
            <Button
              variant="default"
              size="sm"
              className="rounded-full bg-amber-500 hover:bg-amber-600 transition-all shadow-sm text-white"
              onClick={handleStopwatchComplete}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" /> Finish Stopwatch
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
