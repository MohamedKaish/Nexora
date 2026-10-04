'use client'

import React, { useState } from 'react'
import { useCharacterStore, ARCHETYPES_META } from '@/store/characterStore'
import { useAppStore } from '@/store/appStore'
import { Companion } from '@/components/companion/Companion'
import { CompanionMood, CreatureArchetype, normalizeArchetype } from '@/components/companion/CompanionState'
import { ORIGINAL_CREATURES } from '@/components/companion/companion-data'
import {
  Sparkles,
  Shuffle,
  RotateCcw,
  Heart,
  Smile,
  Zap,
  Award,
  Crown,
  Check,
  Ear,
  Eye,
  MessageCircle,
  HelpCircle,
  Moon,
  BatteryCharging,
} from 'lucide-react'

const MOOD_TESTS: Array<{ id: CompanionMood; label: string; icon: React.ElementType; quote: string }> = [
  { id: 'idle', label: 'Idle (Breath & Blink)', icon: Heart, quote: 'Breathing peacefully in the sanctuary.' },
  { id: 'listening', label: 'Listening (Attentive)', icon: Ear, quote: 'I am hearing your thoughts, Explorer.' },
  { id: 'thinking', label: 'Thinking (Neural Runes)', icon: HelpCircle, quote: 'Analyzing tasks, habits, and optimal horizons...' },
  { id: 'speaking', label: 'Speaking (Mouth Waves)', icon: MessageCircle, quote: 'Velocity achieved! The sanctuary is energized.' },
  { id: 'happy', label: 'Happy (Joyful Glow)', icon: Smile, quote: 'A brilliant spark of progress!' },
  { id: 'celebrating', label: 'Celebrating (Victory Jump)', icon: Award, quote: 'Quest conquered! Glorious momentum!' },
  { id: 'encouraging', label: 'Encouraging (Support)', icon: Sparkles, quote: 'One small move is all it takes. You have this.' },
  { id: 'surprised', label: 'Surprised (Wide Alert)', icon: Eye, quote: 'Whoa! An unexpected shift in the ether.' },
  { id: 'focused', label: 'Focused (Sensory Barrier)', icon: Zap, quote: 'Sensory barriers active. Absolute concentration.' },
  { id: 'tired', label: 'Tired (Low Energy)', icon: BatteryCharging, quote: 'Exertion acknowledged. Even guardians rest.' },
  { id: 'sleeping', label: 'Sleeping (Deep Rest)', icon: Moon, quote: 'zzZ... sanctuary resting.' },
]

export default function CharacterAtelierPage() {
  const {
    config,
    setArchetype,
    setMood,
    setReducedMotion,
    randomize,
    resetConfig,
  } = useCharacterStore()

  const agentName = useAppStore((s) => s.agentConfig.name) || 'Kyro'
  const setAgentName = useAppStore((s) => s.setAgentName)

  const [activeTab, setActiveTab] = useState<'creature' | 'states' | 'lore'>('creature')
  const [testedMood, setTestedMood] = useState<CompanionMood>(config.mood || 'idle')
  const [bubblePreview, setBubblePreview] = useState<string>(
    `I stand with you, Explorer. Let us shape our sanctuary.`
  )

  const currentArchetype = normalizeArchetype(config.archetype)
  const activeCreature = ORIGINAL_CREATURES[currentArchetype] || ORIGINAL_CREATURES.nyxen

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-gradient-gold">
            Companion Atelier
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Bond with your living 2D creature and inspect real-time expressive states.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={randomize}
            className="px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 hover:border-amber-400/40 text-stone-300 hover:text-stone-100 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Shuffle className="w-3.5 h-3.5 text-amber-400" />
            <span>Randomize</span>
          </button>
          <button
            onClick={resetConfig}
            className="px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 hover:border-rose-400/40 text-stone-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Living Avatar Stage (Left 5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="world-deck p-8 flex flex-col items-center justify-center relative overflow-hidden text-center min-h-[440px]">
            {/* Ambient Background Aura */}
            <div
              className="absolute inset-0 pointer-events-none transition-all duration-700 opacity-30"
              style={{
                background: `radial-gradient(circle at 50% 45%, ${activeCreature.accentColor}55, transparent 70%)`,
              }}
            />

            {/* Stage Pedestal with 2D Companion */}
            <div className="my-6 relative z-10">
              <Companion
                size={170}
                archetypeOverride={currentArchetype}
                moodOverride={testedMood}
                speechTextOverride={bubblePreview}
                showPlatform={true}
                showGlow={true}
              />
            </div>

            {/* Creature Identity Badge */}
            <div className="relative z-10 space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/25">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-bold text-amber-300">{activeCreature.title}</span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-foreground mt-1">
                {activeCreature.name} ({agentName})
              </h2>
              <p className="text-xs text-stone-400 max-w-xs">{activeCreature.lore}</p>
            </div>
          </div>
        </div>

        {/* Customization & State Tester Controls (Right 7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Navigation Tabs */}
          <div className="flex gap-2 p-1.5 rounded-2xl bg-stone-900/80 border border-stone-800">
            <button
              onClick={() => setActiveTab('creature')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'creature'
                  ? 'bg-amber-400 text-stone-950 shadow'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Original Creatures
            </button>
            <button
              onClick={() => setActiveTab('states')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'states'
                  ? 'bg-amber-400 text-stone-950 shadow'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Expressive State Machine
            </button>
            <button
              onClick={() => setActiveTab('lore')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'lore'
                  ? 'bg-amber-400 text-stone-950 shadow'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Sanctuary Bond
            </button>
          </div>

          {/* TAB 1: ORIGINAL CREATURES (Nyxen, Aerix, Vayron) */}
          {activeTab === 'creature' && (
            <div className="space-y-4">
              <div className="world-surface p-5 space-y-3">
                <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider">
                  Companion Callsign
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="Enter companion callsign..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-sm text-foreground focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(Object.keys(ORIGINAL_CREATURES) as CreatureArchetype[]).map((archKey) => {
                  const creature = ORIGINAL_CREATURES[archKey]
                  const isSelected = currentArchetype === archKey
                  return (
                    <div
                      key={creature.id}
                      onClick={() => {
                        setArchetype(creature.id)
                        setBubblePreview(creature.speechGreeting)
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-400/10 border-amber-400 shadow-[0_0_20px_rgba(212,168,83,0.25)]'
                          : 'bg-stone-900/60 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xl">{creature.emblem}</span>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-base text-foreground">{creature.name}</h4>
                        <p className="text-[11px] text-amber-300/80 font-semibold mb-2">{creature.title}</p>
                        <p className="text-xs text-stone-400 leading-relaxed line-clamp-3">{creature.lore}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: creature.accentColor }}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: creature.energyColor }}
                        />
                        <span className="text-[10px] text-stone-500 font-medium">Elemental Core</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* TAB 2: EXPRESSIVE STATE MACHINE TESTER */}
          {activeTab === 'states' && (
            <div className="world-surface p-6 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-foreground">Interactive State Verification</h4>
                <p className="text-xs text-stone-400">
                  Trigger each expressive state to verify real eye, mouth, body, and particle animations.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                {MOOD_TESTS.map((m) => {
                  const Icon = m.icon
                  const isCurrent = testedMood === m.id
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        setTestedMood(m.id)
                        setMood(m.id)
                        setBubblePreview(m.quote)
                      }}
                      className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-amber-400 text-stone-950 font-bold shadow-md'
                          : 'bg-stone-900 border-stone-800 text-stone-300 hover:border-stone-700'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{m.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Reduced Motion Toggle */}
              <div className="pt-4 border-t border-stone-800/80 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-foreground">Reduced Motion Mode</h5>
                  <p className="text-[11px] text-stone-400">
                    Suppresses continuous breathing & floating for high-performance low-spec laptops.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.isReducedMotion || false}
                  onChange={(e) => setReducedMotion(e.target.checked)}
                  className="w-4 h-4 accent-amber-400 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 3: SANCTUARY BOND */}
          {activeTab === 'lore' && (
            <div className="world-surface p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Resonance Level 5</h3>
                  <p className="text-xs text-stone-400">
                    Bonded to {activeCreature.name} through deep work sessions and daily habit integrity.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-amber-300">Sanctuary Sync Rate</span>
                  <span className="text-stone-400">920 / 1000 XP</span>
                </div>
                <div className="h-2.5 rounded-full bg-stone-900 border border-stone-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
                    style={{ width: '92%' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-xl bg-stone-900/60 border border-stone-800">
                  <h5 className="text-xs font-bold text-amber-300">Velocity Link</h5>
                  <p className="text-[11px] text-stone-400 mt-1">
                    {activeCreature.name} responds with immediate victory celebratory bursts upon quest completions.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-stone-900/60 border border-stone-800">
                  <h5 className="text-xs font-bold text-amber-300">Neural Sync</h5>
                  <p className="text-[11px] text-stone-400 mt-1">
                    Provides Kyro with real-time sensory telemetry across your tasks and timetable.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
