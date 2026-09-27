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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateTimetableSlot, deleteTimetableSlot } from '../timetable-actions'
import { toast } from 'sonner'
import { Database } from '@/types/database.types'
import { Trash2 } from 'lucide-react'

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

interface EditSlotDialogProps {
  slot: Slot | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSlotUpdated: (slot: Slot) => void
  onSlotDeleted: (id: string) => void
}

function EditSlotForm({
  slot,
  onOpenChange,
  onSlotUpdated,
  onSlotDeleted,
}: {
  slot: Slot
  onOpenChange: (open: boolean) => void
  onSlotUpdated: (slot: Slot) => void
  onSlotDeleted: (id: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const [label, setLabel] = useState(slot.label)
  const [dayOfWeek, setDayOfWeek] = useState(String(slot.day_of_week))
  const [startTime, setStartTime] = useState(slot.start_time.substring(0, 5))
  const [endTime, setEndTime] = useState(slot.end_time.substring(0, 5))
  const [color, setColor] = useState(slot.color)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim()) {
      toast.error('Please enter a label')
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

      const updated = await updateTimetableSlot(slot.id, {
        label: label.trim(),
        day_of_week: day,
        start_time: formattedStart,
        end_time: formattedEnd,
        color,
      })

      toast.success('Time block updated')
      if (updated) {
        onSlotUpdated(updated)
      }
      onOpenChange(false)
    } catch (err: unknown) {
      console.error(err)
      const msg = err instanceof Error ? err.message : 'Failed to update time block'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      await deleteTimetableSlot(slot.id)
      toast.success('Time block deleted')
      onSlotDeleted(slot.id)
      onOpenChange(false)
    } catch (err: unknown) {
      console.error(err)
      const msg = err instanceof Error ? err.message : 'Failed to delete time block'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleUpdate}>
      <DialogHeader>
        <DialogTitle className="text-foreground text-xl font-bold">Edit Time Block</DialogTitle>
        <DialogDescription className="text-muted-foreground">
          Update details or reschedule this weekly block.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-5 py-5">
        <div className="space-y-2">
          <Label htmlFor="edit-slot-label" className="text-foreground font-semibold">Block Label</Label>
          <Input
            id="edit-slot-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Deep Work, Gym"
            className="h-11 bg-secondary/30 border-white/10 rounded-xl"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-slot-day" className="text-foreground font-semibold">Day of Week</Label>
          <Select value={dayOfWeek} onValueChange={(val) => val && setDayOfWeek(val)}>
            <SelectTrigger id="edit-slot-day" className="h-11 bg-secondary/30 border-white/10 rounded-xl">
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
            <Label htmlFor="edit-slot-start" className="text-foreground font-semibold">Start Time</Label>
            <Input
              id="edit-slot-start"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="h-11 bg-secondary/30 border-white/10 rounded-xl"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-slot-end" className="text-foreground font-semibold">End Time</Label>
            <Input
              id="edit-slot-end"
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

      <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
        <Button
          type="button"
          variant="ghost"
          onClick={handleDelete}
          disabled={loading}
          className="text-brand-rose hover:text-brand-rose hover:bg-brand-rose/10 rounded-xl"
        >
          <Trash2 className="w-4 h-4 mr-1.5" /> Delete
        </Button>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/10 hover:bg-secondary/40 rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !label.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-semibold px-5"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogFooter>
    </form>
  )
}

export function EditSlotDialog({
  slot,
  open,
  onOpenChange,
  onSlotUpdated,
  onSlotDeleted,
}: EditSlotDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-card border-border">
        {slot && (
          <EditSlotForm
            key={slot.id}
            slot={slot}
            onOpenChange={onOpenChange}
            onSlotUpdated={onSlotUpdated}
            onSlotDeleted={onSlotDeleted}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
