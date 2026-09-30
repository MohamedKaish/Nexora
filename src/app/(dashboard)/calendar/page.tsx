'use client'

import { useEffect, useState, Suspense } from 'react'
import { getTasks } from '@/features/tasks/actions'
import { getProjects } from '@/features/projects/actions'
import { getCalendarEvents } from '@/features/timeline/actions'
import { getTimetableSlots } from '@/features/timeline/timetable-actions'
import { getHabits } from '@/features/habits/actions'
import { FullCalendarView } from '@/features/timeline/components/FullCalendarWrapper'
import { useTaskStore } from '@/store/useTaskStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useHabitStore } from '@/store/useHabitStore'

function CalendarContent() {
  const [data, setData] = useState<any>(null)
  
  // Local stores for Guest mode
  const localTasks = useTaskStore(s => Array.isArray(s.tasks) ? s.tasks : [])
  const localProjects = useProjectStore(s => Array.isArray(s.projects) ? s.projects : [])
  const localHabits = useHabitStore(s => Array.isArray(s.habits) ? s.habits : [])

  useEffect(() => {
    async function fetchData() {
      try {
        const [tasks, projects, events, timetableSlots, habits] = await Promise.all([
          getTasks().catch(() => []),
          getProjects().catch(() => []),
          getCalendarEvents().catch(() => []),
          getTimetableSlots().catch(() => []),
          getHabits().catch(() => [])
        ])
        
        setData({
          tasks: tasks.length > 0 ? tasks : localTasks,
          projects: projects.length > 0 ? projects : localProjects,
          events,
          timetableSlots,
          habits: habits.length > 0 ? habits : localHabits
        })
      } catch (error) {
        // Fallback to local guest data
        setData({
          tasks: localTasks,
          projects: localProjects,
          events: [],
          timetableSlots: [],
          habits: localHabits
        })
      }
    }
    
    fetchData()
  }, [localTasks, localProjects, localHabits])

  if (!data) return <div className="animate-pulse h-[800px] w-full bg-secondary/30 rounded-2xl" />

  return (
    <FullCalendarView 
      tasks={data.tasks} 
      projects={data.projects} 
      events={data.events} 
      timetableSlots={data.timetableSlots}
      habits={data.habits}
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
