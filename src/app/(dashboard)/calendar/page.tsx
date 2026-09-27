import { getTasks } from '@/features/tasks/actions'
import { getProjects } from '@/features/projects/actions'
import { getCalendarEvents } from '@/features/timeline/actions'
import { getTimetableSlots } from '@/features/timeline/timetable-actions'
import { getHabits } from '@/features/habits/actions'
import { FullCalendarView } from '@/features/timeline/components/FullCalendarWrapper'

export const metadata = {
  title: 'Calendar - Nexora',
}

import { Suspense } from 'react'

async function CalendarContent() {
  const [tasks, projects, events, timetableSlots, habits] = await Promise.all([
    getTasks(),
    getProjects(),
    getCalendarEvents(),
    getTimetableSlots(),
    getHabits()
  ])

  return (
    <FullCalendarView 
      tasks={tasks} 
      projects={projects} 
      events={events} 
      timetableSlots={timetableSlots}
      habits={habits}
    />
  )
}

export default function CalendarPage() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between space-y-5 md:space-y-0 mb-8">
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tight text-foreground">Calendar</h2>
          <p className="text-muted-foreground text-lg font-medium">Schedule your time and manage deadlines.</p>
        </div>
      </div>
      
      <div className="mt-6 w-full relative z-0">
        <Suspense fallback={<div className="animate-pulse h-[800px] w-full bg-secondary/30 rounded-2xl" />}>
          <CalendarContent />
        </Suspense>
      </div>
    </div>
  )
}
