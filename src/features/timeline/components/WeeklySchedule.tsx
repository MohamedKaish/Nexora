'use client'

import { useState } from 'react'
import { Database } from '@/types/database.types'
import { Button } from '@/components/ui/button'
import { Trash2, Edit2 } from 'lucide-react'
import { deleteTimetableSlot } from '../timetable-actions'
import { EditSlotDialog } from './EditSlotDialog'
import { toast } from 'sonner'

type Slot = Database['public']['Tables']['timetable_slots']['Row']

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface WeeklyScheduleProps {
  initialSlots?: Slot[]
  slots?: Slot[]
  onSlotsChange?: (slots: Slot[]) => void
}

export function WeeklySchedule({
  initialSlots = [],
  slots: controlledSlots,
  onSlotsChange,
}: WeeklyScheduleProps) {
  const [internalSlots, setInternalSlots] = useState<Slot[]>(controlledSlots || initialSlots)
  const [selectedSlotForEdit, setSelectedSlotForEdit] = useState<Slot | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const slots = controlledSlots || internalSlots

  const updateSlots = (newSlots: Slot[]) => {
    setInternalSlots(newSlots)
    if (onSlotsChange) {
      onSlotsChange(newSlots)
    }
  }

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const previousSlots = [...slots]
    updateSlots(slots.filter((s) => s.id !== id))
    try {
      await deleteTimetableSlot(id)
      toast.success('Time block removed')
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete time block')
      updateSlots(previousSlots)
    }
  }

  const handleSlotUpdated = (updated: Slot) => {
    updateSlots(slots.map((s) => (s.id === updated.id ? updated : s)))
  }

  const handleSlotDeleted = (id: string) => {
    updateSlots(slots.filter((s) => s.id !== id))
  }

  const handleSlotClick = (slot: Slot) => {
    setSelectedSlotForEdit(slot)
    setEditDialogOpen(true)
  }

  // Monday = 1, Tuesday = 2, ..., Saturday = 6, Sunday = 0
  const getDayOfWeek = (dayIdx: number) => (dayIdx === 6 ? 0 : dayIdx + 1)

  // 7am to 9pm (15 hours)
  const hours = Array.from({ length: 15 }, (_, i) => i + 7)

  return (
    <>
      <div className="world-card overflow-hidden overflow-x-auto shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="min-w-[800px]">
          {/* Header */}
          <div className="grid grid-cols-8 border-b border-border/40 bg-foreground/[0.02]">
            <div className="p-4 border-r border-border/20 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/80 text-center flex items-center justify-center">
              Time
            </div>
            {DAYS.map((day) => (
              <div
                key={day}
                className="p-4 border-r border-border/20 last:border-r-0 text-sm font-bold text-foreground text-center"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="relative">
            {hours.map((hour) => (
              <div
                key={hour}
                className="grid grid-cols-8 border-b border-border/20 last:border-b-0 h-16 group/row hover:bg-foreground/[0.02] transition-colors duration-300"
              >
                <div className="border-r border-border/20 p-2 text-xs font-medium text-muted-foreground text-right relative flex items-start justify-end">
                  <span className="absolute -top-2.5 right-3 bg-card px-2 py-0.5 rounded-md text-[10px] uppercase tracking-widest shadow-sm border border-border/30 z-10 font-bold">
                    {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                  </span>
                </div>
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className="border-r border-border/20 last:border-r-0 relative border-dashed opacity-30"
                  />
                ))}
              </div>
            ))}

            {/* Slots Absolute Overlay */}
            <div className="absolute inset-0 grid grid-cols-8 pointer-events-none">
              <div className="border-r border-transparent pointer-events-auto" />
              {DAYS.map((day, dayIdx) => {
                const targetDayOfWeek = getDayOfWeek(dayIdx)
                const daySlots = slots.filter((s) => s.day_of_week === targetDayOfWeek)
                return (
                  <div key={day} className="relative border-r border-transparent last:border-r-0 pointer-events-auto">
                    {daySlots.map((slot) => {
                      const [startHour, startMin] = slot.start_time.split(':').map(Number)
                      const [endHour, endMin] = slot.end_time.split(':').map(Number)

                      const startPos = Math.max(0, startHour - 7 + startMin / 60)
                      const duration = endHour + endMin / 60 - (startHour + startMin / 60)

                      if (startPos < 0 || startPos >= 15 || duration <= 0) return null

                      return (
                        <div
                          key={slot.id}
                          onClick={() => handleSlotClick(slot)}
                          className="absolute w-[92%] left-[4%] rounded-xl p-2.5 text-xs overflow-hidden shadow-sm transition-all duration-300 hover:scale-[1.03] hover:shadow-md hover:z-20 group border border-white/10 cursor-pointer backdrop-blur-md"
                          style={{
                            top: `${startPos * 64 + 2}px`,
                            height: `${Math.max(28, duration * 64 - 4)}px`,
                            backgroundColor: slot.color || 'var(--color-brand-blue)',
                            color: '#fff',
                            backgroundImage:
                              'linear-gradient(to bottom right, rgba(255,255,255,0.15), transparent)',
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-bold tracking-tight truncate pr-2 text-xs drop-shadow-sm">
                              {slot.label}
                            </div>
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSlotClick(slot)
                                }}
                                className="h-6 w-6 text-white/90 hover:text-white hover:bg-black/30 rounded-full transition-all bg-black/10 backdrop-blur-sm"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => handleDelete(slot.id, e)}
                                className="h-6 w-6 text-white/90 hover:text-red-400 hover:bg-black/30 rounded-full transition-all bg-black/10 backdrop-blur-sm"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          <div className="opacity-90 font-medium tracking-wide drop-shadow-sm mt-0.5 text-[10px]">
                            {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <EditSlotDialog
        slot={selectedSlotForEdit}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSlotUpdated={handleSlotUpdated}
        onSlotDeleted={handleSlotDeleted}
      />
    </>
  )
}
