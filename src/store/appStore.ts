import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { LocalPreferences, DEFAULT_PREFERENCES, AgentConfig, DEFAULT_AGENT_CONFIG } from '@/types/local'

interface AppState {
  preferences: LocalPreferences
  agentConfig: AgentConfig
  setDisplayName: (name: string) => void
  setTheme: (theme: 'dark' | 'light' | 'system') => void
  setAgentName: (name: string) => void
  completeOnboarding: () => void
  updatePreferences: (partial: Partial<LocalPreferences>) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      preferences: DEFAULT_PREFERENCES,
      agentConfig: DEFAULT_AGENT_CONFIG,
      setDisplayName: (name) =>
        set((state) => ({ preferences: { ...state.preferences, displayName: name } })),
      setTheme: (theme) =>
        set((state) => ({ preferences: { ...state.preferences, theme } })),
      setAgentName: (name) =>
        set((state) => ({ agentConfig: { ...state.agentConfig, name } })),
      completeOnboarding: () =>
        set((state) => ({ preferences: { ...state.preferences, onboardingComplete: true } })),
      updatePreferences: (partial) =>
        set((state) => ({ preferences: { ...state.preferences, ...partial } })),
    }),
    { name: 'nexora_app_storage' }
  )
)
