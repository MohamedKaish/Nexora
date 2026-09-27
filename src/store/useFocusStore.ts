import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { FocusMode, FocusSession } from '@/features/focus/types'
export type { FocusMode, FocusSession }

interface FocusState {
  isActive: boolean
  mode: FocusMode
  timeLeft: number // in seconds
  elapsedTime: number // in seconds, for stopwatch
  duration: number // original duration in seconds
  taskId: string | null
  isFullScreen: boolean
  sessionsCompleted: number
  history: FocusSession[]
  
  // Actions
  start: () => void
  pause: () => void
  reset: () => void
  setMode: (mode: FocusMode, customDurationMinutes?: number) => void
  setTask: (taskId: string | null) => void
  tick: () => void
  toggleFullScreen: () => void
  skipBreak: () => void
  completeSession: () => void
}

const DEFAULT_DURATIONS = {
  pomodoro: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
  deep_work: 60 * 60,
  stopwatch: 0,
  custom: 25 * 60,
}

export const useFocusStore = create<FocusState>()(
  persist(
    (set) => ({
      isActive: false,
      mode: 'pomodoro',
      timeLeft: DEFAULT_DURATIONS.pomodoro,
      elapsedTime: 0,
      duration: DEFAULT_DURATIONS.pomodoro,
      taskId: null,
      isFullScreen: false,
      sessionsCompleted: 0,
      history: [],
      
      start: () => set({ isActive: true }),
      pause: () => set({ isActive: false }),
      reset: () => set((state) => ({ 
        isActive: false, 
        timeLeft: state.mode === 'stopwatch' ? 0 : state.duration,
        elapsedTime: 0
      })),
      setMode: (mode, customDurationMinutes) => set(() => {
        const duration = customDurationMinutes 
          ? customDurationMinutes * 60 
          : DEFAULT_DURATIONS[mode]
        return {
          mode,
          duration,
          timeLeft: mode === 'stopwatch' ? 0 : duration,
          elapsedTime: 0,
          isActive: false
        }
      }),
      setTask: (taskId) => set({ taskId }),
      tick: () => set((state) => {
        if (!state.isActive) return state
        
        if (state.mode === 'stopwatch') {
          return { elapsedTime: state.elapsedTime + 1, timeLeft: state.elapsedTime + 1 }
        }
        
        if (state.timeLeft <= 0) return state
        return { timeLeft: state.timeLeft - 1 }
      }),
      toggleFullScreen: () => set((state) => ({ isFullScreen: !state.isFullScreen })),
      skipBreak: () => set(() => ({
        mode: 'pomodoro',
        duration: DEFAULT_DURATIONS.pomodoro,
        timeLeft: DEFAULT_DURATIONS.pomodoro,
        elapsedTime: 0,
        isActive: true, // immediately start
      })),
      completeSession: () => set((state) => {
        const newSession: FocusSession = {
          id: crypto.randomUUID(),
          mode: state.mode,
          duration: state.mode === 'stopwatch' ? state.elapsedTime : state.duration,
          completedAt: new Date().toISOString()
        }
        
        const isWork = state.mode === 'pomodoro' || state.mode === 'deep_work' || state.mode === 'custom' || state.mode === 'stopwatch'
        const newSessionsCompleted = isWork ? state.sessionsCompleted + 1 : state.sessionsCompleted
        
        // Determine next mode automatically
        let nextMode: FocusMode = 'pomodoro'
        let autoStart = false
        
        if (isWork) {
          // If 4 sessions completed, take a long break
          if (newSessionsCompleted > 0 && newSessionsCompleted % 4 === 0) {
            nextMode = 'long_break'
          } else {
            nextMode = 'short_break'
          }
          autoStart = true
        } else {
          // Break just finished, start work
          nextMode = 'pomodoro'
          autoStart = true
        }
        
        const nextDuration = DEFAULT_DURATIONS[nextMode]
        
        return {
          isActive: autoStart,
          mode: nextMode,
          duration: nextDuration,
          timeLeft: nextDuration,
          elapsedTime: 0,
          sessionsCompleted: newSessionsCompleted,
          history: [...state.history, newSession]
        }
      })
    }),
    {
      name: 'nexora-focus-storage',
      partialize: (state) => ({
        // Only persist these fields
        mode: state.mode,
        timeLeft: state.timeLeft,
        elapsedTime: state.elapsedTime,
        duration: state.duration,
        taskId: state.taskId,
        isActive: state.isActive,
        sessionsCompleted: state.sessionsCompleted,
        history: state.history,
        isFullScreen: false // always false on load
      })
    }
  )
)
