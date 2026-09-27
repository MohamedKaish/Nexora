'use client'

import React, { useState, useEffect, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list'
import { getTimelineBlocksForCalendar, getKyroSchedulingContext, saveTimelineBlocks } from '../actions'
import { useKyroWorker } from '@/features/kyro/hooks/useKyroWorker'
import { useTimelineStore } from '@/store/timelineStore'
import { TimelineBlock } from '@/types/timeline'
import { startOfWeek, endOfWeek } from 'date-fns'
import { Card } from '@/components/ui/card'
import { CalendarDays, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export type ReflowStatus = 'IDLE' | 'LOADING' | 'SUCCESS' | 'NO_CHANGE' | 'ERROR'

export function TimelineCalendarView() {
  const [events, setEvents] = useState<Record<string, unknown>[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isMobile, setIsMobile] = useState(false)
  const [isKyroRunning, setIsKyroRunning] = useState(false)
  const [reflowStatus, setReflowStatus] = useState<ReflowStatus>('IDLE')
  const calendarRef = useRef<FullCalendar>(null)

  const { schedule } = useKyroWorker()
  const setStoreBlocks = useTimelineStore((state) => state.setBlocks)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const mapBlocksToEvents = React.useCallback((blocks: TimelineBlock[]): Record<string, unknown>[] => {
    return blocks.map(block => {
      const isFixed = block.type === 'calendar' || block.isFixed === true
      let bg = '#6366F1'
      let border = '#4F46E5'

      if (isFixed) {
        bg = 'hsl(var(--brand-emerald, 158 64% 52%))'
        border = 'hsl(var(--brand-emerald, 158 64% 42%))'
      } else if (block.type === 'task') {
        const priority = (block as unknown as { priority?: string }).priority
        if (priority === 'urgent' || priority === 'high') {
          bg = '#EF4444'
          border = '#DC2626'
        } else if (priority === 'low') {
          bg = '#10B981'
          border = '#059669'
        }
      }

      return {
        id: block.id,
        title: block.title,
        start: block.startTime instanceof Date ? block.startTime.toISOString() : String(block.startTime || ''),
        end: block.endTime instanceof Date ? block.endTime.toISOString() : String(block.endTime || ''),
        backgroundColor: bg,
        borderColor: border,
        extendedProps: {
          isFixed,
          type: block.type,
          priority: (block as unknown as { priority?: string }).priority
        }
      }
    })
  }, [])

  const loadData = React.useCallback(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 })
    const end = endOfWeek(currentDate, { weekStartsOn: 1 })
    
    getTimelineBlocksForCalendar(start.toISOString(), end.toISOString())
      .then(data => {
        setEvents(data)
      })
      .catch((err) => {
        console.error('[Timeline] Error loading calendar blocks:', err)
      })
  }, [currentDate])

  useEffect(() => {
    loadData()
  }, [loadData])

  const triggerKyroReflow = async () => {
    setIsKyroRunning(true)
    setReflowStatus('LOADING')

    try {
      // 1. Fetch real authenticated task, habit, and calendar context from Supabase
      const context = await getKyroSchedulingContext()

      // 2. Execute real deterministic Kyro scheduling computation via worker/engine
      const computedBlocks = await schedule(context, currentDate)

      // 3. Handle truthful outcomes without artificial delay or hardcoded counts
      if (!computedBlocks || computedBlocks.length === 0) {
        setReflowStatus('NO_CHANGE')
        toast.info('Kyro reflow completed', {
          description: 'No tasks or calendar events were available to schedule.'
        })
        return
      }

      const taskBlocks = computedBlocks.filter(b => b.type === 'task')
      const calBlocks = computedBlocks.filter(b => b.type === 'calendar')

      // 4. Persistence to database: Must be awaited and checked to prevent false SUCCESS
      const timeframe = {
        start: startOfWeek(currentDate, { weekStartsOn: 1 }).toISOString(),
        end: endOfWeek(currentDate, { weekStartsOn: 1 }).toISOString()
      }

      const saveResult = await saveTimelineBlocks(
        computedBlocks.map(b => ({
          id: b.id,
          title: b.title,
          type: b.type,
          startTime: b.startTime instanceof Date ? b.startTime.toISOString() : (b.startTime ? String(b.startTime) : null),
          endTime: b.endTime instanceof Date ? b.endTime.toISOString() : (b.endTime ? String(b.endTime) : null),
          priority: (b as unknown as { priority?: string }).priority,
          isFixed: b.type === 'calendar'
        })),
        timeframe
      )

      if (!saveResult.success) {
        setReflowStatus('ERROR')
        toast.error('Kyro reflow persistence failed', {
          description: saveResult.error || 'Database write failed. Changes could not be saved.'
        })
        return
      }

      // 5. Update Zustand state
      setStoreBlocks(computedBlocks)

      // 6. Update FullCalendar events
      const calendarEvents = mapBlocksToEvents(computedBlocks)
      setEvents(calendarEvents)

      setReflowStatus('SUCCESS')

      if (taskBlocks.length > 0) {
        toast.success('Kyro reflow completed', {
          description: `${taskBlocks.length} task block${taskBlocks.length === 1 ? '' : 's'} mathematically scheduled into available gaps.`
        })
      } else {
        toast.info('Kyro reflow completed', {
          description: `${calBlocks.length} fixed calendar event${calBlocks.length === 1 ? '' : 's'} aligned. No pending tasks to schedule.`
        })
      }
    } catch (err) {
      setReflowStatus('ERROR')
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute Kyro scheduling engine'
      console.error('[Timeline] Kyro Reflow Error:', err)
      toast.error('Kyro reflow failed', {
        description: errorMessage
      })
    } finally {
      setIsKyroRunning(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in zoom-in-95 duration-500">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <CalendarDays className="h-8 w-8 text-primary" />
            Kyro Timeline
          </h2>
          <p className="text-muted-foreground font-medium mt-1">Your mathematically optimized schedule.</p>
        </div>
        <button 
          onClick={triggerKyroReflow}
          disabled={isKyroRunning}
          data-testid="kyro-reflow-button"
          data-status={reflowStatus}
          className="bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-full shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:bg-primary/90 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isKyroRunning ? (
            <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {isKyroRunning ? 'Optimizing Schedule...' : 'Reflow Schedule'}
        </button>
      </div>

      <Card className="glass-card bg-card/40 border-border/50 p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] min-h-[700px] fc-theme-standard" style={{
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
        <style suppressHydrationWarning>{`
          .fc-theme-standard td, .fc-theme-standard th, .fc-theme-standard .fc-scrollgrid {
            border-color: hsl(var(--border) / 0.5) !important;
          }
          .fc .fc-col-header-cell-cushion, .fc .fc-timegrid-slot-label-cushion {
            color: hsl(var(--muted-foreground)) !important;
            font-weight: 600;
          }
          .fc-event {
            border-radius: 8px;
            padding: 2px 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: transform 0.2s;
            border-width: 0px !important;
          }
          .fc-event:hover {
            transform: translateY(-2px);
          }
          .fc .fc-button-primary {
            background-color: hsl(var(--secondary)) !important;
            border-color: hsl(var(--border)) !important;
            color: hsl(var(--foreground)) !important;
            border-radius: 10px;
            text-transform: capitalize;
            font-weight: 600;
          }
          .fc .fc-button-primary:not(:disabled):active, .fc .fc-button-primary:not(:disabled).fc-button-active {
            background-color: hsl(var(--primary)) !important;
            color: hsl(var(--primary-foreground)) !important;
            border-color: hsl(var(--primary)) !important;
          }
          .fc-timegrid-now-indicator-line {
            border-color: hsl(var(--brand-rose)) !important;
            border-width: 2px !important;
          }
          .fc-timegrid-now-indicator-arrow {
            border-color: hsl(var(--brand-rose)) !important;
            border-width: 6px !important;
          }
        `}</style>
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin, dayGridPlugin, listPlugin]}
          initialView={isMobile ? "listWeek" : "timeGridWeek"}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: isMobile ? 'listWeek,timeGridDay' : 'timeGridWeek,timeGridDay,listWeek'
          }}
          events={events}
          height={750}
          allDaySlot={false}
          nowIndicator={true}
          firstDay={1}
          slotMinTime="00:00:00"
          slotMaxTime="23:59:59"
          datesSet={(arg) => setCurrentDate(arg.start)}
          eventContent={(arg) => {
            const isFixed = arg.event.extendedProps?.isFixed
            const type = arg.event.extendedProps?.type
            
            return (
              <div className="flex flex-col overflow-hidden leading-tight text-white h-full justify-start text-[11px] pt-1 px-0.5">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold truncate pr-1">{arg.event.title}</span>
                  {type === 'conflict' && <ShieldAlert className="h-3 w-3 text-red-100 shrink-0" />}
                </div>
                
                <div className="flex items-center gap-1.5 opacity-90 text-[9px] uppercase tracking-wider font-semibold">
                  {isFixed ? (
                    <span className="bg-black/20 px-1.5 py-0.5 rounded">Fixed</span>
                  ) : (
                    <span className="bg-black/20 px-1.5 py-0.5 rounded">Fluid</span>
                  )}
                  {type === 'conflict' && (
                    <span className="bg-red-500/50 px-1.5 py-0.5 rounded text-white flex items-center gap-0.5">
                      <AlertCircle className="h-2.5 w-2.5" /> Conflict
                    </span>
                  )}
                </div>
              </div>
            )
          }}
        />
      </Card>
    </div>
  )
}
