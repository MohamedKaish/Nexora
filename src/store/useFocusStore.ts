import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FocusMode, LocalFocusSession } from '@/types/local'

interface FocusState {
  mode: FocusMode
  remainingSeconds: number
  isRunning: boolean
  lastStartedAt: number | null
  sessions: LocalFocusSession[]
  setMode: (mode: FocusMode) => void
  startTimer: () => void
  pauseTimer: () => void
  resetTimer: () => void
  tick: () => void
  logCompletedSession: () => void
}

const DEFAULT_DURATIONS: Record<FocusMode, number> = {
  pomodoro: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
  deep_work: 50 * 60,
  stopwatch: 0,
}

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      mode: 'pomodoro',
      remainingSeconds: 25 * 60,
      isRunning: false,
      lastStartedAt: null,
      sessions: [],

      setMode: (mode) => {
        set({
          mode,
          remainingSeconds: DEFAULT_DURATIONS[mode],
          isRunning: false,
          lastStartedAt: null,
        })
      },

      startTimer: () => {
        set({ isRunning: true, lastStartedAt: Date.now() })
      },

      pauseTimer: () => {
        set({ isRunning: false, lastStartedAt: null })
      },

      resetTimer: () => {
        const { mode } = get()
        set({
          remainingSeconds: DEFAULT_DURATIONS[mode],
          isRunning: false,
          lastStartedAt: null,
        })
      },

      tick: () => {
        const { isRunning, remainingSeconds, mode, lastStartedAt } = get()
        if (!isRunning) return

        const now = Date.now()
        // Compute delta if lastStartedAt is set, otherwise default to 1 second
        const delta = lastStartedAt ? Math.max(1, Math.round((now - lastStartedAt) / 1000)) : 1

        if (mode === 'stopwatch') {
          set({
            remainingSeconds: remainingSeconds + delta,
            lastStartedAt: now,
          })
        } else {
          if (remainingSeconds > delta) {
            set({
              remainingSeconds: remainingSeconds - delta,
              lastStartedAt: now,
            })
          } else {
            // Timer completed
            get().logCompletedSession()
            set({ isRunning: false, remainingSeconds: 0, lastStartedAt: null })
          }
        }
      },

      logCompletedSession: () => {
        const { mode } = get()
        const duration = mode === 'stopwatch' ? get().remainingSeconds : DEFAULT_DURATIONS[mode]
        const session: LocalFocusSession = {
          id: 'focus_' + Math.random().toString(36).substring(2, 9),
          mode,
          durationSeconds: duration,
          completedAt: new Date().toISOString(),
        }
        set((state) => ({ sessions: [session, ...state.sessions] }))
      },
    }),
    {
      name: 'nexora_focus_storage',
      onRehydrateStorage: () => (state) => {
        if (!state) return
        // Background elapsed recovery across tab close / sleep
        if (state.isRunning && state.lastStartedAt) {
          const now = Date.now()
          const elapsed = Math.floor((now - state.lastStartedAt) / 1000)

          if (state.mode === 'stopwatch') {
            state.remainingSeconds += elapsed
            state.lastStartedAt = now
          } else {
            if (state.remainingSeconds > elapsed) {
              state.remainingSeconds -= elapsed
              state.lastStartedAt = now
            } else {
              // Completed while app was inactive
              state.logCompletedSession()
              state.isRunning = false
              state.remainingSeconds = 0
              state.lastStartedAt = null
            }
          }
        }
      },
    }
  )
)
