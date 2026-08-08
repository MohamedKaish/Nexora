import { getTimetableSlots } from '@/features/timeline/timetable-actions'
import { WeeklySchedule } from '@/features/timeline/components/WeeklySchedule'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export const metadata = {
  title: 'Weekly Timetable - Nexora'
}

export default async function TimetablePage() {
  const slots = await getTimetableSlots()

  return (
    <div className="flex-1 space-y-6 p-8 pt-8 max-w-7xl mx-auto w-full h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-end justify-between space-y-5 md:space-y-0 mb-8">
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tight text-foreground">Weekly Timetable</h2>
          <p className="text-muted-foreground text-lg font-medium">Design your ideal week and time block your focus sessions.</p>
        </div>
        <div className="flex items-center space-x-2">
          {/* We will add a CreateSlotDialog here later */}
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] transition-all smooth-ring h-10 px-5 rounded-[12px] font-semibold text-[14px]">
            <Plus className="mr-2 h-4 w-4" /> Add Time Block
          </Button>
        </div>
      </div>
      
      <div className="mt-8 flex-1">
        <WeeklySchedule initialSlots={slots} />
      </div>
    </div>
  )
}
