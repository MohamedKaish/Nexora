import { FocusDashboard } from '@/features/focus/components/FocusDashboard'
import { getTasks } from '@/features/tasks/actions'
import { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Focus - Nexora',
  description: 'Deep work and Pomodoro timer',
}

async function FocusContent() {
  const tasks = await getTasks()
  return <FocusDashboard tasks={tasks} />
}

export default function FocusPage() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between space-y-5 md:space-y-0 mb-8">
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tight text-foreground">Focus Mode</h2>
          <p className="text-muted-foreground text-lg font-medium">Immersive sessions for deep work and studying.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-10">
        <Suspense fallback={<div className="animate-pulse h-[400px] bg-secondary/30 rounded-2xl w-full" />}>
          <FocusContent />
        </Suspense>
      </div>
    </div>
  )
}
