import { create } from 'zustand'

interface KyroState {
  isKyroEnabled: boolean
  schedulingPreference: 'balanced' | 'aggressive' | 'relaxed'
  enableKyro: (enabled: boolean) => void
  setSchedulingPreference: (pref: 'balanced' | 'aggressive' | 'relaxed') => void
}

export const useKyroStore = create<KyroState>((set) => ({
  isKyroEnabled: false,
  schedulingPreference: 'balanced',
  enableKyro: (enabled) => set({ isKyroEnabled: enabled }),
  setSchedulingPreference: (pref) => set({ schedulingPreference: pref }),
}))
