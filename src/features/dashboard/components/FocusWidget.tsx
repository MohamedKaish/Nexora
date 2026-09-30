'use client'

import { useTaskStore } from '@/store/useTaskStore'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { isToday, parseISO } from 'date-fns'
import { useState, useEffect } from 'react'

export function FocusWidget() {
  const [mounted, setMounted] = useState(false)
  const tasks = useTaskStore(s => s.tasks)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="col-span-4 rounded-[20px] glass-card p-7 flex flex-col h-full border-white/5 animate-pulse min-h-[300px]">
        <div className="h-8 bg-secondary/30 rounded-lg w-48 mb-6" />
        <div className="flex-1 bg-secondary/20 rounded-xl" />
      </div>
    )
  }

  const todayTasks = tasks.filter(t => {
    const rawT = t as unknown as Record<string, unknown>
    if (t.dueDate || rawT.due_date) {
      const d = (t.dueDate || rawT.due_date) as string
      try { return isToday(parseISO(d)) } catch { return false }
    }
    return false
  }).sort((a, b) => {
    if (a.priority === 'urgent' && b.priority !== 'urgent') return -1
    if (b.priority === 'urgent' && a.priority !== 'urgent') return 1
    return 0
  })

  return (
    <div className="col-span-4 rounded-[20px] glass-card p-7 flex flex-col h-full border-white/5 min-h-[300px]">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h3 className="text-xl font-bold tracking-tight text-foreground">Today&apos;s Focus</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-pulse"></span>
            Kyro Recommended
          </p>
        </div>
        <Link href="/tasks" className="text-sm text-primary hover:text-primary/80 font-semibold transition-colors bg-primary/10 hover:bg-primary/15 px-4 py-1.5 rounded-full">View all</Link>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {todayTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[160px] text-center border-2 border-dashed border-border/60 rounded-xl">
            <div className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center mb-3">
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">No tasks scheduled for today.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayTasks.map(task => (
              <div key={task.id} className="flex items-center justify-between p-4 rounded-[14px] border border-white/5 bg-secondary/30 hover:bg-secondary/60 hover:border-white/10 transition-all duration-300 group shadow-sm">
                <div className="flex items-center space-x-4">
                  <Checkbox checked={task.status === 'done'} disabled className="h-[22px] w-[22px] rounded-md border-muted-foreground/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all duration-300" />
                  <span className={`text-[15px] font-semibold transition-colors duration-300 ${task.status === 'done' ? 'line-through text-muted-foreground/60' : 'text-foreground group-hover:text-primary'}`}>
                    {task.title}
                  </span>
                </div>
                {task.priority === 'urgent' && <Badge variant="destructive" className="bg-brand-rose/10 text-brand-rose hover:bg-brand-rose/20 border-brand-rose/20 text-[11px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full">Urgent</Badge>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
