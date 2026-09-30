import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LocalGoal } from '@/types/local'
import { createLocalGoal, nowISO } from '@/types/local'
import { dbGetAll, dbPut, dbDelete } from '@/lib/db/indexeddb'

export type Goal = LocalGoal

interface GoalState {
  goals: Goal[]
  isLoading: boolean
  setGoals: (goals: Goal[]) => void
  addGoal: (partial: Partial<LocalGoal> & { title: string; periodStart: string; periodEnd: string }) => Goal
  updateGoal: (id: string, updates: Partial<Goal>) => void
  removeGoal: (id: string) => void
  hydrate: () => Promise<void>
}

export const useGoalStore = create<GoalState>()(
  persist(
    (set, get) => ({
      goals: [],
      isLoading: true,
      setGoals: (goals) => set({ goals, isLoading: false }),
      addGoal: (partial) => {
        const goal = createLocalGoal(partial)
        set((state) => ({ goals: [goal, ...state.goals] }))
        dbPut('goals', goal).catch(console.error)
        return goal
      },
      updateGoal: (id, updates) => {
        const updatedAt = nowISO()
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, ...updates, updatedAt } : g
          ),
        }))
        const goal = get().goals.find((g) => g.id === id)
        if (goal) dbPut('goals', goal).catch(console.error)
      },
      removeGoal: (id) => {
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        }))
        dbDelete('goals', id).catch(console.error)
      },
      hydrate: async () => {
        try {
          const goals = await dbGetAll<Goal>('goals')
          if (goals.length > 0) {
            set({ goals, isLoading: false })
          } else {
            set({ isLoading: false })
          }
        } catch {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'nexora_guest_goals',
      partialize: (state) => ({ goals: state.goals }),
    }
  )
)
