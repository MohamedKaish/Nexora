'use client'

import React, { useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { useCharacterStore } from '@/store/characterStore'
import { Companion } from './Companion'
import { CompanionSelector } from './CompanionSelector'
import { ORIGINAL_CREATURES } from './companion-data'
import { normalizeArchetype } from './CompanionState'
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  Trophy,
  Zap,
  Flame,
  Bot,
  Heart,
} from 'lucide-react'

interface SanctuaryTutorialModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SanctuaryTutorialModal({ isOpen, onClose }: SanctuaryTutorialModalProps) {
  const userName = useAppStore((s) => s.preferences.displayName) || 'Explorer'
  const agentName = useAppStore((s) => s.agentConfig.name) || 'Kyro'
  const rawArch = useCharacterStore((s) => s.config.archetype)
  const currentArchetype = normalizeArchetype(rawArch)
  const creatureMeta = ORIGINAL_CREATURES[currentArchetype] || ORIGINAL_CREATURES.nyxen

  const [step, setStep] = useState(0)
  const [showSelector, setShowSelector] = useState(false)

  if (!isOpen) return null

  const TUTORIAL_STEPS = [
    {
      title: `Welcome to your Sanctuary, ${userName}!`,
      subtitle: `Bonded with ${creatureMeta.name} · ${creatureMeta.title}`,
      mood: 'greeting' as const,
      speech: `Greetings, ${userName}! I am ${creatureMeta.name}. I'm here not just as an assistant, but as your steadfast friend and ally in this digital realm.`,
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-stone-300 leading-relaxed">
          <p>
            Nexora is your living productivity habitat. Unlike rigid dashboards, this space is designed to feel alive, rewarding, and peaceful.
          </p>
          <p>
            Whenever you work, log habits, or focus, you and I earn <strong className="text-amber-300">XP</strong> together and level up our shared sanctuary bond!
          </p>
        </div>
      ),
      icon: <Heart className="w-5 h-5 text-rose-400" />,
    },
    {
      title: 'The Task Matrix & Quest XP',
      subtitle: '+50 XP for every task completed',
      mood: 'celebrating' as const,
      speech: `Every quest you clear earns us +50 XP! Mark urgent fires so I know where to direct your focus first.`,
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-stone-300 leading-relaxed">
          <p>
            Organize daily objectives into prioritized task matrices. You can break down complex milestones into actionable steps.
          </p>
          <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 flex items-center gap-3">
            <span className="text-2xl">⚔️</span>
            <div>
              <span className="font-bold text-foreground text-xs block">Task Mastery</span>
              <span className="text-[11px] text-stone-400">
                Completed quests feed directly into your Explorer Rank and milestone goals.
              </span>
            </div>
          </div>
        </div>
      ),
      icon: <CheckCircle2 className="w-5 h-5 text-blue-400" />,
    },
    {
      title: 'Habit Momentum & Streaks',
      subtitle: '+25 XP per check-in + Streak Multipliers',
      mood: 'happy' as const,
      speech: `Small daily rituals forge massive destiny. I will help you keep the daily chain unbroken!`,
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-stone-300 leading-relaxed">
          <p>
            Consistency is power. Check in your daily habits (hydration, reading, fitness, meditation) and build consecutive streak multipliers.
          </p>
          <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 flex items-center gap-3">
            <span className="text-2xl">🔥</span>
            <div>
              <span className="font-bold text-foreground text-xs block">Unbroken Chains</span>
              <span className="text-[11px] text-stone-400">
                Longer habit streaks unlock prestigious badges in your Explorer Profile.
              </span>
            </div>
          </div>
        </div>
      ),
      icon: <Flame className="w-5 h-5 text-orange-400" />,
    },
    {
      title: 'The Deep Focus Chamber',
      subtitle: '+2 XP per minute of deep flow',
      mood: 'focused' as const,
      speech: `When you need deep flow, step into the Focus Chamber. I will guard your time and silence distractions.`,
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-stone-300 leading-relaxed">
          <p>
            Engage customizable 25-minute Pomodoro sessions or deep work timers. Track your focus telemetry and view daily flow minutes.
          </p>
          <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 flex items-center gap-3">
            <span className="text-2xl">🧘</span>
            <div>
              <span className="font-bold text-foreground text-xs block">Sensory Silence</span>
              <span className="text-[11px] text-stone-400">
                The companion shifts into deep focus mode with you while the timer counts down.
              </span>
            </div>
          </div>
        </div>
      ),
      icon: <Zap className="w-5 h-5 text-amber-400" />,
    },
    {
      title: 'Neural Link: Talk to Me Anytime',
      subtitle: `Your living AI guide with real workspace awareness`,
      mood: 'encouraging' as const,
      speech: `Tap my avatar or message me anytime! Ask me to plan your day, pick top priorities, or just chat.`,
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-stone-300 leading-relaxed">
          <p>
            I have full telemetry on your active tasks, habits, and schedule. You can ask me:
          </p>
          <ul className="space-y-1.5 text-xs text-amber-300/90 font-mono pl-2 border-l-2 border-amber-400/40">
            <li>• &ldquo;What should I work on next?&rdquo;</li>
            <li>• &ldquo;Plan my day for today&rdquo;</li>
            <li>• &ldquo;Add task finish client review&rdquo;</li>
            <li>• &ldquo;Switch to Aerix / Vayron / Nyxen&rdquo;</li>
          </ul>
        </div>
      ),
      icon: <Bot className="w-5 h-5 text-emerald-400" />,
    },
  ]

  const currentStepData = TUTORIAL_STEPS[step]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl world-deck p-6 sm:p-8 relative overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.8)] border-amber-400/40">
        <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full blur-[100px] bg-amber-500/10 pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 transition-colors cursor-pointer"
          aria-label="Close tutorial"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
          {/* Companion Stage (Left 5 cols) */}
          <div className="sm:col-span-5 flex flex-col items-center text-center">
            <Companion
              size={135}
              showPlatform={true}
              showGlow={true}
              moodOverride={currentStepData.mood}
              speechTextOverride={currentStepData.speech}
            />

            <div className="mt-3">
              <span className="text-xs font-bold font-serif text-foreground block">
                {creatureMeta.name}
              </span>
              <span className="text-[10px] text-amber-400/80 font-semibold block">
                {creatureMeta.title}
              </span>

              <button
                type="button"
                onClick={() => setShowSelector(!showSelector)}
                className="mt-2 text-[10px] text-stone-400 hover:text-amber-300 underline font-medium cursor-pointer"
              >
                {showSelector ? 'Hide Ally Selector' : 'Change Starting Ally'}
              </button>
            </div>

            {showSelector && (
              <div className="mt-3 w-full animate-in fade-in">
                <CompanionSelector variant="compact" />
              </div>
            )}
          </div>

          {/* Tutorial Content (Right 7 cols) */}
          <div className="sm:col-span-7 space-y-4 sm:pl-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {currentStepData.icon}
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider font-mono">
                  Guide {step + 1} of {TUTORIAL_STEPS.length}
                </span>
              </div>
              <h3 className="text-xl font-bold font-serif text-foreground">
                {currentStepData.title}
              </h3>
              <p className="text-[11px] text-stone-400 font-medium">
                {currentStepData.subtitle}
              </p>
            </div>

            {currentStepData.content}

            {/* Navigation & Progress */}
            <div className="pt-4 border-t border-stone-800/80 flex items-center justify-between gap-3">
              {/* Dots */}
              <div className="flex gap-1.5">
                {TUTORIAL_STEPS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setStep(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      step === idx
                        ? 'w-6 bg-amber-400 shadow-[0_0_8px_rgba(212,168,83,0.5)]'
                        : 'w-2 bg-stone-700 hover:bg-stone-500'
                    }`}
                  />
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-stone-100 text-xs font-semibold cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}

                {step < TUTORIAL_STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep(step + 1)}
                    className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(212,168,83,0.3)] transition-all cursor-pointer"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(212,168,83,0.4)] transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Enter Sanctuary!</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
