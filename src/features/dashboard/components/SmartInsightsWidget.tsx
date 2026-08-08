import { getAnalyticsData } from '@/features/analytics/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Zap } from 'lucide-react'

export async function SmartInsightsWidget() {
  const analyticsData = await getAnalyticsData()

  return (
    <Card className="glass-card border-white/5 rounded-[20px]">
      <CardHeader className="pb-3 border-b border-white/5">
        <CardTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Smart Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {analyticsData?.insights && analyticsData.insights.length > 0 ? (
          <ul className="space-y-3">
            {analyticsData.insights.slice(0, 3).map((insight, idx) => (
              <li key={idx} className="flex gap-3 text-[14px] font-medium text-muted-foreground items-start bg-secondary/30 hover:bg-secondary/50 transition-colors p-3.5 rounded-[12px] border border-white/5 shadow-sm">
                <span className="text-primary mt-0.5">✦</span>
                {insight}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm font-medium text-muted-foreground">Keep working to generate smart insights.</p>
        )}
      </CardContent>
    </Card>
  )
}
