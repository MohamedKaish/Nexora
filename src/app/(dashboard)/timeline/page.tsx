import { TimelineCalendarView } from '@/features/timeline/components/TimelineCalendarWrapper'

export const metadata = {
  title: 'Kyro Timeline - Nexora'
}

export default function TimelinePage() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-8 max-w-[1600px] mx-auto w-full">
      <TimelineCalendarView />
    </div>
  )
}
