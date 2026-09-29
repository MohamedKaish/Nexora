import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Database } from '@/types/database.types'

export type Goal = Database['public']['Tables']['goals']['Row']

interface GoalState {
  goals: Goal[]
  isLoading: boolean
  setGoals: (goals: Goal[]) => void
  addGoal: (goal: Goal) => void
  updateGoal: (id: string, updates: Partial<Goal>) => void
  removeGoal: (id: string) => void
}

export const useGoalStore = create<GoalState>()(
  persist(
    (set) => ({
      goals: [],
      isLoading: true,
      setGoals: (goals) => set({ goals, isLoading: false }),
      addGoal: (goal) => set((state) => ({ goals: [goal, ...state.goals] })),
      updateGoal: (id, updates) => set((state) => ({
        goals: state.goals.map((g) => g.id === id ? { ...g, ...updates } : g)
      })),
      removeGoal: (id) => set((state) => ({
        goals: state.goals.filter((g) => g.id !== id)
      })),
    }),
    {
      name: 'nexora_guest_goals',
      partialize: (state) => ({ goals: state.goals }),
    }
  )
)
