'use client'

import React from 'react'
import { useKyroStore } from '@/store/kyroStore'
import { KyroCharacterModel } from '@/types/kyro'
import { playChime } from '@/utils/soundEngine'
import { Check, Sparkles, Bot, Shield, Flame } from 'lucide-react'
import { toast } from 'sonner'

interface CompanionSelectorProps {
  variant?: 'pills' | 'cards' | 'compact'
  className?: string
  onSelect?: (model: KyroCharacterModel) => void
}

const MODELS: {
  id: KyroCharacterModel
  name: string
  title: string
  emblem: string
  lore: string
  color: string
}[] = [
  {
    id: 'kyro_prime',
    name: 'Kyro Prime',
    title: 'Cyber Spirit Companion',
    emblem: '✨',
    lore: 'Dynamic floating AI companion with energy cores and floating sensory ears.',
    color: '#D4A853',
  },
  {
    id: 'pyro_fox',
    name: 'Pyro Fox',
    title: 'Elemental Creature',
    emblem: '🦊',
    lore: 'Fiery agile creature with dynamic multi-segment tail and alert pointed ears.',
    color: '#F97316',
  },
  {
    id: 'aegis_bot',
    name: 'Aegis Bot',
    title: 'Tactical Armored Sentinel',
    emblem: '🛡️',
    lore: 'Heavy angular defense bot with glowing visor shield and shoulder plating.',
    color: '#38BDF8',
  },
]

export function CompanionSelector({
  variant = 'pills',
  className = '',
  onSelect,
}: CompanionSelectorProps) {
  const currentModel = useKyroStore((s) => s.settings.model)
  const setModel = useKyroStore((s) => s.setModel)
  const speak = useKyroStore((s) => s.speak)
  const setAnimationState = useKyroStore((s) => s.setAnimationState)

  const handleSelect = (model: KyroCharacterModel, e?: React.MouseEvent) => {
    e?.stopPropagation()
    playChime('click')
    setModel(model)
    setAnimationState('CELEBRATING', 2500)

    const chosen = MODELS.find((m) => m.id === model)
    speak(`Vessel reconfigured to ${chosen?.name || 'Kyro'}. Standing by!`, 3500)
    toast.success(`3D Companion morphed to ${chosen?.name}`)
    onSelect?.(model)
  }

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center p-1 rounded-xl bg-stone-900/90 border border-stone-800/80 gap-1 ${className}`}>
        {MODELS.map((m) => {
          const isSelected = currentModel === m.id
          return (
            <button
              key={m.id}
              type="button"
              onClick={(e) => handleSelect(m.id, e)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-amber-400 text-stone-950 shadow-sm font-bold scale-105'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
              }`}
              title={`Morph 3D Companion to ${m.name} (${m.title})`}
            >
              <span>{m.emblem}</span>
              <span>{m.name}</span>
            </button>
          )
        })}
      </div>
    )
  }

  if (variant === 'cards') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3.5 ${className}`}>
        {MODELS.map((m) => {
          const isSelected = currentModel === m.id
          return (
            <div
              key={m.id}
              onClick={(e) => handleSelect(m.id, e)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                isSelected
                  ? 'bg-amber-400/10 border-amber-400 shadow-[0_0_24px_rgba(212,168,83,0.3)] ring-1 ring-amber-400'
                  : 'bg-stone-900/60 border-stone-800/90 hover:border-stone-700 hover:bg-stone-900/90'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl drop-shadow">{m.emblem}</span>
                  {isSelected ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 text-[10px] font-bold flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[3]" /> Active 3D
                    </span>
                  ) : (
                    <span className="text-[11px] text-stone-500 group-hover:text-amber-300 transition-colors font-medium">
                      Select
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-base text-foreground font-serif">{m.name}</h4>
                <p className="text-[11px] text-amber-300/80 font-medium mb-1.5">{m.title}</p>
                <p className="text-xs text-stone-400 leading-relaxed line-clamp-2">{m.lore}</p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-stone-800/80 flex items-center justify-between text-[11px]">
                <span className="text-stone-500 font-mono">60 FPS WebGL</span>
                <span
                  className="w-3 h-3 rounded-full shadow-sm"
                  style={{ backgroundColor: m.color }}
                />
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Default: 'pills'
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-xs font-semibold text-stone-400 flex items-center gap-1">
        <Sparkles className="w-3 h-3 text-amber-400" /> 3D Model:
      </span>
      <div className="inline-flex items-center p-1 rounded-2xl bg-stone-900/90 border border-stone-800 gap-1.5 shadow-inner">
        {MODELS.map((m) => {
          const isSelected = currentModel === m.id
          return (
            <button
              key={m.id}
              type="button"
              onClick={(e) => handleSelect(m.id, e)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-amber-400 text-stone-950 shadow-[0_0_15px_rgba(212,168,83,0.35)]'
                  : 'text-stone-300 hover:text-stone-100 hover:bg-stone-800/80'
              }`}
            >
              <span className="text-sm">{m.emblem}</span>
              <span>{m.name}</span>
              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-stone-950 ml-0.5" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
