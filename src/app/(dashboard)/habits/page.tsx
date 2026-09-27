import { getHabits } from '@/features/habits/actions'
import { HabitList } from '@/features/habits/components/HabitList'
import { CreateHabitDialog } from '@/features/habits/components/CreateHabitDialog'

export const metadata = {
  title: 'Habits - Nexora'
}

import { Suspense } from 'react'

async function HabitsContent() {
  const habits = await getHabits()
  return <HabitList initialHabits={habits} />
}

export default function HabitsPage() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between space-y-5 md:space-y-0 mb-8">
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tight text-foreground">Habits</h2>
          <p className="text-muted-foreground text-lg font-medium">Build consistency and track your daily routines.</p>
        </div>
        <div className="flex items-center space-x-2">
          <CreateHabitDialog />
        </div>
      </div>
      
      <div className="mt-8">
        <Suspense fallback={<div className="animate-pulse h-[400px] bg-secondary/30 rounded-2xl w-full" />}>
          <HabitsContent />
        </Suspense>
      </div>
    </div>
  )
}
