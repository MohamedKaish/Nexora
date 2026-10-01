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
        itemSelector: '.fc-event-drag',
        eventData: function(eventEl) {
          return {
            id: eventEl.getAttribute('data-id'),
            title: eventEl.innerText,
            backgroundColor: '#D4A853',
            borderColor: '#B07D2F',
            create: true
          }
        }
      })
    }
  }, [])

  const unscheduledTasks = tasks.filter(t => !t.due_date && t.status !== 'done')

  const calendarEvents = [
    ...events.map(e => ({
      id: `event-${e.id}`,
      title: e.title,
      start: e.start_time,
      end: e.end_time,
      allDay: e.is_all_day,
      backgroundColor: '#60A5FA',
      borderColor: '#3B82F6'
    })),
    ...tasks.filter(t => t.due_date).map(t => ({
      id: `task-${t.id}`,
      title: t.title,
      start: t.due_date as string,
      allDay: true,
      backgroundColor: t.status === 'done' ? '#34D399' : '#D4A853',
      borderColor: t.status === 'done' ? '#10B981' : '#B07D2F'
    })),
    ...projects.filter(p => p.due_date).map(p => ({
      id: `project-${p.id}`,
      title: `Project: ${p.name}`,
      start: p.due_date as string,
      allDay: true,
      backgroundColor: p.color || '#A78BFA',
      borderColor: p.color || '#8B5CF6'
    })),
    ...timetableSlots.map(s => ({
      id: `timetable-${s.id}`,
      title: s.label,
      start: s.start_time,
      end: s.end_time,
      daysOfWeek: [s.day_of_week],
      backgroundColor: s.color || '#A78BFA',
      borderColor: s.color || '#8B5CF6'
    })),
    ...habits.flatMap(h => 
      h.habit_completions.map(c => ({
        id: `habit-${c.id}`,
        title: `Habit: ${h.name}`,
        start: c.completed_date,
        allDay: true,
        backgroundColor: h.color || '#34D399',
        borderColor: h.color || '#10B981'
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
        borderColor: '#FB7185', 
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
    <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* External Events Sidebar */}
      <div className="w-full lg:w-64 shrink-0 space-y-4">
        <div className="world-card p-5">
          <div className="pb-3 border-b border-border/30 mb-3">
            <h2 className="text-sm font-bold text-foreground">Unscheduled Tasks</h2>
          </div>
          <div ref={externalEventsRef} className="space-y-2 max-h-[300px] lg:max-h-[700px] overflow-y-auto custom-scrollbar pr-1">
            {unscheduledTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground font-medium text-center py-4">All tasks scheduled!</p>
            ) : (
              unscheduledTasks.map(task => (
                <div 
                  key={task.id}
                  className="fc-event-drag p-3 rounded-xl bg-accent/5 border border-accent/20 text-accent text-sm font-semibold cursor-grab active:cursor-grabbing hover:bg-accent/10 transition-colors shadow-sm"
                  data-id={`task-${task.id}`}
                >
                  {task.title}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 world-card p-4 md:p-6 h-[600px] lg:h-[800px] fc-theme-standard">
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
              alert(`This is a ${id.split('-')[0]}. Go to the respective page to edit details.`)
            }
          }}
        />
      </div>
    </div>
  )
}
