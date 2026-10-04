import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CharacterConfig, DEFAULT_CHARACTER_CONFIG, CompanionArchetype, CompanionMood } from '@/types/local'
import { companionController } from '@/components/companion/CompanionController'

interface CharacterState {
  config: CharacterConfig
  setArchetype: (archetype: CompanionArchetype) => void
  setMood: (mood: CompanionMood) => void
  setExpression: (expression: string) => void
  setHair: (hair: string, color?: string) => void
  setOutfit: (outfit: string, color?: string) => void
  setAccessory: (accessory: string) => void
  setGlasses: (glasses: string) => void
  setReducedMotion: (reduced: boolean) => void
  celebrate: () => void
  randomize: () => void
  resetConfig: () => void
}

export const ARCHETYPES_META = [
  {
    id: 'nyxen' as CompanionArchetype,
    name: 'Nyxen',
    title: 'The Shadow-Sprint Scout',
    lore: 'An agile, nocturnal wanderer of the digital ether. Darts between high-priority quests with razor reflexes, trailing a scarf of resonant cyan energy.',
    primaryColor: '#1E1B4B',
    accentColor: '#38BDF8',
  },
  {
    id: 'aerix' as CompanionArchetype,
    name: 'Aerix',
    title: 'Crystalline Sky Guardian',
    lore: 'A high-altitude sovereign shaped from frosted skylight. Aerix hovers in serene crystalline composure, bringing deep stillness to heavy workloads.',
    primaryColor: '#0F172A',
    accentColor: '#2DD4BF',
  },
  {
    id: 'vayron' as CompanionArchetype,
    name: 'Vayron',
    title: 'The Bastion Sentinel',
    lore: 'A noble guardian harboring a miniature solar core. Vayron anchors habit momentum with immovable discipline and radiates protective warmth.',
    primaryColor: '#1C1917',
    accentColor: '#D4A853',
  },
]

export const useCharacterStore = create<CharacterState>()(
  persist(
    (set, get) => ({
      config: DEFAULT_CHARACTER_CONFIG,

      setArchetype: (archetype) => {
        const creatures: Record<string, string> = {
          nyxen: 'Ready for velocity. Point the path, Explorer.',
          aerix: 'The skies of Nexora are clear. Let us preserve quiet focus.',
          vayron: 'Standing guard over your commitments. Together we build.',
        }
        companionController.emitMood('happy', 2400, 'idle')
        companionController.emitSpeech(creatures[archetype] || 'Sanctuary ally online.', 3500)
        set((state) => ({ config: { ...state.config, archetype, updatedAt: new Date().toISOString() } }))
      },

      setMood: (mood) =>
        set((state) => ({ config: { ...state.config, mood, updatedAt: new Date().toISOString() } })),

      setExpression: (expression) =>
        set((state) => ({ config: { ...state.config, expression, updatedAt: new Date().toISOString() } })),

      setHair: (hair, color) =>
        set((state) => ({
          config: {
            ...state.config,
            hair,
            hairColor: color ?? state.config.hairColor,
            updatedAt: new Date().toISOString(),
          },
        })),

      setOutfit: (outfit, color) =>
        set((state) => ({
          config: {
            ...state.config,
            outfit,
            outfitColor: color ?? state.config.outfitColor,
            updatedAt: new Date().toISOString(),
          },
        })),

      setAccessory: (accessory) =>
        set((state) => ({ config: { ...state.config, accessory, updatedAt: new Date().toISOString() } })),

      setGlasses: (glasses) =>
        set((state) => ({ config: { ...state.config, glasses, updatedAt: new Date().toISOString() } })),

      setReducedMotion: (reduced) =>
        set((state) => ({ config: { ...state.config, isReducedMotion: reduced } })),

      celebrate: () => {
        const previousMood = get().config.mood
        set((state) => ({ config: { ...state.config, mood: 'celebrating' } }))
        setTimeout(() => {
          set((state) => ({ config: { ...state.config, mood: previousMood === 'celebrating' ? 'happy' : previousMood } }))
        }, 2800)
      },

      randomize: () => {
        const archetypes: CompanionArchetype[] = ['nyxen', 'aerix', 'vayron']
        const randomArchetype = archetypes[Math.floor(Math.random() * archetypes.length)]
        const colors = ['#38BDF8', '#67E8F9', '#2DD4BF', '#A78BFA', '#D4A853', '#FBBF24']
        const hairs = ['sleek_crest', 'aero_sweep', 'crystal_horns', 'bastion_visor']
        const outfits = ['shadow_sprint', 'glacial_robes', 'aegis_armor']
        const expressions = ['attentive', 'focused', 'joyful_arch', 'thinking_up']

        set((state) => ({
          config: {
            ...state.config,
            archetype: randomArchetype,
            hair: hairs[Math.floor(Math.random() * hairs.length)],
            hairColor: colors[Math.floor(Math.random() * colors.length)],
            outfit: outfits[Math.floor(Math.random() * outfits.length)],
            outfitColor: colors[Math.floor(Math.random() * colors.length)],
            expression: expressions[Math.floor(Math.random() * expressions.length)],
            updatedAt: new Date().toISOString(),
          },
        }))
      },

      resetConfig: () => set({ config: DEFAULT_CHARACTER_CONFIG }),
    }),
    { name: 'nexora_character_storage' }
  )
)
