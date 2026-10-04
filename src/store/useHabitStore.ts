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
          set((state) => ({
            completions: state.completions.filter((c) => c.id !== existing.id),
            habits: state.habits.map((h) =>
              h.id === habitId ? { ...h, streak: Math.max(0, h.streak - 1) } : h
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
          set((state) => ({
            completions: [...state.completions, newCompletion],
            habits: state.habits.map((h) =>
              h.id === habitId ? { ...h, streak: h.streak + 1 } : h
            ),
          }))
          return true
        }
      },
    }),
    { name: 'nexora_habit_storage' }
  )
)
