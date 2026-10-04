'use client'

import React from 'react'
import { Companion } from '@/components/companion/Companion'
import { CharacterConfig, CompanionMood } from '@/types/local'
import { CreatureArchetype } from '@/components/companion/CompanionState'

interface CompanionAvatarProps {
  config: CharacterConfig
  size?: number
  moodOverride?: CompanionMood
  showPlatform?: boolean
  showGlow?: boolean
  speechBubbleText?: string
  className?: string
  onClick?: () => void
}

/**
 * Re-export wrapper connecting legacy CompanionAvatar callers to the 2D Companion system.
 */
export function CompanionAvatar({
  config,
  size = 140,
  moodOverride,
  showPlatform = true,
  showGlow = true,
  speechBubbleText,
  className = '',
  onClick,
}: CompanionAvatarProps) {
  // Normalize archetype to original creature set
  const rawArch = (config?.archetype || 'nyxen').toLowerCase()
  const archetype: CreatureArchetype =
    rawArch === 'aerix' || rawArch === 'frostwing'
      ? 'aerix'
      : rawArch === 'vayron' || rawArch === 'aegis'
      ? 'vayron'
      : 'nyxen'

  return (
    <Companion
      size={size}
      archetypeOverride={archetype}
      moodOverride={moodOverride || config?.mood}
      speechTextOverride={speechBubbleText}
      showPlatform={showPlatform}
      showGlow={showGlow}
      className={className}
      onClick={onClick}
    />
  )
}
