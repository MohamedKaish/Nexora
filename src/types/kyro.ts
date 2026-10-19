export type KyroCharacterModel = 'kyro_prime' | 'pyro_fox' | 'aegis_bot' | 'custom_glb'

export type KyroAnimationState = 'IDLE' | 'TALKING' | 'WALKING' | 'CELEBRATING' | 'FOCUS_MODE'

export type KyroScreenAnchor = 'bottom-right' | 'bottom-left' | 'top-right' | 'custom'

export interface KyroPosition {
  x: number // percentage or pixel
  y: number
}

export interface KyroActionChip {
  id: string
  label: string
  action: 'ask_next_task' | 'start_focus' | 'switch_model' | 'upload_glb' | 'toggle_voice' | 'custom'
  payload?: any
}

export interface KyroCompanionSettings {
  model: KyroCharacterModel
  customGlbUrl: string | null
  voiceEnabled: boolean
  roamingEnabled: boolean
  anchor: KyroScreenAnchor
  isMinimized: boolean
  scale: number
  soundEnabled: boolean
}

export const DEFAULT_KYRO_SETTINGS: KyroCompanionSettings = {
  model: 'kyro_prime',
  customGlbUrl: null,
  voiceEnabled: false,
  roamingEnabled: true,
  anchor: 'bottom-right',
  isMinimized: false,
  scale: 1,
  soundEnabled: true,
}
