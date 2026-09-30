'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, ListTodo, FolderKanban, Flame, Lock } from 'lucide-react'
import { FocusWidget } from '@/features/dashboard/components/FocusWidget'
import { useTaskStore } from '@/store/useTaskStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useHabitStore } from '@/store/useHabitStore'
import { isToday, parseISO } from 'date-fns'

export function GuestDashboardView() {
  const [guestName, setGuestName] = useState<string | null>(null)
  const [greeting, setGreeting] = useState('Welcome')

  const { tasks } = useTaskStore()
  const { projects } = useProjectStore()
  const { habits } = useHabitStore()

  // Compute stats
  const todayTasks = tasks.filter(t => t.dueDate && isToday(parseISO(t.dueDate)))
  const completedToday = todayTasks.filter(t => t.status === 'done').length
  const pendingToday = todayTasks.length - completedToday
  const activeProjects = projects.filter(p => p.status === 'active').length
  
  const topStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0
  const topHabit = habits.length > 0 ? habits.reduce((prev, current) => (prev.streak > current.streak) ? prev : current).name : 'No habits'

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGuestName(localStorage.getItem('nexora_guest_name'))
    
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 18) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])

  return (
    <div className="flex-1 space-y-6 p-8 pt-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between space-y-5 md:space-y-0 mb-2">
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tight text-foreground">
            {greeting}{guestName ? `, ${guestName}` : ''} <span className="inline-block animate-wave">👋</span>
          </h2>
          <p className="text-muted-foreground text-lg font-medium">Here is your local workspace.</p>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/tasks">
            <Button variant="outline" className="bg-secondary/40 border-white/5 hover:bg-secondary/80 hover:border-white/10 transition-all smooth-ring h-10 px-5 rounded-[12px] font-semibold text-[14px]">New Task</Button>
          </Link>
          <Link href="/projects">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] transition-all smooth-ring h-10 px-5 rounded-[12px] font-semibold text-[14px]">New Project</Button>
          </Link>
          <Link href="/register">
            <Button variant="outline" className="bg-brand-blue/10 text-brand-blue border-brand-blue/30 hover:bg-brand-blue/20 transition-all smooth-ring h-10 px-5 rounded-[12px] font-semibold text-[14px]">
              Save Workspace
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-brand-blue/10 border border-brand-blue/20 rounded-[16px] p-4 flex items-start space-x-4">
        <div className="mt-1 bg-brand-blue/20 p-2 rounded-full">
          <Lock className="w-5 h-5 text-brand-blue" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-brand-blue">Guest Mode Active</h3>
          <p className="text-sm text-brand-blue/80 mt-1">
            You are currently exploring Nexora locally. Your data is saved in your browser. To sync across devices, <Link href="/register" className="underline hover:text-brand-blue font-semibold">create an account</Link>.
          </p>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-8">
        {[
          { label: 'Tasks Today', icon: ListTodo, value: todayTasks.length, subtext: `${pendingToday} remaining`, color: 'blue' },
          { label: 'Completed', icon: CheckCircle2, value: completedToday, subtext: 'Great job!', color: 'emerald' },
          { label: 'Active Projects', icon: FolderKanban, value: activeProjects, subtext: 'In progress', color: 'purple' },
          { label: 'Habit Streak', icon: Flame, value: `${topStreak} days`, subtext: topHabit, color: 'amber' },
        ].map((stat, i) => (
          <Card key={i} className="glass-card relative overflow-hidden group border-white/5 rounded-[16px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</CardTitle>
              <div className={`p-2 bg-brand-${stat.color}/10 rounded-[10px]`}>
                <stat.icon className={`h-4 w-4 text-brand-${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-foreground tracking-tight">{stat.value}</div>
              <p className={`text-[13px] text-brand-${stat.color}/80 mt-2 font-semibold line-clamp-1`}>{stat.subtext}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mt-6">
        <FocusWidget />
        <div className="col-span-3 rounded-[20px] glass-card p-7 flex flex-col h-full border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold tracking-tight text-foreground">Recent Projects</h3>
            <Link href="/projects" className="text-sm text-muted-foreground hover:text-foreground font-semibold transition-colors">View all</Link>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                <p className="text-muted-foreground">No active projects.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.slice(0, 5).map((project) => (
                  <div key={project.id} className="flex items-center space-x-4 p-3.5 rounded-[14px] border border-transparent hover:border-white/10 hover:bg-secondary/40 transition-all duration-300 cursor-pointer group">
                    <div className="w-[46px] h-[46px] rounded-xl flex items-center justify-center shadow-inner relative overflow-hidden" style={{ backgroundColor: `${project.color}15` }}>
                      <div className="w-1.5 h-full absolute left-0 top-0 transition-transform duration-300 group-hover:scale-y-110" style={{ backgroundColor: project.color }} />
                      <FolderKanban className="h-5 w-5 opacity-80 group-hover:scale-110 transition-transform duration-300" style={{ color: project.color }} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[15px] font-bold text-foreground group-hover:text-primary transition-colors">{project.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 font-medium">{project.description || 'No description'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
