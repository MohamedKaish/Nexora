import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LocalHabit, LocalHabitCompletion, HabitFrequency } from '@/types/local'
import { format } from 'date-fns'
import {
  syncHabitNotification,
  cancelAlarmsBySourceId,
} from '@/lib/nativeNotificationScheduler'

interface HabitState {
  habits: LocalHabit[]
  completions: LocalHabitCompletion[]
  addHabit: (params: {
    name: string
    description?: string | null
    frequency?: HabitFrequency
    selectedDays?: number[]
    color?: string
    hasTimeRange?: boolean
    startTime?: string | null
    endTime?: string | null
    reminderTime?: string | null
    enableReminder?: boolean
  }) => LocalHabit
  updateHabit: (id: string, partial: Partial<LocalHabit>) => void
  removeHabit: (id: string) => void
  toggleCompletion: (habitId: string, dateStr?: string) => boolean
  markHabitNotified: (id: string, dateStr: string) => void
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
        const hasRange =
          params.hasTimeRange ?? Boolean(params.startTime || params.reminderTime)
        const start = hasRange
          ? params.startTime ?? params.reminderTime ?? '08:00'
          : null
        const habit: LocalHabit = {
          id: 'habit_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
          name: params.name,
          description: params.description ?? null,
          frequency: params.frequency ?? 'daily',
          selectedDays: params.selectedDays,
          color: params.color ?? '#34D399',
          streak: 0,
          hasTimeRange: hasRange,
          startTime: start,
          endTime: hasRange ? params.endTime ?? '09:00' : null,
          reminderTime: hasRange ? params.reminderTime ?? start : null,
          enableReminder: hasRange ? params.enableReminder ?? true : false,
          lastNotifiedDate: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({ habits: [...state.habits, habit] }))
        syncHabitNotification(habit, false)
        return habit
      },

      updateHabit: (id, partial) => {
        let updatedHabit: LocalHabit | null = null
        set((state) => ({
          habits: state.habits.map((h) => {
            if (h.id !== id) return h
            updatedHabit = {
              ...h,
              ...partial,
              updatedAt: new Date().toISOString(),
            }
            return updatedHabit
          }),
        }))
        if (updatedHabit) {
          const todayStr = format(new Date(), 'yyyy-MM-dd')
          const doneToday = get().completions.some(
            (c) => c.habitId === id && c.completedDate === todayStr
          )
          syncHabitNotification(updatedHabit, doneToday)
        }
      },

      markHabitNotified: (id, dateStr) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id ? { ...h, lastNotifiedDate: dateStr } : h
          ),
        }))
      },

      removeHabit: (id) => {
        cancelAlarmsBySourceId(id)
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
          const updatedCompletions = get().completions.filter((c) => c.id !== existing.id)
          const newStreak = computeConsecutiveStreak(habitId, updatedCompletions)
          set((state) => ({
            completions: updatedCompletions,
            habits: state.habits.map((h) =>
              h.id === habitId ? { ...h, streak: newStreak } : h
            ),
          }))
          const targetHabit = get().habits.find((h) => h.id === habitId)
          if (targetHabit) {
            syncHabitNotification(targetHabit, false)
          }
          return false
        } else {
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
          const targetHabit = get().habits.find((h) => h.id === habitId)
          if (targetHabit) {
            syncHabitNotification(targetHabit, true)
          }
          return true
        }
      },
    }),
    {
      name: 'nexora_habit_storage',
      version: 2,
      migrate: (persistedState: unknown) => {
        const state = (persistedState || {}) as Partial<HabitState>
        const rawHabits = Array.isArray(state.habits) ? state.habits : []
        const migratedHabits: LocalHabit[] = rawHabits
          .filter((h) => h && !['habit-wake-up', 'habit-morning-focus', 'habit-evening-reflection'].includes(h.id))
          .map((h) => ({
            ...h,
            reminderTime: h.reminderTime ?? h.startTime ?? null,
            selectedDays: Array.isArray(h.selectedDays) ? h.selectedDays : undefined,
          }))
        return {
          habits: migratedHabits,
          completions: Array.isArray(state.completions) ? state.completions : [],
        }
      },
    }
  )
)
