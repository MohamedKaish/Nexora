'use client'

import React, { useState, useEffect, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list'
import { getTimelineBlocksForCalendar } from '../actions'
import { startOfWeek, endOfWeek } from 'date-fns'
import { Card } from '@/components/ui/card'
import { CalendarDays, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export function TimelineCalendarView() {
  const [events, setEvents] = useState<Record<string, unknown>[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isMobile, setIsMobile] = useState(false)
  const [isKyroRunning, setIsKyroRunning] = useState(false)
  const calendarRef = useRef<FullCalendar>(null)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const loadData = React.useCallback(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 })
    const end = endOfWeek(currentDate, { weekStartsOn: 1 })
    
    getTimelineBlocksForCalendar(start.toISOString(), end.toISOString())
      .then(data => setEvents(data))
      .catch(console.error)
  }, [currentDate])

  useEffect(() => {
    loadData()
  }, [loadData])

  const triggerKyroReflow = async () => {
    try {
      setIsKyroRunning(true)
      await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate engine run
      toast.success('Kyro scheduling complete', { description: 'Your timeline has been reflowed.' })
      loadData()
    } catch {
      toast.error('Failed to run Kyro engine')
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
          className="bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-full shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:bg-primary/90 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isKyroRunning ? (
            <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {isKyroRunning ? 'Optimizing...' : 'Reflow Schedule'}
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
            const isFixed = arg.event.extendedProps.isFixed
            const type = arg.event.extendedProps.type
            
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
