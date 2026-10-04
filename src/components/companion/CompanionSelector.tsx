'use client'

import React from 'react'
import { useCharacterStore } from '@/store/characterStore'
import { CreatureArchetype, normalizeArchetype } from './CompanionState'
import { ORIGINAL_CREATURES } from './companion-data'
import { Check, Sparkles } from 'lucide-react'

interface CompanionSelectorProps {
  variant?: 'pills' | 'cards' | 'compact'
  className?: string
  onSelect?: (archetype: CreatureArchetype) => void
}

export function CompanionSelector({
  variant = 'pills',
  className = '',
  onSelect,
}: CompanionSelectorProps) {
  const rawArch = useCharacterStore((s) => s.config.archetype)
  const currentArchetype = normalizeArchetype(rawArch)
  const setArchetype = useCharacterStore((s) => s.setArchetype)

  const handleSelect = (arch: CreatureArchetype, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setArchetype(arch)
    onSelect?.(arch)
  }

  const creatures = Object.values(ORIGINAL_CREATURES)

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center p-1 rounded-xl bg-stone-900/90 border border-stone-800/80 gap-1 ${className}`}>
        {creatures.map((c) => {
          const isSelected = currentArchetype === c.id
          return (
            <button
              key={c.id}
              type="button"
              onClick={(e) => handleSelect(c.id, e)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-amber-400 text-stone-950 shadow-sm font-bold scale-105'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
              }`}
              title={`Switch to ${c.name} (${c.title})`}
            >
              <span>{c.emblem}</span>
              <span>{c.name}</span>
            </button>
          )
        })}
      </div>
    )
  }

  if (variant === 'cards') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3.5 ${className}`}>
        {creatures.map((c) => {
          const isSelected = currentArchetype === c.id
          return (
            <div
              key={c.id}
              onClick={(e) => handleSelect(c.id, e)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                isSelected
                  ? 'bg-amber-400/10 border-amber-400 shadow-[0_0_24px_rgba(212,168,83,0.3)] ring-1 ring-amber-400'
                  : 'bg-stone-900/60 border-stone-800/90 hover:border-stone-700 hover:bg-stone-900/90'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl drop-shadow">{c.emblem}</span>
                  {isSelected ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 text-[10px] font-bold flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[3]" /> Active
                    </span>
                  ) : (
                    <span className="text-[11px] text-stone-500 group-hover:text-amber-300 transition-colors font-medium">
                      Select
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-base text-foreground font-serif">{c.name}</h4>
                <p className="text-[11px] text-amber-300/80 font-medium mb-1.5">{c.title}</p>
                <p className="text-xs text-stone-400 leading-relaxed line-clamp-2">{c.lore}</p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-stone-800/80 flex items-center justify-between text-[11px]">
                <span className="text-stone-500 font-mono">{c.element.split('&')[0]}</span>
                <span
                  className="w-3 h-3 rounded-full shadow-sm"
                  style={{ backgroundColor: c.accentColor }}
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
        <Sparkles className="w-3 h-3 text-amber-400" /> Ally:
      </span>
      <div className="inline-flex items-center p-1 rounded-2xl bg-stone-900/90 border border-stone-800 gap-1.5 shadow-inner">
        {creatures.map((c) => {
          const isSelected = currentArchetype === c.id
          return (
            <button
              key={c.id}
              type="button"
              onClick={(e) => handleSelect(c.id, e)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-amber-400 text-stone-950 shadow-[0_0_15px_rgba(212,168,83,0.35)]'
                  : 'text-stone-300 hover:text-stone-100 hover:bg-stone-800/80'
              }`}
            >
              <span className="text-sm">{c.emblem}</span>
              <span>{c.name}</span>
              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-stone-950 ml-0.5" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
