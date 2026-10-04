'use client'

import React, { useEffect, useState } from 'react'
import { CompanionRenderer } from './CompanionRenderer'
import { CompanionMood, CreatureArchetype, normalizeArchetype } from './CompanionState'
import { companionController } from './CompanionController'
import { useCharacterStore } from '@/store/characterStore'

export interface CompanionProps {
  size?: number
  archetypeOverride?: CreatureArchetype
  moodOverride?: CompanionMood
  speechTextOverride?: string
  showPlatform?: boolean
  showGlow?: boolean
  interactive?: boolean
  className?: string
  onClick?: () => void
}

export function Companion({
  size = 150,
  archetypeOverride,
  moodOverride,
  speechTextOverride,
  showPlatform = true,
  showGlow = true,
  interactive = true,
  className = '',
  onClick,
}: CompanionProps) {
  const storeConfig = useCharacterStore((s) => s.config)

  // Controller-driven event states
  const [controllerMood, setControllerMood] = useState<CompanionMood | null>(null)
  const [controllerSpeech, setControllerSpeech] = useState<string | null>(null)

  useEffect(() => {
    const unsubMood = companionController.subscribe((mood) => {
      setControllerMood(mood)
    })
    const unsubSpeech = companionController.subscribeSpeech((text) => {
      setControllerSpeech(text)
    })

    return () => {
      unsubMood()
      unsubSpeech()
    }
  }, [])

  // Resolve active visual config
  const activeArchetype = normalizeArchetype(archetypeOverride || storeConfig.archetype)
  const activeMood = moodOverride || controllerMood || (storeConfig.mood as CompanionMood) || 'idle'
  const activeSpeech = controllerSpeech ?? speechTextOverride ?? undefined

  return (
    <CompanionRenderer
      config={{
        archetype: activeArchetype,
        mood: activeMood,
        name: storeConfig.name || 'Kyro',
        primaryColor: storeConfig.hairColor,
        accentColor: storeConfig.outfitColor,
        isReducedMotion: storeConfig.isReducedMotion,
      }}
      size={size}
      moodOverride={activeMood}
      showPlatform={showPlatform}
      showGlow={showGlow}
      speechBubbleText={activeSpeech}
      className={className}
      interactive={interactive}
      onClick={onClick}
    />
  )
}
