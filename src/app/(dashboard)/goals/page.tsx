import { getGoals } from '@/features/goals/actions'
import { GoalsDashboard } from '@/features/goals/components/GoalsDashboard'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Goals - Nexora',
  description: 'Track your daily, weekly, and monthly goals',
}

export default async function GoalsPage() {
  const goals = await getGoals()

  return (
    <div className="flex-1 space-y-6 p-8 pt-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between space-y-5 md:space-y-0 mb-8">
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tight text-foreground">Goals</h2>
          <p className="text-muted-foreground text-lg font-medium">Set milestones and track your long-term progress.</p>
        </div>
      </div>
      
      <GoalsDashboard initialGoals={goals} />
    </div>
  )
}
