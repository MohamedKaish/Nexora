import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format, subDays } from 'date-fns'
import { syncHydrationNotifications } from '@/lib/nativeNotificationScheduler'

export type BeverageType = 'water' | 'coffee' | 'tea' | 'electrolyte'
export type HydrationGoalMode = 'custom' | 'physiological'
export type HydrationUnit = 'ml' | 'L'

export interface HydrationLog {
  id: string
  amountMl: number
  beverageType: BeverageType
  timestamp: string
  note?: string
}

export interface HydrationReminderConfig {
  enabled: boolean
  startTime: string // HH:mm e.g. '09:00'
  endTime: string // HH:mm e.g. '21:00'
  intervalMinutes: number // 30, 60, 90, 120, 180
  activeDays: number[] // 0=Sun..6=Sat
  quietHoursEnabled: boolean
  quietHoursStart: string // e.g. '22:30'
  quietHoursEnd: string // e.g. '06:30'
  stopWhenGoalReached: boolean
}

export interface HydrationDailyProgress {
  dateKey: string
  consumedMl: number
  goalMl: number
  remainingMl: number
  completionPercentage: number
  goalReached: boolean
  logs: HydrationLog[]
}

const DEFAULT_REMINDER_CONFIG: HydrationReminderConfig = {
  enabled: true,
  startTime: '09:00',
  endTime: '21:00',
  intervalMinutes: 120,
  activeDays: [0, 1, 2, 3, 4, 5, 6],
  quietHoursEnabled: true,
  quietHoursStart: '22:30',
  quietHoursEnd: '06:30',
  stopWhenGoalReached: true,
}

function parseMinutes(hhmm: string): number {
  const [h, m] = (hhmm || '00:00').split(':').map((v) => parseInt(v, 10))
  if (isNaN(h) || isNaN(m)) return 0
  return h * 60 + m
}

export interface HydrationState {
  dailyGoalMl: number
  goalMode: HydrationGoalMode
  preferredUnit: HydrationUnit
  servingSizesMl: number[]
  baselineWeightKg: number
  activeCaloriesBurned: number
  ambientTemperatureC: number
  caffeineCups: number
  consumedTodayMl: number
  logs: HydrationLog[]
  reminderConfig: HydrationReminderConfig
  reminderIntervalHours: number
  enableReminders: boolean
  lastReminderTimestamp: string | null
  lastLogTimestampMs: number

  // Actions
  setDailyGoalMl: (goalMl: number) => void
  setGoalMode: (mode: HydrationGoalMode) => void
  setPreferredUnit: (unit: HydrationUnit) => void
  logDrink: (
    amountMl: number,
    beverageType?: BeverageType,
    options?: { bypassDedup?: boolean; bypassDebounce?: boolean; note?: string; timestamp?: string }
  ) => HydrationLog | null
  updateLog: (id: string, partial: Partial<Pick<HydrationLog, 'amountMl' | 'beverageType' | 'note'>>) => void
  removeLog: (id: string) => void
  resetDaily: () => void
  setReminderConfig: (partial: Partial<HydrationReminderConfig>) => void
  updateReminderConfig: (partial: Partial<HydrationReminderConfig>) => void

  // Legacy setters
  setBaselineWeight: (kg: number) => void
  setActiveCaloriesBurned: (kcal: number) => void
  setAmbientTemperature: (tempC: number) => void
  setCaffeineCups: (cups: number) => void
  setReminderIntervalHours: (hours: number) => void
  setEnableReminders: (enabled: boolean) => void
  recordHydrationReminderSent: () => void

  // Calculations & Schedule Queries
  getDailyProgress: (dateKey?: string) => HydrationDailyProgress
  getHistoryByDate: (days?: number) => HydrationDailyProgress[]
  shouldFireReminderAt: (checkDate?: Date) => boolean
  getUpcomingReminderSlots: (referenceDate?: Date) => Date[]
  getCalculations: () => {
    targetHydrationMl: number
    consumedTodayMl: number
    completionPercentage: number
    remainingMl: number
    circadianCheckpointMet: boolean
    hourlyPacingRate: number
    weatherOffsetMl: number
    caffeineOffsetMl: number
  }
  calculateCircadianTarget: () => {
    targetHydrationMl: number
    consumedTodayMl: number
    completionPercentage: number
    remainingMl: number
    circadianCheckpointMet: boolean
    hourlyPacingRate: number
    weatherOffsetMl: number
    caffeineOffsetMl: number
  }
}

export const useHydrationStore = create<HydrationState>()(
  persist(
    (set, get) => ({
      dailyGoalMl: 2500,
      goalMode: 'custom',
      preferredUnit: 'ml',
      servingSizesMl: [150, 250, 350, 500],
      baselineWeightKg: 72,
      activeCaloriesBurned: 350,
      ambientTemperatureC: 25,
      caffeineCups: 0,
      consumedTodayMl: 0,
      logs: [],
      reminderConfig: DEFAULT_REMINDER_CONFIG,
      reminderIntervalHours: 2,
      enableReminders: true,
      lastReminderTimestamp: null,
      lastLogTimestampMs: 0,

      setDailyGoalMl: (goalMl) => {
        const clamped = Math.max(250, Math.min(10000, Math.round(goalMl)))
        set({ dailyGoalMl: clamped, goalMode: 'custom' })
        const state = get()
        const progress = state.getDailyProgress()
        syncHydrationNotifications({
          config: state.reminderConfig,
          consumedMl: progress.consumedMl,
          goalMl: progress.goalMl,
          upcomingSlots: state.getUpcomingReminderSlots(),
        })
      },

      setGoalMode: (mode) => set({ goalMode: mode }),
      setPreferredUnit: (unit) => set({ preferredUnit: unit }),

      logDrink: (amountMl, beverageType = 'water', options) => {
        const nowMs = Date.now()
        const state = get()
        if (
          !options?.bypassDedup &&
          !options?.bypassDebounce &&
          state.lastLogTimestampMs > 0 &&
          nowMs - state.lastLogTimestampMs < 350
        ) {
          return null
        }

        const addedAmount = Math.max(10, Math.round(amountMl))
        const isCaffeine = beverageType === 'coffee' || beverageType === 'tea'
        const newLog: HydrationLog = {
          id: 'hydro_' + Math.random().toString(36).substring(2, 9) + '_' + nowMs,
          amountMl: addedAmount,
          beverageType,
          timestamp: options?.timestamp || new Date(nowMs).toISOString(),
          note: options?.note,
        }

        const nextLogs = [newLog, ...state.logs]
        const todayKey = format(new Date(nowMs), 'yyyy-MM-dd')
        const todayTotal = nextLogs
          .filter((l) => l.timestamp.startsWith(todayKey))
          .reduce((sum, l) => sum + l.amountMl, 0)

        set({
          logs: nextLogs,
          consumedTodayMl: todayTotal,
          caffeineCups: isCaffeine ? state.caffeineCups + 1 : state.caffeineCups,
          lastLogTimestampMs: nowMs,
        })

        const updatedState = get()
        const progress = updatedState.getDailyProgress(todayKey)
        syncHydrationNotifications({
          config: updatedState.reminderConfig,
          consumedMl: progress.consumedMl,
          goalMl: progress.goalMl,
          upcomingSlots: updatedState.getUpcomingReminderSlots(),
        })

        return newLog
      },

      updateLog: (id, partial) => {
        set((state) => {
          const updatedLogs = state.logs.map((l) => {
            if (l.id !== id) return l
            return {
              ...l,
              ...partial,
              amountMl:
                partial.amountMl !== undefined
                  ? Math.max(10, Math.round(partial.amountMl))
                  : l.amountMl,
            }
          })
          const todayKey = format(new Date(), 'yyyy-MM-dd')
          const todayTotal = updatedLogs
            .filter((l) => l.timestamp.startsWith(todayKey))
            .reduce((sum, l) => sum + l.amountMl, 0)

          return {
            logs: updatedLogs,
            consumedTodayMl: todayTotal,
          }
        })

        const updatedState = get()
        const progress = updatedState.getDailyProgress()
        syncHydrationNotifications({
          config: updatedState.reminderConfig,
          consumedMl: progress.consumedMl,
          goalMl: progress.goalMl,
          upcomingSlots: updatedState.getUpcomingReminderSlots(),
        })
      },

      removeLog: (id) => {
        set((state) => {
          const updatedLogs = state.logs.filter((l) => l.id !== id)
          const todayKey = format(new Date(), 'yyyy-MM-dd')
          const todayTotal = updatedLogs
            .filter((l) => l.timestamp.startsWith(todayKey))
            .reduce((sum, l) => sum + l.amountMl, 0)

          return {
            logs: updatedLogs,
            consumedTodayMl: todayTotal,
          }
        })

        const updatedState = get()
        const progress = updatedState.getDailyProgress()
        syncHydrationNotifications({
          config: updatedState.reminderConfig,
          consumedMl: progress.consumedMl,
          goalMl: progress.goalMl,
          upcomingSlots: updatedState.getUpcomingReminderSlots(),
        })
      },

      resetDaily: () => {
        const todayKey = format(new Date(), 'yyyy-MM-dd')
        set((state) => ({
          consumedTodayMl: 0,
          caffeineCups: 0,
          logs: state.logs.filter((l) => !l.timestamp.startsWith(todayKey)),
        }))
      },

      setReminderConfig: (partial) => {
        set((state) => {
          const nextConfig: HydrationReminderConfig = {
            ...state.reminderConfig,
            ...partial,
          }
          return {
            reminderConfig: nextConfig,
            enableReminders: nextConfig.enabled,
            reminderIntervalHours: Math.max(1, Math.round(nextConfig.intervalMinutes / 60)),
          }
        })
        const updatedState = get()
        const progress = updatedState.getDailyProgress()
        syncHydrationNotifications({
          config: updatedState.reminderConfig,
          consumedMl: progress.consumedMl,
          goalMl: progress.goalMl,
          upcomingSlots: updatedState.getUpcomingReminderSlots(),
        })
      },

      updateReminderConfig: (partial) => {
        get().setReminderConfig(partial)
      },

      setBaselineWeight: (kg) => set({ baselineWeightKg: Math.max(30, Math.min(250, kg)) }),
      setActiveCaloriesBurned: (kcal) => set({ activeCaloriesBurned: Math.max(0, kcal) }),
      setAmbientTemperature: (tempC) =>
        set({ ambientTemperatureC: Math.max(-10, Math.min(55, tempC)) }),
      setCaffeineCups: (cups) => set({ caffeineCups: Math.max(0, cups) }),
      setReminderIntervalHours: (hours) => {
        const clamped = Math.max(1, Math.min(6, hours))
        get().setReminderConfig({ intervalMinutes: clamped * 60 })
      },
      setEnableReminders: (enabled) => {
        get().setReminderConfig({ enabled })
      },
      recordHydrationReminderSent: () =>
        set({ lastReminderTimestamp: new Date().toISOString() }),

      getDailyProgress: (dateKey = format(new Date(), 'yyyy-MM-dd')) => {
        const state = get()
        const dayLogs = state.logs.filter((l) => l.timestamp.startsWith(dateKey))
        const consumedMl = dayLogs.reduce((sum, l) => sum + l.amountMl, 0)

        let goalMl = state.dailyGoalMl || 2500
        if (state.goalMode === 'physiological') {
          const baselineMl = state.baselineWeightKg * 35
          const activeCalorieMl = state.activeCaloriesBurned * 0.4
          const tempDelta = Math.max(0, state.ambientTemperatureC - 25)
          const weatherOffsetMl = Math.floor(tempDelta / 5) * 250
          const caffeineOffsetMl = state.caffeineCups * 120
          goalMl = Math.round(baselineMl + activeCalorieMl + weatherOffsetMl + caffeineOffsetMl)
        }

        const remainingMl = Math.max(0, goalMl - consumedMl)
        const completionPercentage =
          goalMl > 0 ? Math.min(100, Math.round((consumedMl / goalMl) * 100)) : 0

        return {
          dateKey,
          consumedMl,
          goalMl,
          remainingMl,
          completionPercentage,
          goalReached: consumedMl >= goalMl,
          logs: dayLogs,
        }
      },

      getHistoryByDate: (days = 7) => {
        const state = get()
        const result: HydrationDailyProgress[] = []
        const now = new Date()
        for (let i = 0; i < days; i++) {
          const dKey = format(subDays(now, i), 'yyyy-MM-dd')
          result.push(state.getDailyProgress(dKey))
        }
        return result
      },

      shouldFireReminderAt: (checkDate = new Date()) => {
        const state = get()
        const cfg = state.reminderConfig
        if (!cfg.enabled) return false

        const dayOfWeek = checkDate.getDay()
        if (Array.isArray(cfg.activeDays) && !cfg.activeDays.includes(dayOfWeek)) {
          return false
        }

        const dateKey = format(checkDate, 'yyyy-MM-dd')
        const progress = state.getDailyProgress(dateKey)
        if (cfg.stopWhenGoalReached && progress.goalReached) {
          return false
        }

        const checkMin = checkDate.getHours() * 60 + checkDate.getMinutes()
        const startMin = parseMinutes(cfg.startTime)
        const endMin = parseMinutes(cfg.endTime)

        if (checkMin < startMin || checkMin > endMin) {
          return false
        }

        if (cfg.quietHoursEnabled && cfg.quietHoursStart && cfg.quietHoursEnd) {
          const qStart = parseMinutes(cfg.quietHoursStart)
          const qEnd = parseMinutes(cfg.quietHoursEnd)
          if (qStart > qEnd) {
            // Spans midnight e.g. 22:30 -> 06:30
            if (checkMin >= qStart || checkMin <= qEnd) return false
          } else {
            if (checkMin >= qStart && checkMin <= qEnd) return false
          }
        }

        return true
      },

      getUpcomingReminderSlots: (referenceDate = new Date()) => {
        const state = get()
        const cfg = state.reminderConfig
        if (!cfg.enabled) return []

        const progress = state.getDailyProgress(format(referenceDate, 'yyyy-MM-dd'))
        if (cfg.stopWhenGoalReached && progress.goalReached) {
          return []
        }

        const interval = Math.max(15, cfg.intervalMinutes || 120)
        const startMin = parseMinutes(cfg.startTime)
        const endMin = parseMinutes(cfg.endTime)
        const slots: Date[] = []

        for (let dayOffset = 0; dayOffset <= 1; dayOffset++) {
          for (let mins = startMin; mins <= endMin; mins += interval) {
            const h = Math.floor(mins / 60)
            const m = mins % 60
            const slotDate = new Date(
              referenceDate.getFullYear(),
              referenceDate.getMonth(),
              referenceDate.getDate() + dayOffset,
              h,
              m,
              0,
              0
            )
            if (slotDate.getTime() <= referenceDate.getTime()) continue
            if (state.shouldFireReminderAt(slotDate)) {
              slots.push(slotDate)
            }
          }
        }

        return slots
      },

      getCalculations: () => {
        const state = get()
        const progress = state.getDailyProgress()
        const tempDelta = Math.max(0, state.ambientTemperatureC - 25)
        const weatherOffsetMl = Math.floor(tempDelta / 5) * 250
        const caffeineOffsetMl = state.caffeineCups * 120

        const currentHour = new Date().getHours()
        const remainingWakingHours = Math.max(1, 22 - currentHour)
        const hourlyPacingRate = Math.round(progress.remainingMl / remainingWakingHours)
        const circadianCheckpointMet =
          currentHour < 14 ? true : progress.consumedMl >= progress.goalMl * 0.5

        return {
          targetHydrationMl: progress.goalMl,
          consumedTodayMl: progress.consumedMl,
          completionPercentage: progress.completionPercentage,
          remainingMl: progress.remainingMl,
          circadianCheckpointMet,
          hourlyPacingRate,
          weatherOffsetMl,
          caffeineOffsetMl,
        }
      },

      calculateCircadianTarget: () => {
        return get().getCalculations()
      },
    }),
    {
      name: 'nexora-hydration-storage',
      version: 2,
      migrate: (persistedState: unknown, version: number) => {
        const s = (persistedState as Partial<HydrationState>) || {}
        if (version < 2) {
          return {
            ...s,
            dailyGoalMl: s.dailyGoalMl || 2500,
            goalMode: s.goalMode || 'custom',
            preferredUnit: s.preferredUnit || 'ml',
            servingSizesMl: s.servingSizesMl || [150, 250, 350, 500],
            logs: Array.isArray(s.logs) ? s.logs : [],
            reminderConfig: s.reminderConfig || DEFAULT_REMINDER_CONFIG,
          }
        }
        return s as HydrationState
      },
    }
  )
)
