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
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createTimetableSlot } from '../timetable-actions'
import { toast } from 'sonner'
import { Database } from '@/types/database.types'

type Slot = Database['public']['Tables']['timetable_slots']['Row']

const COLOR_PRESETS = [
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Rose', value: '#EF4444' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Cyan', value: '#06B6D4' },
]

const DAYS_OPTIONS = [
  { label: 'Monday', value: '1' },
  { label: 'Tuesday', value: '2' },
  { label: 'Wednesday', value: '3' },
  { label: 'Thursday', value: '4' },
  { label: 'Friday', value: '5' },
  { label: 'Saturday', value: '6' },
  { label: 'Sunday', value: '0' },
]

interface CreateSlotDialogProps {
  onSlotCreated?: (slot: Slot) => void
  trigger?: React.ReactNode
}

export function CreateSlotDialog({ onSlotCreated, trigger }: CreateSlotDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [label, setLabel] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState('1') // Monday
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:30')
  const [color, setColor] = useState('#6366F1')

  const resetForm = () => {
    setLabel('')
    setDayOfWeek('1')
    setStartTime('09:00')
    setEndTime('10:30')
    setColor('#6366F1')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim()) {
      toast.error('Please enter a label for the time block')
      return
    }

    if (startTime >= endTime) {
      toast.error('End time must be after start time')
      return
    }

    setLoading(true)
    try {
      const formattedStart = startTime.length === 5 ? `${startTime}:00` : startTime
      const formattedEnd = endTime.length === 5 ? `${endTime}:00` : endTime
      const day = parseInt(dayOfWeek, 10)

      const newSlot = await createTimetableSlot({
        label: label.trim(),
        day_of_week: day,
        start_time: formattedStart,
        end_time: formattedEnd,
        color,
      })

      toast.success('Time block added to timetable')
      if (onSlotCreated && newSlot) {
        onSlotCreated(newSlot)
      }
      resetForm()
      setOpen(false)
    } catch (err: unknown) {
      console.error(err)
      const msg = err instanceof Error ? err.message : 'Failed to create time block'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)} className="inline-block cursor-pointer">
          {trigger}
        </div>
      ) : (
        <Button
          onClick={() => setOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] transition-all smooth-ring h-10 px-5 rounded-[12px] font-semibold text-[14px]"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Time Block
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[480px] bg-card border-border">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-foreground text-xl font-bold">Add Weekly Time Block</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Block out recurring time in your ideal weekly timetable.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-5 py-5">
              <div className="space-y-2">
                <Label htmlFor="slot-label" className="text-foreground font-semibold">Block Label</Label>
                <Input
                  id="slot-label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Deep Work, Gym, Strategy Sync"
                  className="h-11 bg-secondary/30 border-white/10 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slot-day" className="text-foreground font-semibold">Day of Week</Label>
                <Select value={dayOfWeek} onValueChange={(val) => val && setDayOfWeek(val)}>
                  <SelectTrigger id="slot-day" className="h-11 bg-secondary/30 border-white/10 rounded-xl">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OPTIONS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="slot-start" className="text-foreground font-semibold">Start Time</Label>
                  <Input
                    id="slot-start"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="h-11 bg-secondary/30 border-white/10 rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slot-end" className="text-foreground font-semibold">End Time</Label>
                  <Input
                    id="slot-end"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="h-11 bg-secondary/30 border-white/10 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <Label className="text-foreground font-semibold">Color Theme</Label>
                <div className="flex items-center gap-3">
                  {COLOR_PRESETS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      title={p.name}
                      onClick={() => setColor(p.value)}
                      className={`w-7 h-7 rounded-full transition-all ring-offset-2 ring-offset-background ${
                        color === p.value ? 'ring-2 ring-primary scale-110' : 'hover:scale-110 opacity-80'
                      }`}
                      style={{ backgroundColor: p.value }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="border-white/10 hover:bg-secondary/40 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !label.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-semibold px-5"
              >
                {loading ? 'Adding...' : 'Add Block'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
