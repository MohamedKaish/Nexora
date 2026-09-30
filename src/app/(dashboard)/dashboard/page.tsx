'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  CheckCircle2, ListTodo, FolderKanban, Flame, Target,
  Zap, ArrowRight, Clock, Plus, Cloud
} from 'lucide-react'
import { FocusWidget } from '@/features/dashboard/components/FocusWidget'
import { useTaskStore } from '@/store/useTaskStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useHabitStore } from '@/store/useHabitStore'
import { useGoalStore } from '@/store/useGoalStore'
import { useAppStore } from '@/store/appStore'
import { useAgentStore, getAgentMessage } from '@/store/agentStore'
import { CompanionAvatar } from '@/features/companion/CompanionAvatar'
import { useAuth } from '@/providers/AuthProvider'
import { isToday, parseISO, format } from 'date-fns'

export default function DashboardPage() {
  const [greeting, setGreeting] = useState('Welcome')
  const [mounted, setMounted] = useState(false)

  const { tasks } = useTaskStore()
  const { projects } = useProjectStore()
  const { habits } = useHabitStore()
  const { goals } = useGoalStore()
  const preferences = useAppStore((s) => s.preferences)
  const agentConfig = useAgentStore((s) => s.config)
  const { user } = useAuth()

  useEffect(() => {
    setMounted(true)
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 18) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])

  if (!mounted) {
    return (
      <div className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <div className="animate-pulse space-y-6">
          <div className="h-20 bg-secondary/30 rounded-2xl" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1,2,3,4].map(i => <div key={i} className="h-28 bg-secondary/20 rounded-2xl" />)}
          </div>
        </div>
      </div>
    )
  }

  // Compute stats
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todayTasks = tasks.filter(t => {
    const rawT = t as unknown as Record<string, unknown>
    if (t.dueDate || rawT.due_date) {
      const d = (t.dueDate || rawT.due_date) as string
      try { return isToday(parseISO(d)) } catch { return false }
    }
    return false
  })
  const completedToday = todayTasks.filter(t => t.status === 'done').length
  const pendingToday = todayTasks.length - completedToday
  const activeTasks = tasks.filter(t => t.status !== 'done' && !t.deletedAt).length
  const activeProjects = projects.filter(p => p.status === 'active').length
  const activeGoals = goals.filter(g => g.status === 'active').length
  const topStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0
  const displayName = preferences.displayName || 'there'
  const agentGreeting = getAgentMessage('greeting', agentConfig.personality)

  return (
    <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Hero Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <CompanionAvatar size={56} expression={completedToday > 0 ? 'happy' : 'neutral'} />
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-foreground">
              {greeting}, {displayName}
            </h1>
            <p className="text-muted-foreground font-medium mt-0.5">
              {format(new Date(), 'EEEE, MMMM d')} · {agentGreeting}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/tasks">
            <Button variant="outline" size="sm" className="rounded-xl border-border/60 font-medium gap-1.5 cursor-pointer hover:bg-secondary/40 transition-all">
              <Plus className="w-3.5 h-3.5" />
              New Task
            </Button>
          </Link>
          <Link href="/focus">
            <Button size="sm" className="rounded-xl bg-accent text-white hover:bg-accent/90 font-medium gap-1.5 cursor-pointer transition-all">
              <Zap className="w-3.5 h-3.5" />
              Focus
            </Button>
          </Link>
          {!user && (
            <Link href="/register">
              <Button variant="outline" size="sm" className="rounded-xl border-accent/30 text-accent hover:bg-accent/10 font-medium gap-1.5 cursor-pointer transition-all">
                <Cloud className="w-3.5 h-3.5" />
                Save to Cloud
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Guest Mode Notice */}
      {!user && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-accent/5 border border-accent/15">
          <Cloud className="w-4 h-4 text-accent shrink-0" />
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Local workspace</span> — Your data is saved in this browser.
            <Link href="/register" className="text-accent hover:underline ml-1 font-medium">Create an account</Link> to sync across devices.
          </p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Tasks Today', icon: ListTodo, value: todayTasks.length, sub: `${pendingToday} remaining`, color: '#3B82F6', href: '/tasks' },
          { label: 'Completed', icon: CheckCircle2, value: completedToday, sub: completedToday > 0 ? 'Great work!' : 'Get started', color: '#10B981', href: '/tasks' },
          { label: 'Active Projects', icon: FolderKanban, value: activeProjects, sub: `${activeTasks} total tasks`, color: '#8B5CF6', href: '/projects' },
          { label: 'Habit Streak', icon: Flame, value: `${topStreak}d`, sub: habits.length > 0 ? `${habits.length} habits` : 'No habits yet', color: '#F59E0B', href: '/habits' },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="border-border/40 bg-card/60 hover:bg-card/80 hover:border-border/60 transition-all duration-200 rounded-2xl cursor-pointer group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</CardTitle>
                <div className="p-1.5 rounded-lg transition-colors" style={{ backgroundColor: `${stat.color}15` }}>
                  <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-foreground tracking-tight">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1 font-medium">{stat.sub}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Focus Widget - spans 4 cols */}
        <FocusWidget />

        {/* Quick Actions + Goals - spans 3 cols */}
        <div className="lg:col-span-3 space-y-4">
          {/* Recent Projects */}
          <Card className="border-border/40 bg-card/60 rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">Recent Projects</CardTitle>
                <Link href="/projects" className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors">
                  View all <ArrowRight className="w-3 h-3 inline ml-0.5" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {projects.length === 0 ? (
                <div className="text-center py-6">
                  <FolderKanban className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No projects yet</p>
                  <Link href="/projects">
                    <Button variant="outline" size="sm" className="mt-3 rounded-lg text-xs cursor-pointer">
                      <Plus className="w-3 h-3 mr-1" /> Create Project
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {projects.slice(0, 4).map((project) => (
                    <div key={project.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/30 transition-colors cursor-pointer group">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${project.color}15` }}>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate group-hover:text-accent transition-colors">{project.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{project.description || 'No description'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Goals */}
          <Card className="border-border/40 bg-card/60 rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">Active Goals</CardTitle>
                <Link href="/goals" className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors">
                  View all <ArrowRight className="w-3 h-3 inline ml-0.5" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {goals.filter(g => g.status === 'active').length === 0 ? (
                <div className="text-center py-6">
                  <Target className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No active goals</p>
                  <Link href="/goals">
                    <Button variant="outline" size="sm" className="mt-3 rounded-lg text-xs cursor-pointer">
                      <Plus className="w-3 h-3 mr-1" /> Set a Goal
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {goals.filter(g => g.status === 'active').slice(0, 3).map((goal) => (
                    <div key={goal.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/30 transition-colors cursor-pointer">
                      <Target className="w-4 h-4 text-accent shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{goal.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{goal.type} goal</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
