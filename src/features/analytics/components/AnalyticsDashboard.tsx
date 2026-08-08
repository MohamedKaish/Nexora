'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BrainCircuit, Target, CheckCircle2, Flame, Lightbulb } from 'lucide-react'

type AnalyticsData = {
  weeklyProductivity: { name: string, tasks: number }[]
  monthlyProductivity: { name: string, tasks: number }[]
  projectDistribution: { name: string, value: number, fill: string }[]
  projectProgress: { name: string, completed: number, total: number, progress: number, fill: string }[]
  habitConsistency: { name: string, completions: number }[]
  insights: string[]
  completionRate: number
  totalCompleted: number
  topStreak: number
  totalFocusTime: number
  heatmapData: { date: string; score: number }[]
  yearlyProductivity: { name: string, tasks: number }[]
  averageTaskDuration: number
  kyroAccuracy: number
  deepWorkHours: number
}

export function AnalyticsDashboard({ data }: { data: AnalyticsData }) {
  if (!data) return null

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      {/* Top Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Completion Rate', icon: Target, value: `${data.completionRate}%`, subtext: 'Of all planned tasks', color: 'blue' },
          { label: 'Avg Task Duration', icon: CheckCircle2, value: `${data.averageTaskDuration}m`, subtext: 'Per completed task', color: 'emerald' },
          { label: 'Kyro Accuracy', icon: Flame, value: `${data.kyroAccuracy}%`, subtext: 'Est vs Actual', color: 'indigo' },
          { label: 'Deep Work', icon: BrainCircuit, value: `${data.deepWorkHours}h`, subtext: 'Logged in last 30 days', color: 'purple' },
        ].map((stat, i) => (
          <Card key={i} className="glass-card relative overflow-hidden group border-white/5 rounded-[16px]">
            <div className={`absolute inset-0 bg-gradient-to-br from-brand-${stat.color}/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</CardTitle>
              <div className={`p-2 bg-brand-${stat.color}/10 rounded-[10px] group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`h-4 w-4 text-brand-${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-foreground tracking-tight">{stat.value}</div>
              <p className={`text-[13px] text-brand-${stat.color}/80 mt-2 font-semibold line-clamp-1`}>{stat.subtext}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Heatmap Contribution Graph */}
      <Card className="rounded-[20px] glass-card border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
        <CardHeader className="border-b border-white/5 pb-4">
          <CardTitle className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Activity Heatmap
          </CardTitle>
          <CardDescription className="text-muted-foreground/80 font-medium">Daily productivity score over the last 30 days.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 overflow-x-auto custom-scrollbar">
          <div className="flex items-end gap-2.5 min-w-[600px]">
            {data.heatmapData.map((day, i) => {
              // Custom intensity colors based on score
              let bgClass = "bg-secondary/40 border-white/5 hover:bg-secondary/60"
              let shadowClass = ""
              if (day.score > 80) { bgClass = "bg-primary/90 border-primary/20"; shadowClass = "shadow-[0_0_12px_rgba(99,102,241,0.5)]" }
              else if (day.score > 40) { bgClass = "bg-primary/60 border-primary/20" }
              else if (day.score > 0) { bgClass = "bg-primary/30 border-primary/10" }

              return (
                <div 
                  key={i} 
                  title={`${day.date}: ${day.score} points`}
                  className={`w-4 h-4 rounded-sm border ${bgClass} ${shadowClass} transition-colors hover:scale-125 cursor-help`}
                />
              )
            })}
          </div>
          <div className="flex items-center space-x-2 mt-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
            <span>Less</span>
            <div className="w-3.5 h-3.5 rounded-sm bg-secondary/40 border border-white/5"></div>
            <div className="w-3.5 h-3.5 rounded-sm bg-primary/30 border border-primary/10"></div>
            <div className="w-3.5 h-3.5 rounded-sm bg-primary/60 border border-primary/20"></div>
            <div className="w-3.5 h-3.5 rounded-sm bg-primary/90 border border-primary/20 shadow-[0_0_8px_rgba(99,102,241,0.4)]"></div>
            <span>More</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Weekly Productivity Chart */}
        <Card className="col-span-4 rounded-[20px] glass-card border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-xl font-bold text-foreground tracking-tight">Weekly Productivity</CardTitle>
            <CardDescription className="text-muted-foreground/80 font-medium">Tasks completed per day this week.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.weeklyProductivity}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#a1a1aa'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#a1a1aa'}} dx={-10} allowDecimals={false} />
                  <Tooltip 
                    cursor={{fill: '#27272a', opacity: 0.4}}
                    contentStyle={{borderRadius: '12px', border: '1px solid #27272a', backgroundColor: '#18181b', boxShadow: '0 8px 30px rgba(0,0,0,0.4)', color: '#fafafa'}}
                  />
                  <Bar dataKey="tasks" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Project Distribution */}
        <Card className="col-span-3 rounded-[20px] glass-card border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-xl font-bold text-foreground tracking-tight">Project Focus</CardTitle>
            <CardDescription className="text-muted-foreground/80 font-medium">Where you spend your time.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {data.projectDistribution.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground border-2 border-dashed border-border/60 rounded-xl m-4">
                No completed tasks yet.
              </div>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.projectDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={6}
                      dataKey="value"
                      stroke="none"
                    >
                      {data.projectDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{borderRadius: '12px', border: '1px solid #27272a', backgroundColor: '#18181b', boxShadow: '0 8px 30px rgba(0,0,0,0.4)', color: '#fafafa'}}
                      itemStyle={{color: '#fafafa'}}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-4 mt-2">
                  {data.projectDistribution.map((entry, idx) => (
                    <div key={idx} className="flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-default">
                      <div className="w-2.5 h-2.5 rounded-full mr-2 shadow-sm" style={{ backgroundColor: entry.fill }} />
                      {entry.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Productivity Chart */}
        <Card className="rounded-[20px] glass-card border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-xl font-bold text-foreground tracking-tight">Monthly Productivity</CardTitle>
            <CardDescription className="text-muted-foreground/80 font-medium">Tasks completed over the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[250px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.yearlyProductivity}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#a1a1aa'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#a1a1aa'}} dx={-10} allowDecimals={false} />
                  <Tooltip 
                    cursor={{fill: '#27272a', opacity: 0.4}}
                    contentStyle={{borderRadius: '12px', border: '1px solid #27272a', backgroundColor: '#18181b', boxShadow: '0 8px 30px rgba(0,0,0,0.4)', color: '#fafafa'}}
                  />
                  <Bar dataKey="tasks" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Habit Consistency */}
        <Card className="rounded-[20px] glass-card border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-xl font-bold text-foreground tracking-tight">Habit Consistency</CardTitle>
            <CardDescription className="text-muted-foreground/80 font-medium">Habits completed per day this week.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[250px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.habitConsistency}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#a1a1aa'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#a1a1aa'}} dx={-10} allowDecimals={false} />
                  <Tooltip 
                    cursor={{fill: '#27272a', opacity: 0.4}}
                    contentStyle={{borderRadius: '12px', border: '1px solid #27272a', backgroundColor: '#18181b', boxShadow: '0 8px 30px rgba(0,0,0,0.4)', color: '#fafafa'}}
                  />
                  <Bar dataKey="completions" fill="#F59E0B" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Project Progress */}
      <Card className="rounded-[20px] glass-card border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
        <CardHeader className="border-b border-white/5 pb-4">
          <CardTitle className="text-xl font-bold text-foreground tracking-tight">Project Progress</CardTitle>
          <CardDescription className="text-muted-foreground/80 font-medium">Completion status of your active projects.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6 mt-2">
            {data.projectProgress.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks assigned to projects.</p>
            ) : (
              data.projectProgress.map((project, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-foreground">{project.name}</span>
                    <span className="text-muted-foreground">{project.progress}% ({project.completed}/{project.total})</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${project.progress}%`,
                        backgroundColor: project.fill
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Smart Insights */}
      <Card className="rounded-[20px] glass-card border-brand-purple/20 bg-brand-purple/5 relative overflow-hidden shadow-[0_8px_32px_rgba(139,92,246,0.1)] group">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-brand-purple/10 rounded-full blur-3xl pointer-events-none group-hover:bg-brand-purple/20 transition-colors duration-700" />
        <CardHeader className="border-b border-brand-purple/10 pb-4 bg-brand-purple/5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-brand-purple/20 rounded-xl shadow-[0_0_15px_rgba(139,92,246,0.3)]">
              <BrainCircuit className="h-6 w-6 text-brand-purple animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-foreground tracking-tight">Kyro Insights</CardTitle>
              <CardDescription className="text-muted-foreground/80 mt-1 font-medium">Intelligent observations based on your real activity.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative z-10 pt-6 pb-6">
          <div className="space-y-4">
            {data.insights.map((insight, idx) => (
              <div key={idx} className="flex items-start space-x-4 p-5 bg-card/60 backdrop-blur-md rounded-xl border border-brand-purple/10 shadow-sm hover:shadow-md hover:border-brand-purple/30 transition-all group">
                <Lightbulb className="h-5 w-5 text-brand-amber shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <p className="text-[15px] text-foreground/90 leading-relaxed font-medium">{insight}</p>
              </div>
            ))}
            {data.insights.length === 0 && (
              <p className="text-sm text-muted-foreground italic p-6 text-center border-2 border-dashed border-border/50 rounded-xl">
                Check back later! Kyro needs more data to generate insights.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
