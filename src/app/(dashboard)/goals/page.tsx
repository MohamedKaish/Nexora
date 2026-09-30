'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Target, CheckCircle2, Trash2 } from 'lucide-react'
import { useGoalStore } from '@/store/useGoalStore'
import type { GoalType, GoalStatus } from '@/types/local'
import { format, addDays, addWeeks, addMonths } from 'date-fns'

const TYPE_LABELS: Record<GoalType, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' }
const STATUS_COLORS: Record<GoalStatus, string> = { active: '#3B82F6', completed: '#10B981', failed: '#EF4444' }

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
    <div className="flex-1 p-6 md:p-8 max-w-5xl mx-auto w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight">Goals</h1>
          <p className="text-muted-foreground font-medium mt-1">{activeGoals.length} active · {completedGoals.length} completed</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger render={<Button className="rounded-xl bg-accent text-white hover:bg-accent/90 font-medium gap-1.5 cursor-pointer" />}>
            <Plus className="w-4 h-4" /> New Goal
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Set a Goal</DialogTitle>
              <DialogDescription>Define what you want to achieve.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <Input placeholder="What's your goal?" value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} autoFocus className="rounded-xl" />
              <Select value={newType} onValueChange={v => setNewType(v as GoalType)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['daily','weekly','monthly'] as GoalType[]).map(t => (
                    <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} className="rounded-xl bg-accent text-white hover:bg-accent/90 cursor-pointer">Create Goal</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {activeGoals.length === 0 && completedGoals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Target className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold">No goals yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Set goals to track your progress.</p>
          <Button onClick={() => setIsCreateOpen(true)} variant="outline" className="rounded-xl cursor-pointer">
            <Plus className="w-4 h-4 mr-1.5" /> Set a Goal
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {activeGoals.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Active Goals</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {activeGoals.map(goal => (
                  <Card key={goal.id} className="border-border/40 bg-card/60 rounded-2xl group">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 p-2 rounded-xl bg-accent/10">
                            <Target className="w-4 h-4 text-accent" />
                          </div>
                          <div>
                            <p className="text-sm font-bold">{goal.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 capitalize">{goal.type} goal</p>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => updateGoal(goal.id, { status: 'completed' })} className="p-1.5 rounded-lg hover:bg-emerald-500/10 cursor-pointer" aria-label="Complete">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          </button>
                          <button onClick={() => removeGoal(goal.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 cursor-pointer" aria-label="Delete">
                            <Trash2 className="w-3.5 h-3.5 text-destructive/70" />
                          </button>
                        </div>
                      </div>
                      {goal.progress !== undefined && (
                        <div className="mt-3">
                          <div className="w-full h-1.5 rounded-full bg-secondary/40 overflow-hidden">
                            <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${goal.progress}%` }} />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{goal.progress}% complete</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {completedGoals.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Completed</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {completedGoals.map(goal => (
                  <Card key={goal.id} className="border-border/30 bg-card/30 rounded-2xl opacity-60">
                    <CardContent className="p-4 flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold line-through">{goal.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{goal.type}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
