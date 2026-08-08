'use client'

import { useState } from 'react'
import { Database } from '@/types/database.types'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { deleteTimetableSlot } from '../timetable-actions'

type Slot = Database['public']['Tables']['timetable_slots']['Row']

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function WeeklySchedule({ initialSlots }: { initialSlots: Slot[] }) {
  const [slots, setSlots] = useState<Slot[]>(initialSlots)

  const handleDelete = async (id: string) => {
    setSlots(slots.filter(s => s.id !== id))
    try {
      await deleteTimetableSlot(id)
    } catch (err) {
      console.error(err)
      window.location.reload()
    }
  }

  // A very simple visual grid implementation
  const hours = Array.from({ length: 15 }, (_, i) => i + 7) // 7am to 9pm

  return (
    <div className="glass-card border-white/5 rounded-[24px] overflow-hidden overflow-x-auto shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="grid grid-cols-8 border-b border-white/10 bg-secondary/30 backdrop-blur-sm">
          <div className="p-4 border-r border-white/5 text-[11px] uppercase tracking-widest font-bold text-muted-foreground/80 text-center flex items-center justify-center">Time</div>
          {DAYS.map((day) => (
            <div key={day} className="p-4 border-r border-white/5 last:border-r-0 text-[14px] font-bold text-foreground text-center">
              {day}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="relative">
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b border-white/5 last:border-b-0 h-16 group/row hover:bg-secondary/20 transition-colors duration-300">
              <div className="border-r border-white/5 p-2 text-xs font-medium text-muted-foreground text-right relative flex items-start justify-end">
                <span className="absolute -top-2.5 right-3 bg-background px-2 py-0.5 rounded-[6px] text-[10px] uppercase tracking-wider shadow-sm border border-white/10 z-10 font-bold">
                  {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                </span>
              </div>
              {DAYS.map((day) => (
                <div key={day} className="border-r border-white/5 last:border-r-0 relative border-dashed opacity-30" />
              ))}
            </div>
          ))}

          {/* Slots Absolute Overlay */}
          <div className="absolute inset-0 grid grid-cols-8 pointer-events-none">
            <div className="border-r border-transparent pointer-events-auto" />
            {DAYS.map((day, dayIdx) => {
              const daySlots = slots.filter(s => s.day_of_week === dayIdx + 1)
              return (
                <div key={day} className="relative border-r last:border-r-0 pointer-events-auto">
                  {daySlots.map(slot => {
                    const [startHour, startMin] = slot.start_time.split(':').map(Number)
                    const [endHour, endMin] = slot.end_time.split(':').map(Number)
                    
                    const startPos = Math.max(0, (startHour - 7) + startMin / 60)
                    const duration = (endHour + endMin / 60) - (startHour + startMin / 60)
                    
                    if (startPos < 0 || startPos >= 15) return null

                    return (
                      <div 
                        key={slot.id}
                        className="absolute w-[92%] left-[4%] rounded-xl p-2.5 text-xs overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_8px_20px_rgba(0,0,0,0.3)] hover:z-20 group border border-white/10"
                        style={{
                          top: `${startPos * 64 + 2}px`, // +2 for slight padding from top border
                          height: `${duration * 64 - 4}px`, // -4 for padding
                          backgroundColor: slot.color,
                          color: '#fff',
                          backgroundImage: 'linear-gradient(to bottom right, rgba(255,255,255,0.1), transparent)'
                        }}
                      >
                        <div className="font-bold tracking-tight truncate pr-5 text-[13px] drop-shadow-sm">{slot.label}</div>
                        <div className="opacity-90 font-medium tracking-wide drop-shadow-sm mt-0.5">{slot.start_time.substring(0,5)} - {slot.end_time.substring(0,5)}</div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(slot.id)}
                          className="absolute top-1.5 right-1.5 h-6 w-6 opacity-0 group-hover:opacity-100 text-white/90 hover:text-white hover:bg-black/30 rounded-full transition-all bg-black/10 backdrop-blur-sm"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
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
  )
}
