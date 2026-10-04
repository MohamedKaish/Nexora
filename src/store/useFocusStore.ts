import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { FocusMode, LocalFocusSession } from '@/types/local'

interface FocusState {
  mode: FocusMode
  remainingSeconds: number
  isRunning: boolean
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
      sessions: [],

      setMode: (mode) => {
        set({
          mode,
          remainingSeconds: DEFAULT_DURATIONS[mode],
          isRunning: false,
        })
      },

      startTimer: () => set({ isRunning: true }),
      pauseTimer: () => set({ isRunning: false }),

      resetTimer: () => {
        const { mode } = get()
        set({
          remainingSeconds: DEFAULT_DURATIONS[mode],
          isRunning: false,
        })
      },

      tick: () => {
        const { isRunning, remainingSeconds, mode } = get()
        if (!isRunning) return

        if (mode === 'stopwatch') {
          set({ remainingSeconds: remainingSeconds + 1 })
        } else {
          if (remainingSeconds > 1) {
            set({ remainingSeconds: remainingSeconds - 1 })
          } else {
            // Completed
            get().logCompletedSession()
            set({ isRunning: false, remainingSeconds: 0 })
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
    { name: 'nexora_focus_storage' }
  )
)
