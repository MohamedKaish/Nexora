'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Target, CheckCircle2, XCircle, Trash2, Plus, RotateCcw, Edit2 } from 'lucide-react'
import { Database } from '@/types/database.types'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useGoalStore } from '@/store/useGoalStore'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

type Goal = Database['public']['Tables']['goals']['Row']

export function GoalsDashboard({ initialGoals }: { initialGoals: Goal[] }) {
  const { createNewGoal, updateGoalStatusOnly, updateGoalFields, removeGoalById } = useWorkspace()
  const { goals, setGoals } = useGoalStore()
  
  // Set initial goals on first load (but only if we don't have them in the store to avoid flashing local data)
  useEffect(() => {
    if (initialGoals && initialGoals.length > 0) {
      setGoals(initialGoals)
    }
  }, [initialGoals, setGoals])

  const [loading, setLoading] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  // Edit Goal state
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editType, setEditType] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const handleCreate = async () => {
    if (!newTitle.trim()) {
      toast.error('Please enter a goal title')
      return
    }
    setLoading(true)
    try {
      const today = new Date()
      const end = new Date()
      if (newType === 'weekly') {
        end.setDate(today.getDate() + 7)
      } else if (newType === 'monthly') {
        end.setMonth(today.getMonth() + 1)
      }

      await createNewGoal(
        newTitle.trim(),
        newType,
        today.toISOString().split('T')[0],
        end.toISOString().split('T')[0]
      )
      setNewTitle('')
      toast.success('Goal added')
    } catch (err: unknown) {
      console.error(err)
      const msg = err instanceof Error ? err.message : 'Failed to create goal'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id: string, status: 'active' | 'completed' | 'failed') => {
    try {
      await updateGoalStatusOnly(id, status)
      toast.success(`Goal marked as ${status}`)
    } catch (err: unknown) {
      console.error(err)
      toast.error('Failed to update goal status')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await removeGoalById(id)
      toast.success('Goal deleted')
    } catch (err: unknown) {
      console.error(err)
      toast.error('Failed to delete goal')
    }
  }

  const openEdit = (goal: Goal) => {
    setEditingGoal(goal)
    setEditTitle(goal.title)
    setEditType(goal.type)
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingGoal || !editTitle.trim()) {
      toast.error('Please enter a title')
      return
    }

    try {
      await updateGoalFields(editingGoal.id, {
        title: editTitle.trim(),
        type: editType,
      })
      toast.success('Goal updated')
      setIsEditDialogOpen(false)
    } catch (err: unknown) {
      console.error(err)
      const msg = err instanceof Error ? err.message : 'Failed to update goal'
      toast.error(msg)
    }
  }

  const renderGoalList = (type: 'daily' | 'weekly' | 'monthly') => {
    const list = goals.filter((g) => g.type === type)
    return (
      <div className="space-y-3">
        {list.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No {type} goals set.</p>
        ) : (
          list.map((g) => (
            <div
              key={g.id}
              className={`flex items-center justify-between p-3.5 rounded-[12px] border transition-all group ${
                g.status === 'completed'
                  ? 'bg-secondary/10 border-white/5 opacity-50 grayscale'
                  : g.status === 'failed'
                  ? 'bg-brand-rose/5 border-brand-rose/20 opacity-70'
                  : 'glass-card hover:bg-card/60 hover:border-white/10 shadow-sm'
              }`}
            >
              <div className="flex items-center space-x-3.5 flex-1 pr-2">
                {g.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-brand-emerald shrink-0" />}
                {g.status === 'failed' && <XCircle className="w-5 h-5 text-brand-rose shrink-0" />}
                {g.status === 'active' && <Target className="w-5 h-5 text-primary shrink-0" />}
                <span
                  className={`text-[14px] font-semibold tracking-tight transition-colors ${
                    g.status === 'completed'
                      ? 'line-through text-muted-foreground'
                      : 'text-foreground group-hover:text-primary'
                  }`}
                >
                  {g.title}
                </span>
              </div>

              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                {g.status === 'active' ? (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-brand-emerald hover:text-brand-emerald hover:bg-brand-emerald/10 rounded-[8px]"
                      onClick={() => handleUpdateStatus(g.id, 'completed')}
                      title="Mark as Completed"
                    >
                      <CheckCircle2 className="w-[18px] h-[18px]" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-brand-rose hover:text-brand-rose hover:bg-brand-rose/10 rounded-[8px]"
                      onClick={() => handleUpdateStatus(g.id, 'failed')}
                      title="Mark as Failed"
                    >
                      <XCircle className="w-[18px] h-[18px]" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-[8px]"
                      onClick={() => openEdit(g)}
                      title="Edit Goal"
                    >
                      <Edit2 className="w-[16px] h-[16px]" />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-[8px]"
                    onClick={() => handleUpdateStatus(g.id, 'active')}
                    title="Re-activate Goal"
                  >
                    <RotateCcw className="w-[16px] h-[16px]" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-brand-rose hover:bg-brand-rose/10 rounded-[8px]"
                  onClick={() => handleDelete(g.id)}
                  title="Delete Goal"
                >
                  <Trash2 className="w-[18px] h-[18px]" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Create Goal Form */}
      <Card className="glass-card border-white/5 shadow-sm max-w-4xl rounded-[20px]">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Input
              placeholder="What do you want to achieve?"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="flex-1 bg-secondary/30 border-white/5 focus:border-primary/50 transition-all duration-300 h-12 rounded-[14px] smooth-ring font-medium"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <Select
              value={newType}
              onValueChange={(v) => {
                if (v) setNewType(v as 'daily' | 'weekly' | 'monthly')
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px] h-12 bg-secondary/30 border-white/5 rounded-[14px] smooth-ring font-medium">
                <SelectValue placeholder="Goal Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily Goal</SelectItem>
                <SelectItem value="weekly">Weekly Goal</SelectItem>
                <SelectItem value="monthly">Monthly Goal</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleCreate}
              disabled={loading || !newTitle.trim()}
              className="w-full sm:w-auto h-12 px-8 shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] transition-all smooth-ring rounded-[14px] font-bold"
            >
              <Plus className="w-[18px] h-[18px] mr-2" /> Add Goal
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card border-brand-emerald/20 bg-brand-emerald/5 rounded-[20px]">
          <CardHeader className="pb-4 border-b border-white/5">
            <CardTitle className="flex items-center space-x-3 text-[16px] font-bold tracking-tight">
              <div className="p-2 bg-brand-emerald/10 rounded-[10px]">
                <Target className="w-5 h-5 text-brand-emerald" />
              </div>
              <span className="text-brand-emerald">Daily Goals</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">{renderGoalList('daily')}</CardContent>
        </Card>

        <Card className="glass-card border-brand-blue/20 bg-brand-blue/5 rounded-[20px]">
          <CardHeader className="pb-4 border-b border-white/5">
            <CardTitle className="flex items-center space-x-3 text-[16px] font-bold tracking-tight">
              <div className="p-2 bg-brand-blue/10 rounded-[10px]">
                <Target className="w-5 h-5 text-brand-blue" />
              </div>
              <span className="text-brand-blue">Weekly Goals</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">{renderGoalList('weekly')}</CardContent>
        </Card>

        <Card className="glass-card border-brand-purple/20 bg-brand-purple/5 rounded-[20px]">
          <CardHeader className="pb-4 border-b border-white/5">
            <CardTitle className="flex items-center space-x-3 text-[16px] font-bold tracking-tight">
              <div className="p-2 bg-brand-purple/10 rounded-[10px]">
                <Target className="w-5 h-5 text-brand-purple" />
              </div>
              <span className="text-brand-purple">Monthly Goals</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">{renderGoalList('monthly')}</CardContent>
        </Card>
      </div>

      {/* Edit Goal Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[440px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground font-bold text-lg">Edit Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-goal-title" className="text-foreground font-semibold">Goal Title</Label>
              <Input
                id="edit-goal-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Goal title"
                className="h-11 bg-secondary/30 border-white/10 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-goal-type" className="text-foreground font-semibold">Cadence</Label>
              <Select
                value={editType}
                onValueChange={(v) => v && setEditType(v as typeof editType)}
              >
                <SelectTrigger id="edit-goal-type" className="h-11 bg-secondary/30 border-white/10 rounded-xl">
                  <SelectValue placeholder="Goal Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily Goal</SelectItem>
                  <SelectItem value="weekly">Weekly Goal</SelectItem>
                  <SelectItem value="monthly">Monthly Goal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="rounded-xl border-white/10"
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} className="rounded-xl bg-primary text-primary-foreground">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
