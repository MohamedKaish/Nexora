'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { updateHabit } from '../actions'
import { toast } from 'sonner'
import { useHabitStore, Habit } from '@/store/useHabitStore'

interface EditHabitDialogProps {
  habit: Habit | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onHabitUpdated?: (updated: Habit) => void
}

const COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
  '#ec4899', '#06b6d4', '#84cc16'
]

function EditHabitForm({
  habit,
  onOpenChange,
  onHabitUpdated,
}: {
  habit: Habit
  onOpenChange: (open: boolean) => void
  onHabitUpdated?: (updated: Habit) => void
}) {
  const [name, setName] = useState(habit.name || '')
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'weekdays'>(habit.frequency || 'daily')
  const [color, setColor] = useState(habit.color || '#3b82f6')
  const [loading, setLoading] = useState(false)

  const updateStoreHabit = useHabitStore((state) => state.updateHabit)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Habit name is required')
      return
    }

    setLoading(true)
    try {
      const updated = await updateHabit(habit.id, {
        name: name.trim(),
        frequency,
        color,
      })

      if (updated) {
        updateStoreHabit(habit.id, updated as Habit)
        if (onHabitUpdated) {
          onHabitUpdated(updated as Habit)
        }
      }
      toast.success('Habit updated successfully')
      onOpenChange(false)
    } catch (err: unknown) {
      console.error(err)
      const msg = err instanceof Error ? err.message : 'Failed to update habit'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle className="text-foreground">Edit Habit</DialogTitle>
        <DialogDescription className="text-muted-foreground">
          Modify the details or cadence of this habit.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-6 py-6">
        <div className="grid gap-2">
          <Label htmlFor="edit-habit-name" className="text-foreground">Habit Name</Label>
          <input
            id="edit-habit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Morning Meditation"
            className="flex h-11 w-full rounded-md border border-border/80 bg-card/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            required
          />
        </div>

        <div className="grid gap-3">
          <Label className="text-foreground">Frequency</Label>
          <RadioGroup
            value={frequency}
            onValueChange={(v: 'daily' | 'weekly' | 'weekdays') => setFrequency(v)}
            className="flex flex-col space-y-1"
          >
            <div className="flex items-center space-x-3 bg-secondary/30 p-2.5 rounded-lg border border-border/40 hover:bg-secondary/50 transition-colors">
              <RadioGroupItem value="daily" id="edit-daily" />
              <Label htmlFor="edit-daily" className="font-medium cursor-pointer flex-1">Every Day</Label>
            </div>
            <div className="flex items-center space-x-3 bg-secondary/30 p-2.5 rounded-lg border border-border/40 hover:bg-secondary/50 transition-colors">
              <RadioGroupItem value="weekdays" id="edit-weekdays" />
              <Label htmlFor="edit-weekdays" className="font-medium cursor-pointer flex-1">Weekdays Only (Mon-Fri)</Label>
            </div>
            <div className="flex items-center space-x-3 bg-secondary/30 p-2.5 rounded-lg border border-border/40 hover:bg-secondary/50 transition-colors">
              <RadioGroupItem value="weekly" id="edit-weekly" />
              <Label htmlFor="edit-weekly" className="font-medium cursor-pointer flex-1">Once a Week</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="grid gap-3">
          <Label className="text-foreground">Color</Label>
          <div className="flex gap-3">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full transition-all ring-offset-2 ring-offset-background ${
                  color === c ? 'ring-2 ring-primary scale-110' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button
          type="submit"
          disabled={loading || !name.trim()}
          className="bg-primary text-primary-foreground hover:bg-primary/90 w-full"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function EditHabitDialog({
  habit,
  open,
  onOpenChange,
  onHabitUpdated,
}: EditHabitDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        {habit && (
          <EditHabitForm
            key={habit.id}
            habit={habit}
            onOpenChange={onOpenChange}
            onHabitUpdated={onHabitUpdated}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
