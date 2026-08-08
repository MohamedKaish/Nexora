'use client'

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import { Database } from '@/types/database.types'
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '../actions'
import { updateTask } from '@/features/tasks/actions'
import { updateProject } from '@/features/projects/actions'
import { EventClickArg, EventDropArg, DateSelectArg } from '@fullcalendar/core'
import { EventResizeDoneArg, Draggable, EventReceiveArg } from '@fullcalendar/interaction'
import { useEffect, useRef, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { detectConflicts } from '../utils/conflictDetector'
import { TimelineBlock } from '@/types/timeline'

type Task = Database['public']['Tables']['tasks']['Row']
type Project = Database['public']['Tables']['projects']['Row']
type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']
type TimetableSlot = Database['public']['Tables']['timetable_slots']['Row']
type Habit = Database['public']['Tables']['habits']['Row'] & { 
  habit_completions: { id: string; completed_date: string }[] 
}

interface FullCalendarViewProps {
  tasks: Task[]
  projects: Project[]
  events: CalendarEvent[]
  timetableSlots: TimetableSlot[]
  habits: Habit[]
}

export function FullCalendarView({ tasks, projects, events, timetableSlots, habits }: FullCalendarViewProps) {
  const externalEventsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (externalEventsRef.current) {
      new Draggable(externalEventsRef.current, {
        itemSelector: '.fc-event',
        eventData: function(eventEl) {
          return {
            id: eventEl.getAttribute('data-id'),
            title: eventEl.innerText,
            backgroundColor: '#F59E0B',
            borderColor: '#D97706',
            create: true
          }
        }
      })
    }
  }, [])

  const unscheduledTasks = tasks.filter(t => !t.due_date && t.status !== 'done')

  // Map data to FullCalendar events
  const calendarEvents = [
    ...events.map(e => ({
      id: `event-${e.id}`,
      title: e.title,
      start: e.start_time,
      end: e.end_time,
      allDay: e.is_all_day,
      backgroundColor: '#6366F1',
      borderColor: '#4F46E5'
    })),
    ...tasks.filter(t => t.due_date).map(t => ({
      id: `task-${t.id}`,
      title: t.title,
      start: t.due_date as string,
      allDay: true,
      backgroundColor: t.status === 'done' ? '#10B981' : '#F59E0B',
      borderColor: t.status === 'done' ? '#059669' : '#D97706'
    })),
    ...projects.filter(p => p.due_date).map(p => ({
      id: `project-${p.id}`,
      title: `Project: ${p.name}`,
      start: p.due_date as string,
      allDay: true,
      backgroundColor: p.color || '#3B82F6',
      borderColor: p.color || '#2563EB'
    })),
    ...timetableSlots.map(s => {
      // Map dayOfWeek (0 = Monday in our DB usually? Or 0 = Sunday)
      // FullCalendar: 0=Sunday, 1=Monday
      // Assuming DB day_of_week is 0-6 where 0=Sunday
      return {
        id: `timetable-${s.id}`,
        title: s.label,
        start: s.start_time,
        end: s.end_time,
        daysOfWeek: [s.day_of_week],
        backgroundColor: s.color || '#8B5CF6',
        borderColor: s.color || '#7C3AED'
      }
    }),
    ...habits.flatMap(h => 
      h.habit_completions.map(c => ({
        id: `habit-${c.id}`,
        title: `Habit: ${h.name}`,
        start: c.completed_date,
        allDay: true,
        backgroundColor: h.color || '#10B981',
        borderColor: h.color || '#059669'
      }))
    )
  ]

  type MappedCalendarEvent = { id: string; title: string; start?: string; startTime?: string; end?: string; endTime?: string };
  const mappedBlocks: TimelineBlock[] = (calendarEvents as unknown as MappedCalendarEvent[]).map((e) => ({
    id: e.id,
    type: 'calendar',
    title: e.title,
    startTime: new Date(e.start || e.startTime!),
    endTime: new Date(e.end || e.endTime || e.start || e.startTime!),
    isCompleted: false
  }))

  const conflicts = detectConflicts(mappedBlocks)

  const finalCalendarEvents = calendarEvents.map(e => {
    if (conflicts[e.id]) {
      return {
        ...e,
        borderColor: '#EF4444', // destructive red
        classNames: ['border-2', 'border-destructive', 'animate-pulse']
      }
    }
    return e
  })

  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      
      {/* External Events Sidebar */}
      <div className="w-full lg:w-64 shrink-0 space-y-4">
        <Card className="bg-card/40 border-border/50 shadow-sm backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Unscheduled Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={externalEventsRef} className="space-y-2">
              {unscheduledTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">All tasks scheduled!</p>
              ) : (
                unscheduledTasks.map(task => (
                  <div 
                    key={task.id}
                    className="fc-event p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-600 text-sm font-medium cursor-grab active:cursor-grabbing hover:bg-orange-500/20 transition-colors"
                    data-id={`task-${task.id}`}
                  >
                    {task.title}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <div className="flex-1 glass-card bg-card/40 border-border/50 p-6 rounded-2xl shadow-sm h-[800px] fc-theme-standard" style={{
      '--fc-border-color': 'var(--border)',
      '--fc-page-bg-color': 'transparent',
      '--fc-neutral-bg-color': 'var(--secondary)',
      '--fc-neutral-text-color': 'var(--foreground)',
      '--fc-today-bg-color': 'rgba(99, 102, 241, 0.1)',
      '--fc-button-text-color': 'var(--foreground)',
      '--fc-button-bg-color': 'var(--secondary)',
      '--fc-button-border-color': 'var(--border)',
      '--fc-button-hover-bg-color': 'var(--secondary)',
      '--fc-button-hover-border-color': 'var(--border)',
      '--fc-button-active-bg-color': 'rgba(99, 102, 241, 0.2)',
      '--fc-button-active-border-color': 'var(--primary)',
    } as React.CSSProperties}>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView={isMobile ? "listWeek" : "timeGridWeek"}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: isMobile ? 'listWeek,timeGridDay' : 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        }}
        events={finalCalendarEvents}
        selectable={true}
        selectMirror={true}
        editable={true}
        droppable={true}
        eventReceive={async (info: EventReceiveArg) => {
          const id = info.event.id
          if (id.startsWith('task-')) {
            try {
              await updateTask(id.replace('task-', ''), {
                due_date: info.event.startStr
              })
            } catch (err) {
              console.error(err)
              info.revert()
              alert('Failed to schedule task')
            }
          }
        }}
        select={async (info: DateSelectArg) => {
          const title = prompt('Please enter a new title for your event')
          if (title) {
            try {
              await createCalendarEvent(title, info.startStr, info.endStr, info.allDay)
            } catch (err) {
              console.error(err)
              alert('Failed to create event')
            }
          }
        }}
        eventDrop={async (info: EventDropArg) => {
          const { event } = info
          const id = event.id
          try {
            if (id.startsWith('event-')) {
              await updateCalendarEvent(id.replace('event-', ''), {
                start_time: event.startStr,
                end_time: event.endStr || event.startStr,
                is_all_day: event.allDay
              })
            } else if (id.startsWith('task-')) {
              await updateTask(id.replace('task-', ''), {
                due_date: event.startStr
              })
            } else if (id.startsWith('project-')) {
              await updateProject(id.replace('project-', ''), {
                due_date: event.startStr
              })
            }
          } catch (err) {
            console.error(err)
            info.revert()
            alert('Failed to move event')
          }
        }}
        eventResize={async (info: EventResizeDoneArg) => {
          const { event } = info
          const id = event.id
          try {
            if (id.startsWith('event-')) {
              await updateCalendarEvent(id.replace('event-', ''), {
                start_time: event.startStr,
                end_time: event.endStr || event.startStr,
                is_all_day: event.allDay
              })
            } else {
              // Tasks and Projects only have a due date (start), resize doesn't apply well, but we can update due_date
              info.revert()
              alert('Cannot resize tasks or projects. Drag them to change due date.')
            }
          } catch (err) {
            console.error(err)
            info.revert()
          }
        }}
        eventClick={async (info: EventClickArg) => {
          const id = info.event.id
          if (id.startsWith('event-')) {
            if (confirm(`Are you sure you want to delete the event '${info.event.title}'?`)) {
              try {
                await deleteCalendarEvent(id.replace('event-', ''))
              } catch (err) {
                console.error(err)
                alert('Failed to delete event')
              }
            }
          } else {
            // For tasks/projects, could route to details or open modal
            alert(`This is a ${id.split('-')[0]}. Go to the respective page to edit details.`)
          }
        }}
      />
    </div>
    </div>
  )
}
