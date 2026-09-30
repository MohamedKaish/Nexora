import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CompanionMood = 'idle' | 'happy' | 'thinking' | 'focused' | 'working' | 'celebrating'

export interface CompanionState {
  // Wardrobe & Cosmetics
  skin: string
  outfit: string
  accessory: string
  glasses: string
  
  // State
  mood: CompanionMood
  isExpanded: boolean
  
  // Actions
  setSkin: (skin: string) => void
  setOutfit: (outfit: string) => void
  setAccessory: (acc: string) => void
  setGlasses: (glasses: string) => void
  setMood: (mood: CompanionMood) => void
  setIsExpanded: (expanded: boolean) => void
}

export const useCompanionStore = create<CompanionState>()(
  persist(
    (set) => ({
      skin: 'base_maid',
      outfit: 'maid_uniform',
      accessory: 'none',
      glasses: 'none',
      mood: 'idle',
      isExpanded: false,
      
      setSkin: (skin) => set({ skin }),
      setOutfit: (outfit) => set({ outfit }),
      setAccessory: (accessory) => set({ accessory }),
      setGlasses: (glasses) => set({ glasses }),
      setMood: (mood) => set({ mood }),
      setIsExpanded: (isExpanded) => set({ isExpanded }),
    }),
    {
      name: 'nexora_3d_companion',
      partialize: (state) => ({ 
        skin: state.skin, 
        outfit: state.outfit, 
        accessory: state.accessory, 
        glasses: state.glasses 
      }),
    }
  )
)
