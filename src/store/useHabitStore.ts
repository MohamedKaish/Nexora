import { create } from 'zustand'
import { Database } from '@/types/database.types'

type HabitRow = Database['public']['Tables']['habits']['Row']
type CompletionRow = Database['public']['Tables']['habit_completions']['Row']

export type Habit = HabitRow & {
  habit_completions?: CompletionRow[]
}

interface HabitStore {
  habits: Habit[]
  setHabits: (habits: Habit[]) => void
  addHabit: (habit: Habit) => void
  removeHabit: (id: string) => void
  toggleCompletion: (habitId: string, date: string, isCompleted: boolean) => void
}

export const useHabitStore = create<HabitStore>((set) => ({
  habits: [],
  setHabits: (habits) => set({ habits }),
  addHabit: (habit) => set((state) => ({ habits: [...state.habits, habit] })),
  removeHabit: (id) => set((state) => ({ habits: state.habits.filter(h => h.id !== id) })),
  toggleCompletion: (habitId, date, isCompleted) => set((state) => {
    return {
      habits: state.habits.map(habit => {
        if (habit.id === habitId) {
          const completions = habit.habit_completions || []
          
          if (isCompleted) {
            // Optimistically add completion
            const newCompletion: CompletionRow = {
              id: 'temp-' + Date.now(),
              user_id: habit.user_id,
              habit_id: habitId,
              completed_date: date,
              created_at: new Date().toISOString()
            }
            return {
              ...habit,
              habit_completions: [...completions, newCompletion],
              streak: habit.streak + 1 // Optimistic streak increment
            }
          } else {
            // Optimistically remove completion
            return {
              ...habit,
              habit_completions: completions.filter(c => c.completed_date !== date),
              streak: Math.max(0, habit.streak - 1) // Optimistic streak decrement
            }
          }
        }
        return habit
      })
    }
  })
}))
