import { getTasks } from '@/features/tasks/actions'
import { getProjects } from '@/features/projects/actions'
import { getCalendarEvents } from '@/features/timeline/actions'
import { getTimetableSlots } from '@/features/timeline/timetable-actions'
import { getHabits } from '@/features/habits/actions'
import { FullCalendarView } from '@/features/timeline/components/FullCalendarWrapper'

export const metadata = {
  title: 'Calendar - Nexora',
}

export default async function CalendarPage() {
  const tasks = await getTasks()
  const projects = await getProjects()
  const events = await getCalendarEvents()
  const timetableSlots = await getTimetableSlots()
  const habits = await getHabits()

  return (
    <div className="flex-1 space-y-6 p-8 pt-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between space-y-5 md:space-y-0 mb-8">
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tight text-foreground">Calendar</h2>
          <p className="text-muted-foreground text-lg font-medium">Schedule your time and manage deadlines.</p>
        </div>
      </div>
      
      <div className="mt-6 w-full relative z-0">
        <FullCalendarView 
          tasks={tasks} 
          projects={projects} 
          events={events} 
          timetableSlots={timetableSlots}
          habits={habits}
        />
      </div>
    </div>
  )
}
