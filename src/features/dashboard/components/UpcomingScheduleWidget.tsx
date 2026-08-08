import { getCalendarEvents } from '@/features/timeline/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays } from 'lucide-react'
import Link from 'next/link'
import { Database } from '@/types/database.types'

export async function UpcomingScheduleWidget() {
  const calendarEvents = await getCalendarEvents()

  return (
    <Card className="glass-card border-white/5 rounded-[20px]">
      <CardHeader className="pb-3 border-b border-white/5 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-chart-2" />
          Upcoming Schedule
        </CardTitle>
        <Link href="/calendar" className="text-sm text-muted-foreground hover:text-foreground font-semibold transition-colors">Full Calendar</Link>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
          {calendarEvents.length === 0 ? (
             <p className="text-sm font-medium text-muted-foreground text-center py-4">No upcoming events.</p>
          ) : (
            calendarEvents.slice(0, 4).map((event: Database['public']['Tables']['calendar_events']['Row']) => (
              <div key={event.id} className="flex justify-between items-center p-3.5 rounded-[12px] border border-white/5 bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <div>
                  <p className="text-[14px] font-bold text-foreground">{event.title}</p>
                  <p className="text-xs font-semibold text-muted-foreground mt-1">
                    {new Date(event.start_time).toLocaleDateString()} {event.is_all_day ? '(All day)' : new Date(event.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
