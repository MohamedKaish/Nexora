import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CharacterConfig } from '@/types/local'
import { DEFAULT_CHARACTER_CONFIG } from '@/types/local'

interface CharacterState {
  config: CharacterConfig
  setConfig: (updates: Partial<CharacterConfig>) => void
  setBody: (body: string) => void
  setHair: (hair: string, color?: string) => void
  setOutfit: (outfit: string, color?: string) => void
  setAccessory: (accessory: string) => void
  setGlasses: (glasses: string) => void
  setExpression: (expression: string) => void
  setCompanionEnabled: (enabled: boolean) => void
  setReducedMotion: (reduced: boolean) => void
  resetConfig: () => void
}

export const useCharacterStore = create<CharacterState>()(
  persist(
    (set) => ({
      config: DEFAULT_CHARACTER_CONFIG,
      setConfig: (updates) =>
        set((state) => ({
          config: { ...state.config, ...updates, updatedAt: new Date().toISOString() },
        })),
      setBody: (body) =>
        set((state) => ({
          config: { ...state.config, body, updatedAt: new Date().toISOString() },
        })),
      setHair: (hair, color) =>
        set((state) => ({
          config: {
            ...state.config,
            hair,
            ...(color ? { hairColor: color } : {}),
            updatedAt: new Date().toISOString(),
          },
        })),
      setOutfit: (outfit, color) =>
        set((state) => ({
          config: {
            ...state.config,
            outfit,
            ...(color ? { outfitColor: color } : {}),
            updatedAt: new Date().toISOString(),
          },
        })),
      setAccessory: (accessory) =>
        set((state) => ({
          config: { ...state.config, accessory, updatedAt: new Date().toISOString() },
        })),
      setGlasses: (glasses) =>
        set((state) => ({
          config: { ...state.config, glasses, updatedAt: new Date().toISOString() },
        })),
      setExpression: (expression) =>
        set((state) => ({
          config: { ...state.config, expression, updatedAt: new Date().toISOString() },
        })),
      setCompanionEnabled: (enabled) =>
        set((state) => ({
          config: { ...state.config, isCompanionEnabled: enabled, updatedAt: new Date().toISOString() },
        })),
      setReducedMotion: (reduced) =>
        set((state) => ({
          config: { ...state.config, isReducedMotion: reduced, updatedAt: new Date().toISOString() },
        })),
      resetConfig: () => set({ config: DEFAULT_CHARACTER_CONFIG }),
    }),
    {
      name: 'nexora_character_config',
      partialize: (state) => ({ config: state.config }),
    }
  )
)

// ─── Character Asset Catalog ───

export const CHARACTER_BODIES = [
  { id: 'boy', label: 'Boy Character' },
  { id: 'girl', label: 'Girl Character' },
]

export const CHARACTER_HAIR = [
  { id: 'short_01', label: 'Short Clean' },
  { id: 'short_02', label: 'Undercut' },
  { id: 'medium_01', label: 'Medium Wave' },
  { id: 'long_01', label: 'Long Straight' },
  { id: 'curly_01', label: 'Curly' },
  { id: 'bun_01', label: 'Top Bun' },
]

export const CHARACTER_OUTFITS = [
  { id: 'casual_01', label: 'Casual Tee' },
  { id: 'formal_01', label: 'Business Suit' },
  { id: 'hoodie_01', label: 'Hoodie' },
  { id: 'jacket_01', label: 'Jacket' },
  { id: 'athletic_01', label: 'Athletic' },
  { id: 'tuxedo', label: 'Tuxedo' },
  { id: 'superhero', label: 'Superhero' },
  { id: 'astronaut', label: 'Astronaut' },
]

export const CHARACTER_ACCESSORIES = [
  { id: 'none', label: 'None' },
  { id: 'headphones_01', label: 'Headphones' },
  { id: 'watch_01', label: 'Watch' },
  { id: 'bag_01', label: 'Backpack' },
  { id: 'hat_01', label: 'Cap' },
]

export const CHARACTER_GLASSES = [
  { id: 'none', label: 'None' },
  { id: 'round_01', label: 'Round' },
  { id: 'square_01', label: 'Square' },
  { id: 'aviator_01', label: 'Aviator' },
]

export const CHARACTER_EXPRESSIONS = [
  { id: 'neutral', label: 'Neutral' },
  { id: 'happy', label: 'Happy' },
  { id: 'focused', label: 'Focused' },
  { id: 'celebrating', label: 'Celebrating' },
  { id: 'thinking', label: 'Thinking' },
]

export const HAIR_COLORS = ['#1C1917', '#44403C', '#92400E', '#7C2D12', '#1E3A5F', '#6B21A8', '#DC2626', '#D97706', '#FAFAF9']
export const OUTFIT_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#1C1917', '#FAFAF9']
