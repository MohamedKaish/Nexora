'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppMode, LocalPreferences, DEFAULT_PREFERENCES } from '@/types/local'
import { useAuth } from '@/providers/AuthProvider'

interface AppModeState {
  mode: AppMode
  preferences: LocalPreferences
  setMode: (mode: AppMode) => void
  setPreferences: (prefs: Partial<LocalPreferences>) => void
  setDisplayName: (name: string) => void
  setAgentName: (name: string) => void
  completeOnboarding: () => void
  resetPreferences: () => void
}

const defaultPrefs: LocalPreferences = {
  displayName: '',
  theme: 'dark',
  accentColor: '#6366F1',
  onboardingComplete: false,
  agentName: 'Nexora',
  sidebarCollapsed: false,
  language: 'en',
  pomodoroDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
}

export const useAppStore = create<AppModeState>()(
  persist(
    (set) => ({
      mode: 'guest',
      preferences: defaultPrefs,
      setMode: (mode) => set({ mode }),
      setPreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),
      setDisplayName: (name) =>
        set((state) => ({
          preferences: { ...state.preferences, displayName: name },
        })),
      setAgentName: (name) =>
        set((state) => ({
          preferences: { ...state.preferences, agentName: name },
        })),
      completeOnboarding: () =>
        set((state) => ({
          preferences: { ...state.preferences, onboardingComplete: true },
        })),
      resetPreferences: () => set({ preferences: defaultPrefs, mode: 'guest' }),
    }),
    {
      name: 'nexora_app_state',
      partialize: (state) => ({
        preferences: state.preferences,
      }),
    }
  )
)

/** Hook that derives app mode from both store and auth state */
export function useAppMode() {
  const { user, isLoading: authLoading } = useAuth()
  const storeMode = useAppStore((s) => s.mode)
  const setMode = useAppStore((s) => s.setMode)

  const effectiveMode: AppMode = user
    ? storeMode === 'syncing'
      ? 'syncing'
      : 'authenticated'
    : navigator.onLine
    ? 'guest'
    : 'offline'

  return {
    mode: effectiveMode,
    isGuest: !user,
    isAuthenticated: !!user,
    isLoading: authLoading,
    setMode,
    user,
  }
}
