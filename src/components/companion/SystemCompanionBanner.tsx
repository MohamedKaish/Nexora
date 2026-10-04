'use client'

import React, { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { useAppStore } from '@/store/appStore'
import { useCharacterStore } from '@/store/characterStore'
import { useTaskStore } from '@/store/useTaskStore'
import { useHabitStore } from '@/store/useHabitStore'
import { useFocusStore } from '@/store/useFocusStore'
import { useKyroStore } from '@/store/kyroStore'
import { Companion } from './Companion'
import { ORIGINAL_CREATURES } from './companion-data'
import { normalizeArchetype } from './CompanionState'
import { Bot, Sparkles, MessageCircle } from 'lucide-react'

export function SystemCompanionBanner({ className = '' }: { className?: string }) {
  const pathname = usePathname()
  const userName = useAppStore((s) => s.preferences.displayName) || 'Explorer'
  const agentName = useAppStore((s) => s.agentConfig.name) || 'Kyro'
  const rawArch = useCharacterStore((s) => s.config.archetype)
  const currentArchetype = normalizeArchetype(rawArch)
  const creatureMeta = ORIGINAL_CREATURES[currentArchetype] || ORIGINAL_CREATURES.nyxen
  const toggleKyro = useKyroStore((s) => s.toggleOpen)

  const tasks = useTaskStore((s) => s.tasks)
  const habits = useHabitStore((s) => s.habits)
  const completions = useHabitStore((s) => s.completions)
  const focusSessions = useFocusStore((s) => s.sessions)
  const isFocusRunning = useFocusStore((s) => s.isRunning)

  // Contextual live dialogue tailored to the current screen
  const commentary = useMemo(() => {
    const activeTasks = tasks.filter((t) => t.status !== 'done')
    const urgentTasks = activeTasks.filter((t) => t.priority === 'urgent' || t.priority === 'high')
    const todayStr = new Date().toISOString().split('T')[0]
    const todayCompletedHabits = completions.filter((c) => c.completedDate === todayStr).length

    switch (pathname) {
      case '/tasks':
        if (urgentTasks.length > 0) {
          return `I have flagged ${urgentTasks.length} high-priority quest${urgentTasks.length > 1 ? 's' : ''}. Clearing "${urgentTasks[0].title}" first will earn us +50 XP and relieve pressure.`
        }
        if (activeTasks.length > 0) {
          return `${activeTasks.length} active quests on the matrix. Let's take down the next objective with swift velocity!`
        }
        return `All quests cleared! The board is tranquil. Great time to rest or plan future horizons.`

      case '/habits':
        if (todayCompletedHabits === habits.length && habits.length > 0) {
          return `Incredible discipline, ${userName}! All ${habits.length} habits for today are locked in. Unbroken chain!`
        }
        return `${todayCompletedHabits} of ${habits.length} habits secured today. Check in the remaining rituals to protect our streak multiplier!`

      case '/focus':
        if (isFocusRunning) {
          return `Sensory shielding active. Breathe deep, stay in flow, and let the outside noise fade away.`
        }
        return `Focus chamber primed. Lock in 25 minutes of deep work to accelerate milestone progress.`

      case '/goals':
        return `Milestone horizons provide the guiding star for daily execution. Every completed task builds toward these targets.`

      case '/timetable':
      case '/calendar':
        return `Structured time-blocking turns vague intentions into concrete reality. Flow through your allocated blocks with poise.`

      case '/analytics':
        return `Reviewing our habitat metrics. Real progress is forged in consistent daily increments.`

      case '/account':
        return `Explorer rank and telemetry board. We level up our sanctuary bond with every task, habit, and focus minute.`

      default:
        return `Standing beside you, ${userName}. Telemetry synchronized. Tell me what we should conquer next.`
    }
  }, [pathname, tasks, habits, completions, isFocusRunning, userName])

  // Don't show redundant banner on character atelier or agent page where full stage exists
  if (pathname === '/character' || pathname === '/agent' || pathname === '/dashboard') {
    return null
  }

  return (
    <div
      onClick={toggleKyro}
      className={`world-surface p-3.5 sm:p-4 border border-amber-400/25 hover:border-amber-400/50 transition-all cursor-pointer group flex items-center justify-between gap-4 relative overflow-hidden ${className}`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="relative shrink-0 w-11 h-11 flex items-center justify-center rounded-2xl bg-amber-400/10 border border-amber-400/30 overflow-hidden">
          <Companion size={38} showPlatform={false} showGlow={false} interactive={false} />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-serif text-foreground">{creatureMeta.name}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/15 text-amber-300 font-semibold uppercase tracking-wider">
              {creatureMeta.title}
            </span>
          </div>
          <p className="text-xs text-stone-300 group-hover:text-amber-200/90 transition-colors line-clamp-1 mt-0.5">
            &ldquo;{commentary}&rdquo;
          </p>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 group-hover:translate-x-0.5 transition-transform">
        <MessageCircle className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Ask {agentName}</span>
      </div>
    </div>
  )
}
