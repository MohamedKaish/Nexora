import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatsWidget } from '@/features/dashboard/components/StatsWidget'
import { FocusWidget } from '@/features/dashboard/components/FocusWidget'
import { RecentProjectsWidget } from '@/features/dashboard/components/RecentProjectsWidget'
import { SmartInsightsWidget } from '@/features/dashboard/components/SmartInsightsWidget'
import { UpcomingScheduleWidget } from '@/features/dashboard/components/UpcomingScheduleWidget'
import { IntelligentAdvisorWidget } from '@/features/intelligence/components/IntelligentAdvisorWidget'
import { getDailyAdvisorReport } from '@/features/intelligence/actions'

export const metadata = {
  title: 'Dashboard - Nexora',
}

function StatsSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-8">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-28 rounded-[16px] w-full" />
      ))}
    </div>
  )
}

function GridSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mt-6">
      <Skeleton className="col-span-4 h-80 rounded-[20px]" />
      <Skeleton className="col-span-3 h-80 rounded-[20px]" />
    </div>
  )
}

function InsightsSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 mt-6">
      <Skeleton className="h-64 rounded-[20px]" />
      <Skeleton className="h-64 rounded-[20px]" />
    </div>
  )
}

async function AdvisorSection() {
  let report = null
  try {
    report = await getDailyAdvisorReport()
  } catch {
    // Graceful fallback when database or session is uninitialized
  }
  return <IntelligentAdvisorWidget initialReport={report} />
}

import { getUser } from '@/lib/supabase/server'
import { GuestDashboardView } from '@/features/dashboard/components/GuestDashboardView'

export default async function DashboardPage() {
  const { data: { user } } = await getUser()

  if (!user) {
    return <GuestDashboardView />
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between space-y-5 md:space-y-0 mb-2">
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tight text-foreground">Welcome back</h2>
          <p className="text-muted-foreground text-lg font-medium">Here is what&apos;s happening with your projects today.</p>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/tasks">
            <Button variant="outline" className="bg-secondary/40 border-white/5 hover:bg-secondary/80 hover:border-white/10 transition-all smooth-ring h-10 px-5 rounded-[12px] font-semibold text-[14px]">New Task</Button>
          </Link>
          <Link href="/projects">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] transition-all smooth-ring h-10 px-5 rounded-[12px] font-semibold text-[14px]">New Project</Button>
          </Link>
        </div>
      </div>
      
      <Suspense fallback={<StatsSkeleton />}>
        <StatsWidget />
      </Suspense>

      <Suspense fallback={<div className="h-44 rounded-[24px] bg-secondary/20 animate-pulse mt-6" />}>
        <div className="mt-6">
          <AdvisorSection />
        </div>
      </Suspense>

      <Suspense fallback={<GridSkeleton />}>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mt-6">
          <FocusWidget />
          <RecentProjectsWidget />
        </div>
      </Suspense>

      <Suspense fallback={<InsightsSkeleton />}>
        <div className="grid gap-6 md:grid-cols-2 mt-6">
          <SmartInsightsWidget />
          <UpcomingScheduleWidget />
        </div>
      </Suspense>
    </div>
  )
}
