import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LocalHabit, LocalHabitCompletion } from '@/types/local'
import { createLocalHabit, createLocalId, nowISO } from '@/types/local'
import { dbGetAll, dbPut, dbDelete } from '@/lib/db/indexeddb'

export type Habit = LocalHabit & {
  habit_completions?: LocalHabitCompletion[]
}

interface HabitStore {
  habits: Habit[]
  setHabits: (habits: Habit[]) => void
  addHabit: (partial: Partial<LocalHabit> & { name: string }) => Habit
  updateHabit: (id: string, updates: Partial<Habit>) => void
  removeHabit: (id: string) => void
  toggleCompletion: (habitId: string, date: string, isCompleted: boolean, updatedStreak?: number) => void
  hydrate: () => Promise<void>
}

export const useHabitStore = create<HabitStore>()(
  persist(
    (set, get) => ({
      habits: [],
      setHabits: (habits) => set({ habits }),
      addHabit: (partial) => {
        const habit: Habit = { ...createLocalHabit(partial), habit_completions: [] }
        set((state) => ({ habits: [...state.habits, habit] }))
        dbPut('habits', habit).catch(console.error)
        return habit
      },
      updateHabit: (id, updates) =>
        set((state) => {
          const habits = state.habits.map((h) => (h.id === id ? { ...h, ...updates, updatedAt: nowISO() } : h))
          const updated = habits.find((h) => h.id === id)
          if (updated) dbPut('habits', updated).catch(console.error)
          return { habits }
        }),
      removeHabit: (id) => {
        set((state) => ({ habits: state.habits.filter((h) => h.id !== id) }))
        dbDelete('habits', id).catch(console.error)
      },
      toggleCompletion: (habitId, date, isCompleted, updatedStreak) =>
        set((state) => {
          const habits = state.habits.map((habit) => {
            if (habit.id === habitId) {
              const completions = habit.habit_completions || []
              if (isCompleted) {
                const newCompletion: LocalHabitCompletion = {
                  id: createLocalId(),
                  habitId,
                  completedDate: date,
                  createdAt: nowISO(),
                }
                const updated = {
                  ...habit,
                  habit_completions: [...completions, newCompletion],
                  streak: typeof updatedStreak === 'number' ? updatedStreak : habit.streak + 1,
                  updatedAt: nowISO(),
                }
                dbPut('habits', updated).catch(console.error)
                return updated
              } else {
                const updated = {
                  ...habit,
                  habit_completions: completions.filter((c) => c.completedDate !== date),
                  streak: typeof updatedStreak === 'number' ? updatedStreak : Math.max(0, habit.streak - 1),
                  updatedAt: nowISO(),
                }
                dbPut('habits', updated).catch(console.error)
                return updated
              }
            }
            return habit
          })
          return { habits }
        }),
      hydrate: async () => {
        try {
          const habits = await dbGetAll<Habit>('habits')
          if (habits.length > 0) {
            set({ habits })
          }
        } catch {
          // Keep existing state
        }
      },
    }),
    {
      name: 'nexora_guest_habits',
      partialize: (state) => ({ habits: state.habits }),
    }
  )
)
