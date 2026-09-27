export type FocusMode = 'pomodoro' | 'short_break' | 'long_break' | 'deep_work' | 'stopwatch' | 'custom'

export interface FocusSession {
  id: string
  mode: FocusMode
  duration: number
  completedAt: string
}
