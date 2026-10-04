'use client'

import React from 'react'
import { useTaskStore } from '@/store/useTaskStore'
import { useHabitStore } from '@/store/useHabitStore'
import { useFocusStore } from '@/store/useFocusStore'
import { useGoalStore } from '@/store/useGoalStore'
import { useAppStore } from '@/store/appStore'
import {
  BarChart3,
  Flame,
  Zap,
  CheckCircle2,
  Target,
  TrendingUp,
  Award,
  Clock,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react'

export default function AnalyticsPage() {
  const userName = useAppStore((s) => s.preferences.displayName) || 'Explorer'
  const agentName = useAppStore((s) => s.agentConfig.name) || 'Kyro'

  const tasks = useTaskStore((s) => s.tasks)
  const habits = useHabitStore((s) => s.habits)
  const completions = useHabitStore((s) => s.completions)
  const focusSessions = useFocusStore((s) => s.sessions)
  const goals = useGoalStore((s) => s.goals)

  // Computed metrics
  const completedTasks = tasks.filter((t) => t.status === 'done').length
  const totalTasks = tasks.length
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const totalFocusMinutes = Math.round(
    focusSessions.reduce((acc, curr) => acc + curr.durationSeconds, 0) / 60
  )
  const avgFocusDuration =
    focusSessions.length > 0
      ? Math.round(totalFocusMinutes / focusSessions.length)
      : 0

  const totalHabitCompletions = completions.length
  const highestStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.streak), 0) : 0

  const activeGoals = goals.filter((g) => g.status === 'active')
  const avgGoalProgress =
    activeGoals.length > 0
      ? Math.round(activeGoals.reduce((acc, curr) => acc + curr.progress, 0) / activeGoals.length)
      : 0

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-gradient-gold">
          Performance Intelligence
        </h1>
        <p className="text-sm text-stone-400 mt-1">
          Telemetry on your energy, deep work velocity, and sanctuary habit rhythms.
        </p>
      </div>

      {/* Core Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="world-surface p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Focus Chamber</span>
            <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-mono font-bold text-foreground">{totalFocusMinutes}m</div>
          <p className="text-[11px] text-stone-400">Across {focusSessions.length} logged sessions</p>
        </div>

        <div className="world-surface p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Task Velocity</span>
            <div className="p-2 rounded-xl bg-blue-400/10 text-blue-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-mono font-bold text-foreground">{taskCompletionRate}%</div>
          <p className="text-[11px] text-stone-400">{completedTasks} of {totalTasks} quests solved</p>
        </div>

        <div className="world-surface p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Top Streak</span>
            <div className="p-2 rounded-xl bg-orange-400/10 text-orange-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-mono font-bold text-amber-300">{highestStreak} days</div>
          <p className="text-[11px] text-stone-400">{totalHabitCompletions} total check-ins</p>
        </div>

        <div className="world-surface p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Goal Momentum</span>
            <div className="p-2 rounded-xl bg-emerald-400/10 text-emerald-400">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-mono font-bold text-foreground">{avgGoalProgress}%</div>
          <p className="text-[11px] text-stone-400">Average across {activeGoals.length} horizons</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Habit Heat & Velocity Breakdown (Left 7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="world-deck p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                Habit Consistency Ledger
              </h3>
              <span className="text-xs text-stone-400 font-mono">{habits.length} habits tracked</span>
            </div>

            <div className="space-y-4">
              {habits.length === 0 ? (
                <p className="text-xs text-stone-500 py-4 text-center">No habits established yet.</p>
              ) : (
                habits.map((habit) => {
                  const habitCompletions = completions.filter((c) => c.habitId === habit.id).length
                  return (
                    <div key={habit.id} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-stone-200">{habit.name}</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-amber-400 font-bold">{habit.streak}d streak</span>
                          <span className="text-stone-500">({habitCompletions} total)</span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-stone-900 overflow-hidden border border-stone-800">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(10, habit.streak * 12))}%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Focus Distribution */}
          <div className="world-surface p-6 space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Focus Chamber Metrics
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800 text-xs">
                <p className="text-stone-400 text-[11px]">Average Session</p>
                <p className="text-xl font-bold font-mono text-foreground mt-1">
                  {avgFocusDuration}m
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800 text-xs">
                <p className="text-stone-400 text-[11px]">Total Deep Hours</p>
                <p className="text-xl font-bold font-mono text-amber-300 mt-1">
                  {(totalFocusMinutes / 60).toFixed(1)}h
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800 text-xs">
                <p className="text-stone-400 text-[11px]">Session Efficiency</p>
                <p className="text-xl font-bold font-mono text-emerald-400 mt-1">94%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Companion Synthesis Audit (Right 5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="world-deck p-6 space-y-4 border border-amber-400/25">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">{agentName} Weekly Audit</h4>
                <p className="text-[11px] text-amber-300/80 font-medium">Telemetry Feedback</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-800/80 text-xs leading-relaxed text-stone-300 space-y-2">
              <p>
                "Greetings {userName}. Your highest energy reservoir this week shines through your deep focus blocks ({totalFocusMinutes} minutes logged).
              </p>
              <p>
                To elevate your velocity: close out your remaining high priority tasks before launching new long-term horizons."
              </p>
            </div>

            <div className="space-y-2 pt-2 text-xs">
              <div className="flex items-center gap-2 text-stone-400">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Sanctuary Tier: <strong>Navigator</strong></span>
              </div>
              <div className="flex items-center gap-2 text-stone-400">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Weekly Momentum: <strong>+18% vs last cycle</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
