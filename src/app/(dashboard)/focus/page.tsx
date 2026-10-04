'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useFocusStore } from '@/store/useFocusStore'
import { useTaskStore } from '@/store/useTaskStore'
import { useCharacterStore } from '@/store/characterStore'
import { useAppStore } from '@/store/appStore'
import { Companion } from '@/components/companion/Companion'
import { companionController } from '@/components/companion/CompanionController'
import { FocusMode } from '@/types/local'
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  CheckCircle2,
  Clock,
  Target,
  Flame,
  Award,
} from 'lucide-react'
import { format } from 'date-fns'

interface Soundscape {
  id: string
  name: string
  icon: string
  type: 'rain' | 'space' | 'brown' | 'chimes'
}

const SOUNDSCAPES: Soundscape[] = [
  { id: 'rain', name: 'Celestial Rain', icon: '🌧️', type: 'rain' },
  { id: 'space', name: 'Deep Nebula', icon: '🌌', type: 'space' },
  { id: 'brown', name: 'Cosmic Drift', icon: '🪐', type: 'brown' },
  { id: 'chimes', name: 'Sanctuary Bell', icon: '🎐', type: 'chimes' },
]

export default function FocusChamberPage() {
  const {
    mode,
    remainingSeconds,
    isRunning,
    sessions,
    setMode,
    startTimer,
    pauseTimer,
    resetTimer,
  } = useFocusStore()

  const tasks = useTaskStore((s) => s.tasks)
  const activeTasks = tasks.filter((t) => t.status !== 'done')
  const charConfig = useCharacterStore((s) => s.config)
  const agentName = useAppStore((s) => s.agentConfig.name) || 'Kyro'

  const [selectedTaskId, setSelectedTaskId] = useState<string>('')
  const [activeSound, setActiveSound] = useState<string | null>(null)
  const [volume, setVolume] = useState<number>(0.3)
  const audioContextRef = useRef<AudioContext | null>(null)
  const noiseNodeRef = useRef<AudioNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)

  // Compute total duration for circular progress
  const totalDuration = (() => {
    switch (mode) {
      case 'pomodoro':
        return 25 * 60
      case 'deep_work':
        return 50 * 60
      case 'short_break':
        return 5 * 60
      case 'long_break':
        return 15 * 60
      case 'stopwatch':
        return 60 * 60
      default:
        return 25 * 60
    }
  })()

  const progress =
    mode === 'stopwatch'
      ? Math.min(1, (remainingSeconds % 3600) / 3600)
      : Math.max(0, Math.min(1, (totalDuration - remainingSeconds) / totalDuration))

  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

  // Web Audio synthesizer for ambient soundscapes
  const toggleSoundscape = (soundId: string) => {
    if (activeSound === soundId) {
      stopAudio()
      setActiveSound(null)
      return
    }

    stopAudio()
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioCtx()
      audioContextRef.current = ctx

      const gain = ctx.createGain()
      gain.gain.value = volume
      gain.connect(ctx.destination)
      gainNodeRef.current = gain

      const bufferSize = ctx.sampleRate * 2
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)

      if (soundId === 'rain') {
        let lastOut = 0.0
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1
          data[i] = (lastOut + 0.02 * white) / 1.02
          lastOut = data[i]
          data[i] *= 2.5
        }
      } else if (soundId === 'space') {
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.sin((i / bufferSize) * Math.PI * 40) * 0.08 + (Math.random() * 0.02 - 0.01)
        }
      } else {
        // Brown noise
        let lastOut = 0.0
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1
          data[i] = (lastOut + 0.04 * white) / 1.04
          lastOut = data[i]
          data[i] *= 3.0
        }
      }

      const noise = ctx.createBufferSource()
      noise.buffer = buffer
      noise.loop = true
      noise.connect(gain)
      noise.start()
      noiseNodeRef.current = noise
      setActiveSound(soundId)
    } catch {
      // Audio not permitted without interaction
    }
  }

  const stopAudio = () => {
    try {
      if (noiseNodeRef.current) {
        ;(noiseNodeRef.current as AudioScheduledSourceNode).stop()
        noiseNodeRef.current.disconnect()
        noiseNodeRef.current = null
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
    } catch {
      // Ignore audio cleanup errors
    }
  }

  useEffect(() => {
    return () => {
      stopAudio()
    }
  }, [])

  // Calculate total focus minutes today
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todaySessions = sessions.filter((s) => s.completedAt.startsWith(todayStr))
  const todayMinutes = Math.round(
    todaySessions.reduce((acc, curr) => acc + curr.durationSeconds, 0) / 60
  )

  const selectedTask = tasks.find((t) => t.id === selectedTaskId)

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Title & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-gradient-gold">
            Deep Focus Chamber
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Silence the noise. Step into intentional flow alongside {agentName}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center gap-2.5">
            <Flame className="w-4 h-4 text-amber-400" />
            <div>
              <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">Today's Focus</p>
              <p className="text-sm font-bold text-amber-300">{todayMinutes} mins</p>
            </div>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-stone-900/80 border border-stone-800 flex items-center gap-2.5">
            <Award className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">Completed</p>
              <p className="text-sm font-bold text-foreground">{todaySessions.length} sessions</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Chamber Display (Left 8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="world-deck p-6 sm:p-10 flex flex-col items-center justify-center relative overflow-hidden text-center">
            {/* Ambient Background Aura */}
            <div
              className={`absolute inset-0 bg-gradient-radial from-amber-500/15 via-transparent to-transparent pointer-events-none transition-opacity duration-1000 ${
                isRunning ? 'opacity-100 scale-110' : 'opacity-40 scale-100'
              }`}
            />

            {/* Mode Tabs */}
            <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-stone-900/90 border border-stone-800 mb-8 relative z-10">
              {(
                [
                  { id: 'pomodoro', label: 'Pomodoro 25m' },
                  { id: 'deep_work', label: 'Deep Work 50m' },
                  { id: 'short_break', label: 'Short Break 5m' },
                  { id: 'long_break', label: 'Long Break 15m' },
                  { id: 'stopwatch', label: 'Flow Stopwatch' },
                ] as { id: FocusMode; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setMode(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    mode === tab.id
                      ? 'bg-amber-400 text-stone-950 shadow-md font-bold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Circular Visualizer */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center my-2">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 256 256">
                <circle
                  cx="128"
                  cy="128"
                  r="110"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-stone-800/80 fill-none"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="110"
                  stroke="currentColor"
                  strokeWidth="10"
                  strokeDasharray={2 * Math.PI * 110}
                  strokeDashoffset={2 * Math.PI * 110 * (1 - progress)}
                  strokeLinecap="round"
                  className={`fill-none transition-all duration-1000 ${
                    isRunning ? 'text-amber-400 shadow-[0_0_20px_#D4A853]' : 'text-amber-500/50'
                  }`}
                />
              </svg>

              {/* Center Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl sm:text-6xl font-mono font-bold tracking-tighter text-foreground drop-shadow-md">
                  {formattedTime}
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-300/80 mt-2">
                  {mode.replace('_', ' ')}
                </span>
                {selectedTask && (
                  <div className="max-w-[200px] truncate text-xs text-stone-400 mt-2 bg-stone-900/80 px-2.5 py-1 rounded-full border border-stone-800">
                    🎯 {selectedTask.title}
                  </div>
                )}
              </div>
            </div>

            {/* Play / Pause / Reset Controls */}
            <div className="flex items-center gap-4 mt-8 relative z-10">
              <button
                onClick={resetTimer}
                className="w-12 h-12 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-stone-800 flex items-center justify-center text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
                title="Reset session"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                onClick={() => {
                  if (isRunning) {
                    pauseTimer()
                    companionController.emitMood('idle')
                  } else {
                    startTimer()
                    companionController.onFocusStarted(mode)
                  }
                }}
                className={`w-18 h-18 rounded-3xl flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer ${
                  isRunning
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400 hover:bg-amber-500/30 shadow-[0_0_30px_rgba(212,168,83,0.35)]'
                    : 'bg-amber-400 hover:bg-amber-300 text-stone-950 shadow-[0_0_25px_rgba(212,168,83,0.45)] hover:scale-105'
                }`}
              >
                {isRunning ? (
                  <Pause className="w-8 h-8 fill-current" />
                ) : (
                  <Play className="w-8 h-8 fill-current ml-1" />
                )}
              </button>
            </div>
          </div>

          {/* Soundscapes & Sanctuary Audio */}
          <div className="world-surface p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-foreground">Sanctuary Soundscapes</h3>
              </div>
              <span className="text-xs text-stone-400 font-medium">Binaural White Noise Generator</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SOUNDSCAPES.map((sound) => {
                const isActive = activeSound === sound.id
                return (
                  <button
                    key={sound.id}
                    onClick={() => toggleSoundscape(sound.id)}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-400/15 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(212,168,83,0.2)]'
                        : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                    }`}
                  >
                    <span className="text-xl">{sound.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{sound.name}</p>
                      <p className="text-[10px] opacity-60">{isActive ? 'Playing' : 'Idle'}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Info (Right 4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Companion Presence Card */}
          <div className="world-surface p-6 flex flex-col items-center text-center space-y-4">
            <Companion
              size={96}
              showGlow={isRunning}
              speechTextOverride={
                isRunning
                  ? 'I am guarding your focus boundary. Let the world wait.'
                  : `Select your chamber duration, ${agentName} is ready.`
              }
            />

            <div>
              <h4 className="font-bold text-sm text-foreground">{agentName}</h4>
              <p className="text-xs text-amber-300/80 font-medium">Focus Guardian</p>
            </div>
          </div>

          {/* Task Anchor Selector */}
          <div className="world-surface p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-foreground">Anchor to Task</h3>
            </div>
            <p className="text-xs text-stone-400">
              Dedicate this block to a specific active quest to track deep work hours.
            </p>

            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-xs text-foreground focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="">-- No specific task (Pure Flow) --</option>
              {activeTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.priority})
                </option>
              ))}
            </select>
          </div>

          {/* Session Log / Recent Chambers */}
          <div className="world-surface p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-foreground">Chamber History</h3>
              </div>
              <span className="text-xs text-stone-400 font-medium">{sessions.length} total</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {sessions.length === 0 ? (
                <p className="text-xs text-stone-500 py-3 text-center">
                  No sessions recorded yet. Finish a timer to log your flow!
                </p>
              ) : (
                sessions.slice(0, 6).map((s) => (
                  <div
                    key={s.id}
                    className="p-2.5 rounded-xl bg-stone-900/60 border border-stone-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <div>
                        <p className="font-semibold text-stone-200 capitalize">
                          {s.mode.replace('_', ' ')}
                        </p>
                        <p className="text-[10px] text-stone-500">
                          {format(new Date(s.completedAt), 'MMM dd, HH:mm')}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-amber-300 font-bold">
                      {Math.round(s.durationSeconds / 60)}m
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
