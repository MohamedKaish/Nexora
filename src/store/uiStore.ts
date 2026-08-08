import { create } from 'zustand'

interface UiState {
  isSidebarOpen: boolean
  isCommandPaletteOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (isOpen: boolean) => void
  setCommandPaletteOpen: (isOpen: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  isSidebarOpen: true,
  isCommandPaletteOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  setCommandPaletteOpen: (isOpen) => set({ isCommandPaletteOpen: isOpen }),
}))
