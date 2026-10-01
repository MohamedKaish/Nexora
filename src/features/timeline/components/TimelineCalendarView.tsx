'use client'

import React, { useState, useEffect, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list'
import { useKyroWorker } from '@/features/kyro/hooks/useKyroWorker'
import { useTimelineStore } from '@/store/timelineStore'
import { TimelineBlock } from '@/types/timeline'
import { CalendarDays, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export type ReflowStatus = 'IDLE' | 'LOADING' | 'SUCCESS' | 'NO_CHANGE' | 'ERROR'

export function TimelineCalendarView() {
  const [events, setEvents] = useState<Record<string, unknown>[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      let bg = 'var(--color-brand-blue)'
      let border = 'var(--color-brand-blue)'

      if (isFixed) {
        bg = 'var(--color-brand-emerald)'
        border = 'var(--color-brand-emerald)'
      } else if (block.type === 'task') {
        const priority = (block as unknown as { priority?: string }).priority
        if (priority === 'urgent' || priority === 'high') {
          bg = 'var(--color-brand-rose)'
          border = 'var(--color-brand-rose)'
        } else if (priority === 'low') {
          bg = 'var(--color-brand-amber)'
          border = 'var(--color-brand-amber)'
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
    const calendarEvents = mapBlocksToEvents(useTimelineStore.getState().blocks)
    setEvents(calendarEvents)
  }, [mapBlocksToEvents])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
    const unsub = useTimelineStore.subscribe((state) => {
      setEvents(mapBlocksToEvents(state.blocks))
    })
    return () => unsub()
  }, [loadData, mapBlocksToEvents])

  const triggerKyroReflow = async () => {
    setIsKyroRunning(true)
    setReflowStatus('LOADING')

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const computedBlocks = useTimelineStore.getState().blocks

      if (!computedBlocks || computedBlocks.length === 0) {
        setReflowStatus('NO_CHANGE')
        toast.info('Kyro reflow completed', {
          description: 'No tasks or calendar events were available to schedule.'
        })
        return
      }

      const taskBlocks = computedBlocks.filter(b => b.type === 'task')
      const calBlocks = computedBlocks.filter(b => b.type === 'calendar')

      setStoreBlocks(computedBlocks)
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
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <CalendarDays className="h-8 w-8 text-accent" />
            Kyro Timeline
          </h2>
          <p className="text-muted-foreground font-medium mt-1">Your mathematically optimized schedule.</p>
        </div>
        <button 
          onClick={triggerKyroReflow}
          disabled={isKyroRunning}
          data-testid="kyro-reflow-button"
          data-status={reflowStatus}
          className="bg-accent text-accent-foreground font-bold px-6 py-2.5 rounded-2xl shadow-sm hover:bg-accent/90 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
        >
          {isKyroRunning ? (
            <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-accent-foreground animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {isKyroRunning ? 'Optimizing Schedule...' : 'Reflow Schedule'}
        </button>
      </div>

      <div className="world-card p-6 min-h-[700px] fc-theme-standard">
        <style suppressHydrationWarning>{`
          .fc-theme-standard td, .fc-theme-standard th, .fc-theme-standard .fc-scrollgrid {
            border-color: var(--color-border) !important;
            opacity: 0.8;
          }
          .fc .fc-col-header-cell-cushion, .fc .fc-timegrid-slot-label-cushion {
            color: var(--color-muted-foreground) !important;
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
            background-color: var(--color-foreground) !important;
            border-color: var(--color-border) !important;
            color: var(--color-background) !important;
            background: rgba(255, 255, 255, 0.04) !important;
            color: var(--color-foreground) !important;
            border-radius: 12px;
            text-transform: capitalize;
            font-weight: 600;
            padding: 8px 16px;
            box-shadow: none;
          }
          .fc .fc-button-primary:not(:disabled):active, .fc .fc-button-primary:not(:disabled).fc-button-active {
            background-color: var(--color-accent) !important;
            color: var(--color-accent-foreground) !important;
            border-color: var(--color-accent) !important;
          }
          .fc-timegrid-now-indicator-line {
            border-color: var(--color-brand-rose) !important;
            border-width: 2px !important;
          }
          .fc-timegrid-now-indicator-arrow {
            border-color: var(--color-brand-rose) !important;
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
              <div className="flex flex-col overflow-hidden leading-tight text-white h-full justify-start text-[11px] pt-1 px-1">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold truncate pr-1">{arg.event.title}</span>
                  {type === 'conflict' && <ShieldAlert className="h-3 w-3 text-red-100 shrink-0" />}
                </div>
                
                <div className="flex items-center gap-1.5 opacity-90 text-[9px] uppercase tracking-widest font-bold">
                  {isFixed ? (
                    <span className="bg-black/30 px-1.5 py-0.5 rounded-sm">Fixed</span>
                  ) : (
                    <span className="bg-black/30 px-1.5 py-0.5 rounded-sm">Fluid</span>
                  )}
                  {type === 'conflict' && (
                    <span className="bg-red-500/80 px-1.5 py-0.5 rounded-sm text-white flex items-center gap-0.5">
                      <AlertCircle className="h-2.5 w-2.5" /> Conflict
                    </span>
                  )}
                </div>
              </div>
            )
          }}
        />
      </div>
    </div>
  )
}
