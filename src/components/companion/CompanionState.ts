/**
 * Core Companion State Machine & Typings for Nexora
 * Supports clean abstraction for 2D SVG/Canvas and future pluggable 3D renderers.
 */

export type CompanionMood =
  | 'idle'
  | 'greeting'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'happy'
  | 'celebrating'
  | 'encouraging'
  | 'surprised'
  | 'focused'
  | 'tired'
  | 'sleeping'

export type CreatureArchetype = 'nyxen' | 'aerix' | 'vayron'

export function normalizeArchetype(arch?: string | null): CreatureArchetype {
  if (!arch) return 'nyxen'
  const lower = arch.toLowerCase().trim()
  if (lower === 'aerix' || lower === 'frostwing' || lower === 'sky' || lower === 'ice') return 'aerix'
  if (lower === 'vayron' || lower === 'aegis' || lower === 'bastion' || lower === 'guardian') return 'vayron'
  return 'nyxen'
}

export type EyeExpression =
  | 'normal'
  | 'blink'
  | 'focused'
  | 'thinking_up'
  | 'joyful_arch'
  | 'wide_surprised'
  | 'sleepy_line'
  | 'attentive'

export type MouthExpression =
  | 'idle_curve'
  | 'speaking_open'
  | 'speaking_pulse'
  | 'smile_open'
  | 'thinking_smirk'
  | 'flat_focused'
  | 'surprised_o'
  | 'sleepy_slack'

export interface CreatureVisualConfig {
  archetype: CreatureArchetype
  mood: CompanionMood
  name: string
  primaryColor?: string
  accentColor?: string
  energyColor?: string
  scale?: number
  isReducedMotion?: boolean
}

export type RendererKind = '2d' | '3d'

export interface CompanionRendererProps {
  config: CreatureVisualConfig
  size: number
  moodOverride?: CompanionMood
  showPlatform?: boolean
  showGlow?: boolean
  speechBubbleText?: string
  className?: string
  interactive?: boolean
  onClick?: () => void
}
