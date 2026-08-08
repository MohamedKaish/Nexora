import { getAnalyticsData } from '@/features/analytics/actions'
import { AnalyticsDashboard } from '@/features/analytics/components/AnalyticsDashboardWrapper'

export const metadata = {
  title: 'Analytics - Nexora'
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData()

  return (
    <div className="flex-1 space-y-6 p-8 pt-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between space-y-5 md:space-y-0 mb-8">
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tight text-foreground">Analytics</h2>
          <p className="text-muted-foreground text-lg font-medium">Measure your performance and consistency.</p>
        </div>
      </div>
      
      <div className="mt-6">
        {data ? (
          <AnalyticsDashboard data={data} />
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Failed to load analytics data.</p>
          </div>
        )}
      </div>
    </div>
  )
}
