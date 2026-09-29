import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UiState {
  isSidebarOpen: boolean
  isCommandPaletteOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (isOpen: boolean) => void
  setCommandPaletteOpen: (isOpen: boolean) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      isSidebarOpen: true,
      isCommandPaletteOpen: false,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
      setCommandPaletteOpen: (isOpen) => set({ isCommandPaletteOpen: isOpen }),
    }),
    {
      name: 'nexora_ui_prefs',
      partialize: (state) => ({ isSidebarOpen: state.isSidebarOpen }),
    }
  )
)
