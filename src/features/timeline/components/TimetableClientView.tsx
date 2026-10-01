'use client'

import { useState } from 'react'
import { Database } from '@/types/database.types'
import { WeeklySchedule } from './WeeklySchedule'
import { CreateSlotDialog } from './CreateSlotDialog'
import { CalendarDays } from 'lucide-react'

type Slot = Database['public']['Tables']['timetable_slots']['Row']

interface TimetableClientViewProps {
  initialSlots: Slot[]
}

export function TimetableClientView({ initialSlots }: TimetableClientViewProps) {
  const [slots, setSlots] = useState<Slot[]>(initialSlots)

  const handleSlotCreated = (newSlot: Slot) => {
    setSlots((prev) => [...prev, newSlot])
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between space-y-5 md:space-y-0 mb-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
            <CalendarDays className="h-8 w-8 text-accent" />
            Weekly Timetable
          </h2>
          <p className="text-muted-foreground text-lg font-medium">
            Design your ideal week and time block your focus sessions.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <CreateSlotDialog onSlotCreated={handleSlotCreated} />
        </div>
      </div>

      <div className="mt-8 flex-1">
        <WeeklySchedule slots={slots} onSlotsChange={setSlots} />
      </div>
    </div>
  )
}
