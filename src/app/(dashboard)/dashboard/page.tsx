'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { useAppStore } from '@/store/appStore'
import { useTaskStore } from '@/store/useTaskStore'
import { useHabitStore } from '@/store/useHabitStore'
import { useGoalStore } from '@/store/useGoalStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useFocusStore } from '@/store/useFocusStore'
import { useCharacterStore } from '@/store/characterStore'
import { useKyroStore } from '@/store/kyroStore'
import { Companion } from '@/components/companion/Companion'
import { CompanionSelector } from '@/components/companion/CompanionSelector'
import { companionController } from '@/components/companion/CompanionController'
import {
  Compass,
  CheckCircle2,
  Circle,
  Flame,
  Zap,
  Target,
  FolderKanban,
  ArrowRight,
  Plus,
  Bot,
  Sparkles,
  Calendar,
} from 'lucide-react'
import { format } from 'date-fns'

export default function DashboardPage() {
  const userName = useAppStore((s) => s.preferences.displayName) || 'Explorer'
  const agentName = useAppStore((s) => s.agentConfig.name) || 'Kyro'
  const characterConfig = useCharacterStore((s) => s.config)
  const celebrateCompanion = useCharacterStore((s) => s.celebrate)
  const toggleKyro = useKyroStore((s) => s.toggleOpen)

  const tasks = useTaskStore((s) => s.tasks)
  const toggleTaskStatus = useTaskStore((s) => s.toggleStatus)
  const habits = useHabitStore((s) => s.habits)
  const completions = useHabitStore((s) => s.completions)
  const toggleHabit = useHabitStore((s) => s.toggleCompletion)
  const goals = useGoalStore((s) => s.goals)
  const projects = useProjectStore((s) => s.projects)

  const isFocusRunning = useFocusStore((s) => s.isRunning)
  const startFocusTimer = useFocusStore((s) => s.startTimer)

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const dateHeading = format(new Date(), 'EEEE, MMMM do')

  // Context calculations
  const stats = useMemo(() => {
    const activeTasks = tasks.filter((t) => t.status !== 'done')
    const completedToday = tasks.filter((t) => t.status === 'done')
    const urgentTasks = activeTasks.filter((t) => t.priority === 'urgent' || t.priority === 'high')
    const habitsDoneToday = completions.filter((c) => c.completedDate === todayStr).length
    const activeGoals = goals.filter((g) => g.status === 'active')
    const maxStreak = Math.max(...habits.map((h) => h.streak), 0)

    return {
      activeTasks,
      completedToday,
      urgentTasks,
      habitsDoneToday,
      activeGoals,
      maxStreak,
    }
  }, [tasks, habits, completions, goals, todayStr])

  // Contextual speech bubble message from Kyro
  const companionMessage = useMemo(() => {
    if (isFocusRunning) return "Chamber locked. Stay in flow. One breath, one task."
    if (stats.urgentTasks.length > 0) return `Priorities aligned. We have ${stats.urgentTasks.length} high-leverage objective${stats.urgentTasks.length > 1 ? 's' : ''} to conquer today.`
    if (stats.completedToday.length > 0) return `Clean work, ${userName}! You've crossed ${stats.completedToday.length} task${stats.completedToday.length > 1 ? 's' : ''} off the board.`
    if (stats.habitsDoneToday > 0) return `Consistency is the forge. ${stats.habitsDoneToday}/${habits.length} habits locked in.`
    return "Sanctuary stable. What is the single most important action for today?"
  }, [isFocusRunning, stats, habits.length, userName])

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return `Good morning, ${userName}`
    if (hour < 18) return `Good afternoon, ${userName}`
    return `Good evening, ${userName}`
  }, [userName])

  const handleTaskToggle = (id: string, currentStatus: string) => {
    const task = tasks.find((t) => t.id === id)
    toggleTaskStatus(id)
    if (currentStatus !== 'done') {
      companionController.onTaskCompleted(task?.title)
    }
  }

  const handleHabitToggle = (id: string) => {
    const habit = habits.find((h) => h.id === id)
    const wasCompleted = toggleHabit(id)
    if (wasCompleted) {
      companionController.onHabitChecked(habit?.name, (habit?.streak || 0) + 1)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ─── THE WORLD STAGE: COMPANION & COMMAND CENTER ─── */}
      <section className="relative overflow-hidden rounded-3xl border border-stone-800/80 bg-gradient-to-br from-stone-900/60 via-stone-950/80 to-stone-950 p-6 sm:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
        {/* Ambient environmental aura */}
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full blur-[120px] bg-amber-500/10 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Left: Greeting & Command State */}
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900/90 border border-stone-800 text-amber-300 text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>{dateHeading}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold tracking-tight text-foreground">
              {greeting}
            </h1>

            <p className="text-sm sm:text-base text-stone-400 max-w-lg leading-relaxed font-normal">
              {isFocusRunning
                ? "Deep work chamber active. External noise suppressed."
                : `You have ${stats.activeTasks.length} active tasks, ${stats.habitsDoneToday}/${habits.length} habits locked in, and ${stats.urgentTasks.length} high priority items waiting.`}
            </p>

            {/* Quick Command Bar */}
            <div className="flex flex-wrap gap-2 sm:gap-2.5 justify-center md:justify-start pt-2">
              {!isFocusRunning ? (
                <button
                  onClick={() => startFocusTimer()}
                  className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center gap-1.5 sm:gap-2 shadow-[0_0_20px_rgba(212,168,83,0.3)] transition-all cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-stone-950" />
                  <span>Launch 25m Focus</span>
                </button>
              ) : (
                <Link
                  href="/focus"
                  className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 sm:gap-2 transition-all"
                >
                  <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 animate-pulse" />
                  <span>View Active Chamber</span>
                </Link>
              )}

              <Link
                href="/tasks"
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-800 text-stone-200 font-semibold text-xs flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-400" />
                <span>Add Task</span>
              </Link>

              <button
                onClick={toggleKyro}
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-800 text-amber-300 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                <span>Ask {agentName}</span>
              </button>
            </div>
          </div>

          {/* Right: Integrated Environmental Companion on Dais */}
          <div className="relative flex flex-col items-center shrink-0">
            <Companion
              size={150}
              showGlow={true}
              showPlatform={true}
              speechTextOverride={companionMessage}
              onClick={toggleKyro}
            />
            <div className="text-center mt-2 mb-3">
              <span className="text-xs font-bold text-stone-300">{agentName}</span>
              <span className="block text-[10px] text-amber-400/70 font-medium">Click to Converse</span>
            </div>

            {/* Quick 1-Click Creature Switcher */}
            <CompanionSelector variant="compact" />
          </div>
        </div>
      </section>

      {/* ─── VITAL SIGNALS MATRIX (STAT PODS) ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/tasks" className="world-deck p-4 hover:border-amber-400/40 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-400">Active Tasks</span>
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-serif text-foreground mt-2">
            {stats.activeTasks.length}
          </div>
          <span className="text-[11px] text-blue-300/80 font-medium mt-1 block">
            {stats.completedToday.length} finished today
          </span>
        </Link>

        <Link href="/habits" className="world-deck p-4 hover:border-amber-400/40 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-400">Habits Locked</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-serif text-foreground mt-2">
            {stats.habitsDoneToday}/{habits.length}
          </div>
          <span className="text-[11px] text-amber-300/80 font-medium mt-1 block">
            {stats.maxStreak > 0 ? `${stats.maxStreak}-day streak active` : 'Build momentum'}
          </span>
        </Link>

        <Link href="/goals" className="world-deck p-4 hover:border-amber-400/40 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-400">Active Goals</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-serif text-foreground mt-2">
            {stats.activeGoals.length}
          </div>
          <span className="text-[11px] text-emerald-300/80 font-medium mt-1 block">
            milestones in flight
          </span>
        </Link>

        <Link href="/projects" className="world-deck p-4 hover:border-amber-400/40 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-400">Workspaces</span>
            <FolderKanban className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-serif text-foreground mt-2">
            {projects.length}
          </div>
          <span className="text-[11px] text-purple-300/80 font-medium mt-1 block">
            active project hubs
          </span>
        </Link>
      </div>

      {/* ─── TODAY'S PROTOCOL: TASKS & HABITS INTEGRATION ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Priority Task Deck */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Today&apos;s High-Leverage Tasks
              </h3>
            </div>
            <Link href="/tasks" className="text-xs font-semibold text-amber-400 hover:underline flex items-center gap-1">
              Task Matrix <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {stats.activeTasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="world-deck p-3.5 flex items-center justify-between gap-3 group hover:border-amber-400/30 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => handleTaskToggle(task.id, task.status)}
                    className="w-6 h-6 rounded-lg border border-stone-700 hover:border-amber-400 flex items-center justify-center shrink-0 cursor-pointer text-stone-500 hover:text-amber-400 transition-colors"
                  >
                    <Circle className="w-3.5 h-3.5" />
                  </button>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate group-hover:text-amber-200 transition-colors">
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-stone-400 truncate">{task.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      task.priority === 'urgent'
                        ? 'bg-rose-500/15 text-rose-300'
                        : task.priority === 'high'
                        ? 'bg-amber-500/15 text-amber-300'
                        : 'bg-blue-500/15 text-blue-300'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              </div>
            ))}

            {stats.activeTasks.length === 0 && (
              <div className="p-8 text-center world-deck border-dashed border-stone-800">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-60" />
                <h4 className="text-sm font-bold text-foreground">Clean Deck</h4>
                <p className="text-xs text-stone-400 mt-1">All prioritized tasks for today are complete.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Daily Habit Streak Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Daily Habit Streaks
              </h3>
            </div>
            <Link href="/habits" className="text-xs font-semibold text-amber-400 hover:underline flex items-center gap-1">
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {habits.slice(0, 4).map((habit) => {
              const isDone = completions.some(
                (c) => c.habitId === habit.id && c.completedDate === todayStr
              )

              return (
                <div
                  key={habit.id}
                  onClick={() => handleHabitToggle(habit.id)}
                  className={`world-deck p-3.5 flex items-center justify-between cursor-pointer transition-all ${
                    isDone
                      ? 'border-emerald-500/30 bg-emerald-950/15'
                      : 'hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        isDone
                          ? 'bg-emerald-400 border-emerald-400 text-stone-950'
                          : 'border-stone-700 text-transparent'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 fill-current" />
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${isDone ? 'line-through text-stone-500' : 'text-foreground'}`}>
                        {habit.name}
                      </p>
                      <span className="text-[10px] text-stone-400">
                        {habit.frequency}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    <span>{habit.streak}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
