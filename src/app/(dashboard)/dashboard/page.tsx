'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useAppStore } from '@/store/appStore'
import { useTaskStore } from '@/store/useTaskStore'
import { useGoalStore } from '@/store/useGoalStore'
import { useHabitStore } from '@/store/useHabitStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useAgentStore } from '@/store/agentStore'
import { CompanionAvatar } from '@/features/companion/CompanionAvatar'
import { Button } from '@/components/ui/button'
import {
  CheckSquare, Target, Flame, Zap, FolderKanban,
  ArrowRight, Plus, Check, Sparkles, Clock, Bot,
} from 'lucide-react'
import { format } from 'date-fns'

function getGreeting(name: string) {
  const hour = new Date().getHours()
  if (hour < 6) return `Night owl mode, ${name}`
  if (hour < 12) return `Good morning, ${name}`
  if (hour < 17) return `Good afternoon, ${name}`
  if (hour < 21) return `Good evening, ${name}`
  return `Winding down, ${name}`
}

function getCompanionMood(tasks: number, habits: number, goals: number) {
  if (tasks === 0 && habits === 0 && goals === 0) return 'greeting'
  if (tasks > 5) return 'focused'
  if (habits > 0) return 'happy'
  return 'idle'
}

export default function DashboardPage() {
  const displayName = useAppStore((s) => s.preferences.displayName) || 'Explorer'
  const agentName = useAgentStore((s) => s.config.name)
  const tasks = useTaskStore((s) => s.tasks)
  const goals = useGoalStore((s) => s.goals)
  const habits = useHabitStore((s) => s.habits)
  const projects = useProjectStore((s) => s.projects)
  const today = format(new Date(), 'EEEE, MMMM do')

  const stats = useMemo(() => {
    const activeTasks = tasks.filter(t => !t.deletedAt && t.status !== 'done')
    const todayCompleted = tasks.filter(t => {
      if (!t.updatedAt || t.status !== 'done') return false
      return format(new Date(t.updatedAt), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
    })
    const activeGoals = goals.filter(g => g.status === 'active' && !g.deletedAt)
    const activeHabits = habits.filter(h => !h.deletedAt)
    const activeProjects = projects.filter(p => p.status === 'active' && !p.deletedAt)
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const habitsCompletedToday = activeHabits.filter(h =>
      h.habit_completions?.some(c => {
        const d = c.completedDate || (c as unknown as Record<string, unknown>).completed_date as string
        return d === todayStr
      })
    ).length

    return {
      activeTasks, todayCompleted,
      activeGoals, activeHabits, activeProjects,
      habitsCompletedToday,
      streak: Math.max(...activeHabits.map(h => h.streak || 0), 0),
    }
  }, [tasks, goals, habits, projects])

  const companionMood = getCompanionMood(
    stats.activeTasks.length,
    stats.habitsCompletedToday,
    stats.activeGoals.length,
  )

  // Pick a companion message
  const companionMessages = [
    stats.todayCompleted.length > 0
      ? `You've completed ${stats.todayCompleted.length} task${stats.todayCompleted.length > 1 ? 's' : ''} today. Keep going!`
      : stats.activeTasks.length > 0
      ? `You have ${stats.activeTasks.length} task${stats.activeTasks.length > 1 ? 's' : ''} waiting. Let's make progress!`
      : 'Ready to start your day? Add a task to begin!',
    stats.streak > 0 ? `🔥 ${stats.streak}-day streak! Don't break the chain.` : null,
    stats.habitsCompletedToday > 0 ? `${stats.habitsCompletedToday}/${stats.activeHabits.length} habits done today!` : null,
  ].filter(Boolean)

  return (
    <div className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6 md:space-y-8">
      {/* ─── Hero: Companion Greeting Area ─── */}
      <div className="relative overflow-hidden rounded-3xl world-card p-6 md:p-8">
        {/* Ambient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.03] via-transparent to-transparent pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-10">
          {/* Companion */}
          <div className="relative">
            <div className="companion-glow p-3">
              <CompanionAvatar
                size={140}
                state={companionMood}
                expression={companionMood === 'greeting' ? 'happy' : companionMood}
                animate
                showGlow
                showPlatform
              />
            </div>
          </div>

          {/* Greeting Text */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <div>
              <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-1">
                {today}
              </p>
              <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-gradient">
                {getGreeting(displayName)}
              </h1>
            </div>

            {/* Companion Speech Bubble */}
            <div className="inline-flex items-start gap-2 max-w-md px-4 py-3 rounded-2xl world-glass text-sm text-foreground/80 font-medium leading-relaxed">
              <Bot className="h-4 w-4 text-accent mt-0.5 shrink-0" />
              <span>{companionMessages[0]}</span>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-1">
              <Link href="/tasks">
                <Button className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 font-semibold gap-1.5 cursor-pointer shadow-sm h-9 px-4 text-sm">
                  <Plus className="w-3.5 h-3.5" /> New Task
                </Button>
              </Link>
              <Link href="/focus">
                <Button variant="outline" className="rounded-xl font-semibold gap-1.5 cursor-pointer border-border/40 h-9 px-4 text-sm hover:bg-foreground/[0.04]">
                  <Zap className="w-3.5 h-3.5 text-brand-amber" /> Focus
                </Button>
              </Link>
              <Link href="/agent">
                <Button variant="outline" className="rounded-xl font-semibold gap-1.5 cursor-pointer border-border/40 h-9 px-4 text-sm hover:bg-foreground/[0.04]">
                  <Sparkles className="w-3.5 h-3.5 text-brand-purple" /> Ask {agentName}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Stats Orbs ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Link href="/tasks" className="group">
          <StatOrb
            icon={CheckSquare}
            label="Active Tasks"
            value={stats.activeTasks.length}
            color="var(--color-brand-blue)"
            subtext={`${stats.todayCompleted.length} done today`}
          />
        </Link>
        <Link href="/goals" className="group">
          <StatOrb
            icon={Target}
            label="Goals"
            value={stats.activeGoals.length}
            color="var(--color-brand-emerald)"
            subtext="active goals"
          />
        </Link>
        <Link href="/habits" className="group">
          <StatOrb
            icon={Flame}
            label="Habits"
            value={`${stats.habitsCompletedToday}/${stats.activeHabits.length}`}
            color="var(--color-brand-amber)"
            subtext={stats.streak > 0 ? `${stats.streak}-day streak` : 'Build consistency'}
          />
        </Link>
        <Link href="/projects" className="group">
          <StatOrb
            icon={FolderKanban}
            label="Projects"
            value={stats.activeProjects.length}
            color="var(--color-brand-purple)"
            subtext="in progress"
          />
        </Link>
      </div>

      {/* ─── Main Content Grid ─── */}
      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        {/* Today's Tasks */}
        <div className="world-card p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-brand-blue/10">
                <CheckSquare className="h-4 w-4 text-brand-blue" />
              </div>
              <h2 className="text-sm font-bold text-foreground tracking-tight">Today's Tasks</h2>
            </div>
            <Link href="/tasks" className="text-xs font-semibold text-accent hover:text-accent/80 transition-colors flex items-center gap-1 cursor-pointer">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {stats.activeTasks.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <div className="w-10 h-10 mx-auto rounded-2xl bg-brand-blue/5 flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-brand-blue/30" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">All caught up!</p>
              <Link href="/tasks">
                <Button variant="outline" size="sm" className="rounded-xl text-xs cursor-pointer">
                  <Plus className="w-3 h-3 mr-1" /> Add task
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
              {stats.activeTasks.slice(0, 6).map(task => (
                <TaskItem key={task.id} task={task} />
              ))}
              {stats.activeTasks.length > 6 && (
                <Link href="/tasks" className="block text-xs font-semibold text-accent text-center py-2 hover:text-accent/80 transition-colors cursor-pointer">
                  +{stats.activeTasks.length - 6} more tasks
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Habits Today */}
        <div className="world-card p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-brand-amber/10">
                <Flame className="h-4 w-4 text-brand-amber" />
              </div>
              <h2 className="text-sm font-bold text-foreground tracking-tight">Today's Habits</h2>
            </div>
            <Link href="/habits" className="text-xs font-semibold text-accent hover:text-accent/80 transition-colors flex items-center gap-1 cursor-pointer">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {stats.activeHabits.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <div className="w-10 h-10 mx-auto rounded-2xl bg-brand-amber/5 flex items-center justify-center">
                <Flame className="w-5 h-5 text-brand-amber/30" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">No habits tracked yet</p>
              <Link href="/habits">
                <Button variant="outline" size="sm" className="rounded-xl text-xs cursor-pointer">
                  <Plus className="w-3 h-3 mr-1" /> Track a habit
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-1.5">
              {stats.activeHabits.slice(0, 5).map(habit => {
                const todayStr = format(new Date(), 'yyyy-MM-dd')
                const isCompleted = habit.habit_completions?.some(c => {
                  const d = c.completedDate || (c as unknown as Record<string, unknown>).completed_date as string
                  return d === todayStr
                }) || false

                return (
                  <div key={habit.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                    isCompleted ? 'bg-brand-emerald/5 border border-brand-emerald/10' : 'bg-foreground/[0.02] border border-border/20 hover:bg-foreground/[0.04]'
                  }`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                      isCompleted ? 'bg-brand-emerald/20' : 'border border-border/40'
                    }`}>
                      {isCompleted && <Check className="w-3.5 h-3.5 text-brand-emerald" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {habit.name}
                      </p>
                    </div>
                    {habit.streak > 0 && (
                      <span className="text-[10px] font-bold text-brand-amber flex items-center gap-0.5">
                        <Flame className="w-3 h-3" /> {habit.streak}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Projects Strip ─── */}
      {stats.activeProjects.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-brand-purple/10">
                <FolderKanban className="h-4 w-4 text-brand-purple" />
              </div>
              <h2 className="text-sm font-bold text-foreground tracking-tight">Active Projects</h2>
            </div>
            <Link href="/projects" className="text-xs font-semibold text-accent hover:text-accent/80 transition-colors flex items-center gap-1 cursor-pointer">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {stats.activeProjects.slice(0, 3).map(project => {
              const projectTasks = tasks.filter(t => {
                const pid = t.projectId || (t as unknown as Record<string, unknown>).project_id as string
                return pid === project.id && !t.deletedAt
              })
              const done = projectTasks.filter(t => t.status === 'done').length
              const progress = projectTasks.length > 0 ? Math.round((done / projectTasks.length) * 100) : 0

              return (
                <Link key={project.id} href="/projects" className="block">
                  <div className="world-card p-4 cursor-pointer">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${project.color}12` }}>
                        <FolderKanban className="w-4 h-4" style={{ color: project.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{project.name}</p>
                        <p className="text-[10px] text-muted-foreground">{done}/{projectTasks.length} tasks</p>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-border/30 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${progress}%`, backgroundColor: project.color }}
                      />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Sub-components ─── */

function StatOrb({
  icon: Icon,
  label,
  value,
  color,
  subtext,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  color: string
  subtext: string
}) {
  return (
    <div className="world-card stat-orb p-4 md:p-5 flex flex-col gap-2 cursor-pointer">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-xl" style={{ backgroundColor: `${color}12` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div>
        <p className="text-2xl md:text-3xl font-bold text-foreground tracking-tighter">{value}</p>
        <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{subtext}</p>
      </div>
    </div>
  )
}

function TaskItem({ task }: { task: { id: string; title: string; priority?: string; status: string; timeframe?: string } }) {
  const toggleStatus = useTaskStore((s) => s.toggleStatus)
  const isDone = task.status === 'done'

  const priorityColors: Record<string, string> = {
    urgent: '#FB7185',
    high: '#FBBF24',
    medium: '#60A5FA',
    low: '#A8A29E',
  }

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
      isDone ? 'bg-brand-emerald/5 border border-brand-emerald/10' : 'bg-foreground/[0.02] border border-border/20 hover:bg-foreground/[0.04]'
    }`}>
      <button
        onClick={() => toggleStatus(task.id)}
        className={`w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer shrink-0 ${
          isDone ? 'bg-brand-emerald text-white' : 'border-[1.5px] border-border/50 hover:border-accent/50'
        }`}
        aria-label={isDone ? 'Unmark task' : 'Complete task'}
      >
        {isDone && <Check className="w-3 h-3" />}
      </button>
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className={`text-sm font-medium truncate ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {task.title}
        </span>
        {task.timeframe && task.timeframe !== 'none' && (
          <span className="text-[9px] font-bold uppercase tracking-widest text-accent bg-accent/10 px-1.5 py-0.5 rounded-sm shrink-0 mt-0.5">
            {task.timeframe}
          </span>
        )}
      </div>
      {task.priority && task.priority !== 'none' && (
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: priorityColors[task.priority] || '#A8A29E' }}
          title={task.priority}
        />
      )}
    </div>
  )
}
