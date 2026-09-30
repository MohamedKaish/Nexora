import { FocusDashboard } from '@/features/focus/components/FocusDashboard'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Focus - Nexora',
  description: 'Deep work and Pomodoro timer',
}

export default function FocusPage() {
  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between space-y-5 md:space-y-0 mb-8">
        <div className="space-y-2">
          <h2 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-foreground">Focus Mode</h2>
          <p className="text-muted-foreground text-lg font-medium">Immersive sessions for deep work and studying.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-10">
        <ErrorBoundary>
          <FocusDashboard />
        </ErrorBoundary>
      </div>
    </div>
  )
}
