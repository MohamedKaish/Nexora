import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { LocalPreferences, DEFAULT_PREFERENCES, AgentConfig, DEFAULT_AGENT_CONFIG } from '@/types/local'

interface AppState {
  preferences: LocalPreferences
  agentConfig: AgentConfig
  _hasHydrated: boolean
  setHasHydrated: (val: boolean) => void
  setDisplayName: (name: string) => void
  setTheme: (theme: 'dark' | 'light' | 'system') => void
  setAgentName: (name: string) => void
  completeOnboarding: () => void
  updatePreferences: (partial: Partial<LocalPreferences>) => void
}

export function isUserOnboarded(): boolean {
  if (typeof window === 'undefined') return false
  if (localStorage.getItem('nexora_onboarding_verified') === 'true') return true
  try {
    const raw = localStorage.getItem('nexora_app_storage')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.state?.preferences?.onboardingComplete === true) {
        return true
      }
    }
  } catch {
    // Ignore JSON parse errors
  }
  return false
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      preferences: DEFAULT_PREFERENCES,
      agentConfig: DEFAULT_AGENT_CONFIG,
      _hasHydrated: false,
      setHasHydrated: (val: boolean) => set({ _hasHydrated: val }),
      setDisplayName: (name) =>
        set((state) => ({ preferences: { ...state.preferences, displayName: name } })),
      setTheme: (theme) =>
        set((state) => ({ preferences: { ...state.preferences, theme } })),
      setAgentName: (name) =>
        set((state) => ({ agentConfig: { ...state.agentConfig, name } })),
      completeOnboarding: () => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('nexora_onboarding_verified', 'true')
        }
        set((state) => ({
          preferences: { ...state.preferences, onboardingComplete: true },
        }))
      },
      updatePreferences: (partial) => {
        if (partial.onboardingComplete === true && typeof window !== 'undefined') {
          localStorage.setItem('nexora_onboarding_verified', 'true')
        }
        set((state) => ({ preferences: { ...state.preferences, ...partial } }))
      },
    }),
    {
      name: 'nexora_app_storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
