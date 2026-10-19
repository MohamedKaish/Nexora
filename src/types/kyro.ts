export type KyroCharacterModel = 'kyro_prime' | 'pyro_fox' | 'aegis_bot' | 'custom_glb'

export type KyroCostume =
  | 'none'
  | 'royal_crown'
  | 'cyber_visor'
  | 'samurai_crest'
  | 'wizard_hat'
  | 'pro_headphones'

export type KyroColorTheme =
  | 'obsidian_gold'
  | 'cyber_neon'
  | 'crimson_mecha'
  | 'emerald_sage'
  | 'royal_amethyst'
  | 'arctic_pearl'

export type KyroAnimationState = 'IDLE' | 'TALKING' | 'WALKING' | 'CELEBRATING' | 'FOCUS_MODE'

export type KyroScreenAnchor = 'bottom-right' | 'bottom-left' | 'top-right' | 'custom'

export interface KyroPosition {
  x: number
  y: number
}

export interface KyroActionChip {
  id: string
  label: string
  action: 'ask_next_task' | 'start_focus' | 'switch_model' | 'upload_glb' | 'toggle_voice' | 'open_wardrobe' | 'custom'
  payload?: any
}

export interface KyroCompanionSettings {
  model: KyroCharacterModel
  costume: KyroCostume
  colorTheme: KyroColorTheme
  customGlbUrl: string | null
  voiceEnabled: boolean
  roamingEnabled: boolean
  anchor: KyroScreenAnchor
  isMinimized: boolean
  isPinned: boolean
  scale: number
  soundEnabled: boolean
}

export const DEFAULT_KYRO_SETTINGS: KyroCompanionSettings = {
  model: 'kyro_prime',
  costume: 'none',
  colorTheme: 'obsidian_gold',
  customGlbUrl: null,
  voiceEnabled: false,
  roamingEnabled: true,
  anchor: 'bottom-right',
  isMinimized: false,
  isPinned: true,
  scale: 1,
  soundEnabled: true,
}

export interface KyroPaletteColors {
  body: number
  accent: number
  glow: number
  visor: number
}

export const KYRO_COLOR_THEMES: Record<
  KyroColorTheme,
  { name: string; hexBody: string; hexAccent: string; hexGlow: string; colors: KyroPaletteColors }
> = {
  obsidian_gold: {
    name: 'Obsidian Gold',
    hexBody: '#1C1917',
    hexAccent: '#D4A853',
    hexGlow: '#38BDF8',
    colors: { body: 0x1c1917, accent: 0xd4a853, glow: 0x38bdf8, visor: 0x09090b },
  },
  cyber_neon: {
    name: 'Cyber Neon',
    hexBody: '#0F172A',
    hexAccent: '#06B6D4',
    hexGlow: '#EC4899',
    colors: { body: 0x0f172a, accent: 0x06b6d4, glow: 0xec4899, visor: 0x020617 },
  },
  crimson_mecha: {
    name: 'Crimson Mecha',
    hexBody: '#18181B',
    hexAccent: '#EF4444',
    hexGlow: '#F59E0B',
    colors: { body: 0x18181b, accent: 0xef4444, glow: 0xf59e0b, visor: 0x09090b },
  },
  emerald_sage: {
    name: 'Emerald Sage',
    hexBody: '#064E3B',
    hexAccent: '#10B981',
    hexGlow: '#A7F3D0',
    colors: { body: 0x064e3b, accent: 0x10b981, glow: 0xa7f3d0, visor: 0x022c22 },
  },
  royal_amethyst: {
    name: 'Royal Amethyst',
    hexBody: '#1E1B4B',
    hexAccent: '#8B5CF6',
    hexGlow: '#F472B6',
    colors: { body: 0x1e1b4b, accent: 0x8b5cf6, glow: 0xf472b6, visor: 0x0f0c29 },
  },
  arctic_pearl: {
    name: 'Arctic Pearl',
    hexBody: '#F8FAFC',
    hexAccent: '#D4A853',
    hexGlow: '#3B82F6',
    colors: { body: 0xf8fafc, accent: 0xd4a853, glow: 0x3b82f6, visor: 0x1e293b },
  },
}
