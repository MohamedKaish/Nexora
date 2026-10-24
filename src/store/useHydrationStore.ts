import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type BeverageType = 'water' | 'coffee' | 'tea' | 'electrolyte'

export interface HydrationLog {
  id: string
  amountMl: number
  beverageType: BeverageType
  timestamp: string
}

export interface HydrationState {
  baselineWeightKg: number
  activeCaloriesBurned: number
  ambientTemperatureC: number
  caffeineCups: number
  consumedTodayMl: number
  logs: HydrationLog[]
  reminderIntervalHours: number
  enableReminders: boolean
  lastReminderTimestamp: string | null

  // Actions
  logDrink: (amountMl: number, beverageType?: BeverageType) => void
  removeLog: (id: string) => void
  resetDaily: () => void
  setBaselineWeight: (kg: number) => void
  setActiveCaloriesBurned: (kcal: number) => void
  setAmbientTemperature: (tempC: number) => void
  setCaffeineCups: (cups: number) => void
  setReminderIntervalHours: (hours: number) => void
  setEnableReminders: (enabled: boolean) => void
  recordHydrationReminderSent: () => void

  // Telemetry Calculations
  getCalculations: () => {
    targetHydrationMl: number
    completionPercentage: number
    remainingMl: number
    circadianCheckpointMet: boolean
    hourlyPacingRate: number
    weatherOffsetMl: number
    caffeineOffsetMl: number
  }
}

const INITIAL_LOGS: HydrationLog[] = [
  { id: 'hydro-1', amountMl: 350, beverageType: 'water', timestamp: new Date(Date.now() - 3600000 * 4).toISOString() },
  { id: 'hydro-2', amountMl: 250, beverageType: 'coffee', timestamp: new Date(Date.now() - 3600000 * 2.5).toISOString() },
  { id: 'hydro-3', amountMl: 500, beverageType: 'water', timestamp: new Date(Date.now() - 3600000 * 1).toISOString() },
]

export const useHydrationStore = create<HydrationState>()(
  persist(
    (set, get) => ({
      baselineWeightKg: 72,
      activeCaloriesBurned: 350,
      ambientTemperatureC: 28,
      caffeineCups: 1,
      consumedTodayMl: 1100,
      logs: INITIAL_LOGS,
      reminderIntervalHours: 2,
      enableReminders: true,
      lastReminderTimestamp: null,

      logDrink: (amountMl, beverageType = 'water') => {
        const addedAmount = Math.max(10, Math.round(amountMl))
        const isCaffeine = beverageType === 'coffee' || beverageType === 'tea'
        const newLog: HydrationLog = {
          id: 'hydro-' + Date.now(),
          amountMl: addedAmount,
          beverageType,
          timestamp: new Date().toISOString(),
        }

        set((state) => ({
          consumedTodayMl: state.consumedTodayMl + addedAmount,
          caffeineCups: isCaffeine ? state.caffeineCups + 1 : state.caffeineCups,
          logs: [newLog, ...state.logs],
        }))
      },

      removeLog: (id) => {
        set((state) => {
          const item = state.logs.find((l) => l.id === id)
          if (!item) return state
          return {
            consumedTodayMl: Math.max(0, state.consumedTodayMl - item.amountMl),
            logs: state.logs.filter((l) => l.id !== id),
          }
        })
      },

      resetDaily: () =>
        set({
          consumedTodayMl: 0,
          caffeineCups: 0,
          logs: [],
        }),

      setBaselineWeight: (kg) => set({ baselineWeightKg: Math.max(30, Math.min(250, kg)) }),
      setActiveCaloriesBurned: (kcal) => set({ activeCaloriesBurned: Math.max(0, kcal) }),
      setAmbientTemperature: (tempC) => set({ ambientTemperatureC: Math.max(-10, Math.min(55, tempC)) }),
      setCaffeineCups: (cups) => set({ caffeineCups: Math.max(0, cups) }),
      setReminderIntervalHours: (hours) => set({ reminderIntervalHours: Math.max(1, Math.min(6, hours)) }),
      setEnableReminders: (enabled) => set({ enableReminders: enabled }),
      recordHydrationReminderSent: () => set({ lastReminderTimestamp: new Date().toISOString() }),

      getCalculations: () => {
        const { baselineWeightKg, activeCaloriesBurned, ambientTemperatureC, caffeineCups, consumedTodayMl } = get()

        // 1. Cellular baseline: 35 ml per kg
        const baselineMl = baselineWeightKg * 35

        // 2. Caloric exertion: 0.4 ml per active kcal burned
        const activeCalorieMl = activeCaloriesBurned * 0.4

        // 3. Ambient Thermal offset: +250ml per 5°C above 25°C threshold
        const tempDelta = Math.max(0, ambientTemperatureC - 25)
        const weatherOffsetMl = Math.round((tempDelta / 5) * 250)

        // 4. Caffeine offset: +120ml per cup to compensate for mild acute diuretic loss
        const caffeineOffsetMl = caffeineCups * 120

        const targetHydrationMl = Math.round(baselineMl + activeCalorieMl + weatherOffsetMl + caffeineOffsetMl)
        const completionPercentage = Math.min(100, Math.round((consumedTodayMl / Math.max(1, targetHydrationMl)) * 100))
        const remainingMl = Math.max(0, targetHydrationMl - consumedTodayMl)

        // Circadian pacing checkpoint: Expect 50% target achieved before 14:00
        const currentHour = new Date().getHours()
        const expectedPacingRatio = currentHour >= 14 ? 0.5 : (currentHour / 14) * 0.5
        const circadianCheckpointMet = consumedTodayMl >= targetHydrationMl * expectedPacingRatio

        // Hourly pacing rate across remaining waking hours (assumes 16h day)
        const wakingHoursRemaining = Math.max(1, 22 - currentHour)
        const hourlyPacingRate = Math.round(remainingMl / wakingHoursRemaining)

        return {
          targetHydrationMl,
          completionPercentage,
          remainingMl,
          circadianCheckpointMet,
          hourlyPacingRate,
          weatherOffsetMl,
          caffeineOffsetMl,
        }
      },
    }),
    {
      name: 'nexora_dynamic_hydration_store',
    }
  )
)
