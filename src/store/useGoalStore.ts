import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { LocalGoal, GoalType } from '@/types/local'

interface GoalState {
  goals: LocalGoal[]
  addGoal: (params: { title: string; type?: GoalType; periodStart?: string; periodEnd?: string }) => void
  updateGoal: (id: string, partial: Partial<LocalGoal>) => void
  removeGoal: (id: string) => void
}

const INITIAL_GOALS: LocalGoal[] = [
  {
    id: 'goal-1',
    title: 'Achieve 20 Focused Deep Work Hours',
    type: 'weekly',
    status: 'active',
    progress: 45,
    periodStart: new Date().toISOString(),
    periodEnd: new Date(Date.now() + 7 * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'goal-2',
    title: 'Maintain 14-Day Consistency Across Habits',
    type: 'monthly',
    status: 'active',
    progress: 60,
    periodStart: new Date().toISOString(),
    periodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export const useGoalStore = create<GoalState>()(
  persist(
    (set) => ({
      goals: INITIAL_GOALS,

      addGoal: (params) => {
        const goal: LocalGoal = {
          id: 'goal_' + Math.random().toString(36).substring(2, 9),
          title: params.title,
          type: params.type ?? 'weekly',
          status: 'active',
          progress: 0,
          periodStart: params.periodStart ?? new Date().toISOString(),
          periodEnd: params.periodEnd ?? new Date(Date.now() + 7 * 86400000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({ goals: [...state.goals, goal] }))
      },

      updateGoal: (id, partial) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, ...partial, updatedAt: new Date().toISOString() } : g
          ),
        }))
      },

      removeGoal: (id) => {
        set((state) => ({ goals: state.goals.filter((g) => g.id !== id) }))
      },
    }),
    { name: 'nexora_goal_storage' }
  )
)
