'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, ListTodo, FolderKanban, Flame, Lock } from 'lucide-react'
import { FocusWidget } from '@/features/dashboard/components/FocusWidget'

export function GuestDashboardView() {
  const [guestName, setGuestName] = useState<string | null>(null)
  const [greeting, setGreeting] = useState('Welcome')

  useEffect(() => {
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
          <p className="text-muted-foreground text-lg font-medium">Here is a preview of your workspace.</p>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/register">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] transition-all smooth-ring h-10 px-5 rounded-[12px] font-semibold text-[14px]">
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
            You are currently exploring Nexora as a guest. To create projects, manage tasks, and sync your data across devices, please <Link href="/register" className="underline hover:text-brand-blue font-semibold">create an account or sign in</Link>.
          </p>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-8 opacity-75">
        {[
          { label: 'Tasks Today', icon: ListTodo, value: 0, subtext: '0 remaining', color: 'blue' },
          { label: 'Completed', icon: CheckCircle2, value: 0, subtext: 'Great job!', color: 'emerald' },
          { label: 'Active Projects', icon: FolderKanban, value: 0, subtext: 'In progress', color: 'purple' },
          { label: 'Habit Streak', icon: Flame, value: '0 days', subtext: 'No habits', color: 'amber' },
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
        <Card className="col-span-3 glass-card border-white/5 rounded-[20px] flex items-center justify-center min-h-[300px]">
          <div className="text-center space-y-3 p-6">
            <FolderKanban className="w-10 h-10 text-muted-foreground mx-auto opacity-50" />
            <h3 className="font-semibold text-foreground">Recent Projects</h3>
            <p className="text-sm text-muted-foreground">Sign in to start organizing your projects and tracking progress.</p>
            <Link href="/register">
              <Button variant="outline" className="mt-2 bg-secondary/40 border-white/5">Create Account</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
