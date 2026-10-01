'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { CardTitle, CardDescription } from '@/components/ui/card'
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
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Stats */}
      <div className="grid gap-3 md:gap-6 grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Completion Rate', icon: Target, value: `${data.completionRate}%`, subtext: 'Of all planned tasks', color: 'var(--color-brand-blue)' },
          { label: 'Avg Task Duration', icon: CheckCircle2, value: `${data.averageTaskDuration}m`, subtext: 'Per completed task', color: 'var(--color-brand-emerald)' },
          { label: 'Kyro Accuracy', icon: Flame, value: `${data.kyroAccuracy}%`, subtext: 'Est vs Actual', color: 'var(--color-brand-amber)' },
          { label: 'Deep Work', icon: BrainCircuit, value: `${data.deepWorkHours}h`, subtext: 'Logged in last 30 days', color: 'var(--color-brand-purple)' },
        ].map((stat, i) => (
          <div key={i} className="world-card p-4 md:p-5 flex flex-col gap-2 group cursor-default relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center gap-2 relative z-10">
              <div className="p-1.5 rounded-xl transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: `${stat.color}15` }}>
                <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider line-clamp-1">{stat.label}</span>
            </div>
            <div className="relative z-10 mt-1">
              <p className="text-2xl md:text-3xl font-bold text-foreground tracking-tighter">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5 line-clamp-1">{stat.subtext}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Heatmap Contribution Graph */}
      <div className="world-card p-5 md:p-6 space-y-4">
        <div>
          <CardTitle className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Target className="w-5 h-5 text-accent" />
            Activity Heatmap
          </CardTitle>
          <CardDescription className="text-muted-foreground/80 font-medium mt-1">Daily productivity score over the last 30 days.</CardDescription>
        </div>
        <div className="pt-2 overflow-x-auto custom-scrollbar pb-2">
          <div className="flex items-end gap-2 min-w-[600px]">
            {data.heatmapData.map((day, i) => {
              let bgClass = "bg-foreground/[0.04] border-border/10"
              let shadowClass = ""
              if (day.score > 80) { bgClass = "bg-accent border-accent/20"; shadowClass = "shadow-[0_0_12px_rgba(212,168,83,0.4)]" }
              else if (day.score > 40) { bgClass = "bg-accent/70 border-accent/20" }
              else if (day.score > 0) { bgClass = "bg-accent/40 border-accent/10" }

              return (
                <div 
                  key={i} 
                  title={`${day.date}: ${day.score} points`}
                  className={`w-4 h-4 rounded-[4px] border ${bgClass} ${shadowClass} transition-colors hover:scale-125 cursor-crosshair`}
                />
              )
            })}
          </div>
          <div className="flex items-center space-x-2 mt-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
            <span>Less</span>
            <div className="w-3 h-3 rounded-[3px] bg-foreground/[0.04] border border-border/10"></div>
            <div className="w-3 h-3 rounded-[3px] bg-accent/40 border border-accent/10"></div>
            <div className="w-3 h-3 rounded-[3px] bg-accent/70 border border-accent/20"></div>
            <div className="w-3 h-3 rounded-[3px] bg-accent border border-accent/20 shadow-[0_0_8px_rgba(212,168,83,0.4)]"></div>
            <span>More</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Weekly Productivity Chart */}
        <div className="col-span-4 world-card p-5 md:p-6">
          <CardTitle className="text-xl font-bold text-foreground tracking-tight">Weekly Productivity</CardTitle>
          <CardDescription className="text-muted-foreground/80 font-medium mt-1">Tasks completed per day this week.</CardDescription>
          <div className="h-[250px] w-full mt-6 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weeklyProductivity}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.4} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--color-muted-foreground)', fontSize: 12, fontWeight: 500}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--color-muted-foreground)', fontSize: 12, fontWeight: 500}} dx={-10} allowDecimals={false} />
                <Tooltip 
                  cursor={{fill: 'var(--color-foreground)', opacity: 0.05}}
                  contentStyle={{borderRadius: '16px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-depth-md)', color: 'var(--color-foreground)', fontWeight: 600}}
                />
                <Bar dataKey="tasks" fill="var(--color-brand-blue)" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Distribution */}
        <div className="col-span-3 world-card p-5 md:p-6">
          <CardTitle className="text-xl font-bold text-foreground tracking-tight">Project Focus</CardTitle>
          <CardDescription className="text-muted-foreground/80 font-medium mt-1">Where you spend your time.</CardDescription>
          {data.projectDistribution.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground border-2 border-dashed border-border/40 rounded-2xl mt-4">
              No completed tasks yet.
            </div>
          ) : (
            <div className="h-[250px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.projectDistribution}
                    cx="50%" cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.projectDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-depth-md)', color: 'var(--color-foreground)', fontWeight: 600}}
                    itemStyle={{color: 'var(--color-foreground)'}}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 -mt-4">
                {data.projectDistribution.map((entry, idx) => (
                  <div key={idx} className="flex items-center text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors cursor-default">
                    <div className="w-2 h-2 rounded-full mr-1.5 shadow-sm" style={{ backgroundColor: entry.fill }} />
                    {entry.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Productivity Chart */}
        <div className="world-card p-5 md:p-6">
          <CardTitle className="text-xl font-bold text-foreground tracking-tight">Monthly Productivity</CardTitle>
          <CardDescription className="text-muted-foreground/80 font-medium mt-1">Tasks completed over the last 6 months.</CardDescription>
          <div className="h-[220px] w-full mt-6 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.yearlyProductivity}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.4} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--color-muted-foreground)', fontSize: 12, fontWeight: 500}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--color-muted-foreground)', fontSize: 12, fontWeight: 500}} dx={-10} allowDecimals={false} />
                <Tooltip 
                  cursor={{fill: 'var(--color-foreground)', opacity: 0.05}}
                  contentStyle={{borderRadius: '16px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-depth-md)', color: 'var(--color-foreground)', fontWeight: 600}}
                />
                <Bar dataKey="tasks" fill="var(--color-brand-emerald)" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Habit Consistency */}
        <div className="world-card p-5 md:p-6">
          <CardTitle className="text-xl font-bold text-foreground tracking-tight">Habit Consistency</CardTitle>
          <CardDescription className="text-muted-foreground/80 font-medium mt-1">Habits completed per day this week.</CardDescription>
          <div className="h-[220px] w-full mt-6 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.habitConsistency}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.4} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--color-muted-foreground)', fontSize: 12, fontWeight: 500}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--color-muted-foreground)', fontSize: 12, fontWeight: 500}} dx={-10} allowDecimals={false} />
                <Tooltip 
                  cursor={{fill: 'var(--color-foreground)', opacity: 0.05}}
                  contentStyle={{borderRadius: '16px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-depth-md)', color: 'var(--color-foreground)', fontWeight: 600}}
                />
                <Bar dataKey="completions" fill="var(--color-brand-amber)" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Project Progress */}
      <div className="world-card p-5 md:p-6">
        <CardTitle className="text-xl font-bold text-foreground tracking-tight">Project Progress</CardTitle>
        <CardDescription className="text-muted-foreground/80 font-medium mt-1">Completion status of your active projects.</CardDescription>
        <div className="space-y-5 mt-6">
          {data.projectProgress.length === 0 ? (
            <p className="text-sm font-medium text-muted-foreground text-center py-4">No tasks assigned to active projects.</p>
          ) : (
            data.projectProgress.map((project, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-foreground">{project.name}</span>
                  <span className="text-muted-foreground font-medium text-xs">{project.progress}% ({project.completed}/{project.total})</span>
                </div>
                <div className="w-full bg-foreground/[0.04] rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 ease-out"
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
      </div>

      {/* Smart Insights */}
      <div className="world-card p-6 md:p-8 relative overflow-hidden group border-brand-purple/20 bg-brand-purple/5">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-brand-purple/10 rounded-full blur-3xl pointer-events-none group-hover:bg-brand-purple/20 transition-colors duration-700" />
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="p-2.5 rounded-xl bg-brand-purple/15 shadow-[0_0_15px_rgba(167,139,250,0.3)]">
            <BrainCircuit className="h-5 w-5 text-brand-purple animate-pulse" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-foreground tracking-tight">Agent Insights</CardTitle>
            <CardDescription className="text-muted-foreground/80 font-medium mt-0.5">Intelligent observations based on your real activity.</CardDescription>
          </div>
        </div>
        <div className="relative z-10 space-y-3">
          {data.insights.map((insight, idx) => (
            <div key={idx} className="flex items-start gap-4 p-4 world-surface rounded-2xl hover:border-brand-purple/30 transition-all">
              <Lightbulb className="h-4 w-4 text-brand-amber shrink-0 mt-0.5" />
              <p className="text-sm text-foreground leading-relaxed font-semibold">{insight}</p>
            </div>
          ))}
          {data.insights.length === 0 && (
            <div className="text-center p-8 border-2 border-dashed border-border/30 rounded-2xl">
              <p className="text-sm font-semibold text-muted-foreground">
                Your agent is analyzing your data. Check back soon for insights!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
