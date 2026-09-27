import { getTimetableSlots } from '@/features/timeline/timetable-actions'
import { TimetableClientView } from '@/features/timeline/components/TimetableClientView'

export const metadata = {
  title: 'Weekly Timetable - Nexora'
}

export default async function TimetablePage() {
  const slots = await getTimetableSlots()

  return (
    <div className="flex-1 space-y-6 p-8 pt-8 max-w-7xl mx-auto w-full h-full flex flex-col">
      <TimetableClientView initialSlots={slots} />
    </div>
  )
}
