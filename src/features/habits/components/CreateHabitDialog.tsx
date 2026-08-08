'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { createHabit } from '../actions'
import { toast } from 'sonner'
import { useHabitStore } from '@/store/useHabitStore'

export function CreateHabitDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'weekdays'>('daily')
  const [color, setColor] = useState('#3b82f6')
  const [loading, setLoading] = useState(false)
  
  const addHabit = useHabitStore((state) => state.addHabit)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      const newHabit = await createHabit(name, frequency, color)
      // Update local store via sync store integration
      if (newHabit) {
        addHabit(newHabit)
      }
      toast.success('Habit created successfully')
      setOpen(false)
      setName('')
      setFrequency('daily')
      setColor('#3b82f6')
    } catch (err) {
      console.error(err)
      toast.error('Failed to create habit')
    } finally {
      setLoading(false)
    }
  }

  const colors = [
    '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', 
    '#ec4899', '#06b6d4', '#84cc16'
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] transition-all smooth-ring h-10 px-5 rounded-[12px] font-semibold text-[14px]">
            <Plus className="mr-2 h-4 w-4" /> New Habit
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-foreground">Create New Habit</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Define a new habit you want to build consistency with.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-6">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-foreground">Habit Name</Label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Morning Meditation"
                className="flex h-11 w-full rounded-md border border-border/80 bg-card/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              />
            </div>
            
            <div className="grid gap-3">
              <Label className="text-foreground">Frequency</Label>
              <RadioGroup value={frequency} onValueChange={(v: 'daily' | 'weekly' | 'weekdays') => setFrequency(v)} className="flex flex-col space-y-1">
                <div className="flex items-center space-x-3 bg-secondary/30 p-2.5 rounded-lg border border-border/40 hover:bg-secondary/50 transition-colors">
                  <RadioGroupItem value="daily" id="daily" />
                  <Label htmlFor="daily" className="font-medium cursor-pointer flex-1">Every Day</Label>
                </div>
                <div className="flex items-center space-x-3 bg-secondary/30 p-2.5 rounded-lg border border-border/40 hover:bg-secondary/50 transition-colors">
                  <RadioGroupItem value="weekdays" id="weekdays" />
                  <Label htmlFor="weekdays" className="font-medium cursor-pointer flex-1">Weekdays Only (Mon-Fri)</Label>
                </div>
                <div className="flex items-center space-x-3 bg-secondary/30 p-2.5 rounded-lg border border-border/40 hover:bg-secondary/50 transition-colors">
                  <RadioGroupItem value="weekly" id="weekly" />
                  <Label htmlFor="weekly" className="font-medium cursor-pointer flex-1">Once a Week</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid gap-3">
              <Label className="text-foreground">Color</Label>
              <div className="flex gap-3">
                {colors.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-all ring-offset-2 ring-offset-background ${color === c ? 'ring-2 ring-primary scale-110' : 'hover:scale-110'}`}
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
              {loading ? 'Creating...' : 'Create Habit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
