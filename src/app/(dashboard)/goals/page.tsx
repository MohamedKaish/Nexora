'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Target, CheckCircle2, Trash2, Trophy } from 'lucide-react'
import { useGoalStore } from '@/store/useGoalStore'
import type { GoalType, GoalStatus } from '@/types/local'
import { format, addDays, addWeeks, addMonths } from 'date-fns'

const TYPE_CONFIG: Record<GoalType, { label: string; color: string; bg: string }> = {
  daily: { label: 'Daily', color: '#60A5FA', bg: 'rgba(96,165,250,0.08)' },
  weekly: { label: 'Weekly', color: '#A78BFA', bg: 'rgba(167,139,250,0.08)' },
  monthly: { label: 'Monthly', color: '#34D399', bg: 'rgba(52,211,153,0.08)' },
}

export default function GoalsPage() {
  const { goals, addGoal, updateGoal, removeGoal } = useGoalStore()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<GoalType>('weekly')

  const activeGoals = goals.filter(g => g.status === 'active' && !g.deletedAt)
  const completedGoals = goals.filter(g => g.status === 'completed')

  const handleCreate = () => {
    if (!newTitle.trim()) return
    const now = new Date()
    const periodEnd = newType === 'daily' ? addDays(now, 1) : newType === 'weekly' ? addWeeks(now, 1) : addMonths(now, 1)
    addGoal({
      title: newTitle.trim(),
      type: newType,
      periodStart: now.toISOString(),
      periodEnd: periodEnd.toISOString(),
    })
    setNewTitle(''); setNewType('weekly')
    setIsCreateOpen(false)
  }

  return (
    <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full space-y-5">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-gradient">Goals</h1>
          <p className="text-muted-foreground font-medium mt-1 text-sm">
            {activeGoals.length} active · {completedGoals.length} completed
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger render={<Button className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 font-semibold gap-1.5 cursor-pointer shadow-sm" />}>
            <Plus className="w-4 h-4" /> New Goal
          </DialogTrigger>
          <DialogContent className="rounded-2xl world-glass border-border/20">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Set a Goal</DialogTitle>
              <DialogDescription>Define what you want to achieve.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <Input
                placeholder="What's your goal?"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                autoFocus
                className="rounded-xl bg-background/60 border-border/30"
              />
              <Select value={newType} onValueChange={v => setNewType(v as GoalType)}>
                <SelectTrigger className="rounded-xl bg-background/60 border-border/30"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['daily', 'weekly', 'monthly'] as GoalType[]).map(t => (
                    <SelectItem key={t} value={t}>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_CONFIG[t].color }} />
                        {TYPE_CONFIG[t].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 cursor-pointer font-semibold">
                Create Goal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {activeGoals.length === 0 && completedGoals.length === 0 ? (
        <div className="empty-world rounded-3xl py-16 text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-emerald/5 flex items-center justify-center mb-4">
            <Target className="w-6 h-6 text-brand-emerald/30" />
          </div>
          <h3 className="text-base font-bold text-foreground">No goals yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Set goals to track your progress over time.</p>
          <Button onClick={() => setIsCreateOpen(true)} variant="outline" className="rounded-xl cursor-pointer font-semibold gap-1.5">
            <Plus className="w-4 h-4" /> Set a Goal
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Goals */}
          {activeGoals.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Active Goals</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {activeGoals.map(goal => {
                  const tc = TYPE_CONFIG[goal.type] || TYPE_CONFIG.weekly
                  return (
                    <div key={goal.id} className="group world-card p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 p-2 rounded-xl" style={{ backgroundColor: tc.bg }}>
                            <Target className="w-4 h-4" style={{ color: tc.color }} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">{goal.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md" style={{ backgroundColor: tc.bg, color: tc.color }}>
                                {tc.label}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => updateGoal(goal.id, { status: 'completed' })} className="p-1.5 rounded-lg hover:bg-brand-emerald/10 cursor-pointer" aria-label="Complete">
                            <CheckCircle2 className="w-3.5 h-3.5 text-brand-emerald" />
                          </button>
                          <button onClick={() => removeGoal(goal.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 cursor-pointer" aria-label="Delete">
                            <Trash2 className="w-3.5 h-3.5 text-destructive/60" />
                          </button>
                        </div>
                      </div>
                      {goal.progress !== undefined && (
                        <div className="mt-3">
                          <div className="w-full h-1.5 rounded-full bg-border/30 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${goal.progress}%`, backgroundColor: tc.color }} />
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1 font-medium">{goal.progress}% complete</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Completed Goals */}
          {completedGoals.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Completed</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {completedGoals.map(goal => (
                  <div key={goal.id} className="world-card p-4 opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-brand-emerald/8">
                        <Trophy className="w-4 h-4 text-brand-emerald" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold line-through text-muted-foreground">{goal.title}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{goal.type}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
