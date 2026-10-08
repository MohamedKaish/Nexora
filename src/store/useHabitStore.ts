import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { LocalHabit, LocalHabitCompletion, HabitFrequency } from '@/types/local'
import { format } from 'date-fns'

interface HabitState {
  habits: LocalHabit[]
  completions: LocalHabitCompletion[]
  addHabit: (params: { name: string; frequency?: HabitFrequency; color?: string }) => void
  removeHabit: (id: string) => void
  toggleCompletion: (habitId: string, dateStr?: string) => boolean
}

function computeConsecutiveStreak(habitId: string, completions: LocalHabitCompletion[]): number {
  const dates = new Set(
    completions
      .filter((c) => c.habitId === habitId)
      .map((c) => c.completedDate)
  )

  let streak = 0
  let checkDate = new Date()
  const todayStr = format(checkDate, 'yyyy-MM-dd')

  // If today isn't checked, check if yesterday was checked
  if (!dates.has(todayStr)) {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    if (!dates.has(format(yesterday, 'yyyy-MM-dd'))) {
      return 0
    }
    checkDate = yesterday
  }

  while (dates.has(format(checkDate, 'yyyy-MM-dd'))) {
    streak++
    checkDate.setDate(checkDate.getDate() - 1)
  }

  return streak
}

const INITIAL_HABITS: LocalHabit[] = []

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      habits: INITIAL_HABITS,
      completions: [],

      addHabit: (params) => {
        const habit: LocalHabit = {
          id: 'habit_' + Math.random().toString(36).substring(2, 9),
          name: params.name,
          frequency: params.frequency ?? 'daily',
          color: params.color ?? '#34D399',
          streak: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({ habits: [...state.habits, habit] }))
      },

      removeHabit: (id) => {
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
          completions: state.completions.filter((c) => c.habitId !== id),
        }))
      },

      toggleCompletion: (habitId, dateStr = format(new Date(), 'yyyy-MM-dd')) => {
        const existing = get().completions.find(
          (c) => c.habitId === habitId && c.completedDate === dateStr
        )
        const isDone = !!existing

        if (isDone) {
          // Unmark
          const updatedCompletions = get().completions.filter((c) => c.id !== existing.id)
          const newStreak = computeConsecutiveStreak(habitId, updatedCompletions)
          set((state) => ({
            completions: updatedCompletions,
            habits: state.habits.map((h) =>
              h.id === habitId ? { ...h, streak: newStreak } : h
            ),
          }))
          return false
        } else {
          // Mark complete
          const newCompletion: LocalHabitCompletion = {
            id: 'comp_' + Math.random().toString(36).substring(2, 9),
            habitId,
            completedDate: dateStr,
            createdAt: new Date().toISOString(),
          }
          const updatedCompletions = [...get().completions, newCompletion]
          const newStreak = computeConsecutiveStreak(habitId, updatedCompletions)
          set((state) => ({
            completions: updatedCompletions,
            habits: state.habits.map((h) =>
              h.id === habitId ? { ...h, streak: newStreak } : h
            ),
          }))
          return true
        }
      },
    }),
    { name: 'nexora_habit_storage' }
  )
)
