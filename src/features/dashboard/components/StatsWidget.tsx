import { getTodayTasks } from '@/features/tasks/actions'
import { getProjects } from '@/features/projects/actions'
import { getHabits } from '@/features/habits/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, ListTodo, FolderKanban, Flame } from 'lucide-react'

export async function StatsWidget() {
  const [todayTasks, projects, habits] = await Promise.all([
    getTodayTasks(),
    getProjects(),
    getHabits()
  ])

  const completedToday = todayTasks.filter(t => t.status === 'done').length
  const pendingToday = todayTasks.length - completedToday
  const activeProjects = projects.filter((p: { status: string }) => p.status === 'active').length
  
  const topStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0
  const topHabit = habits.length > 0 ? habits.reduce((prev, current) => (prev.streak > current.streak) ? prev : current).name : 'No habits'

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-8">
      {[
        { label: 'Tasks Today', icon: ListTodo, value: todayTasks.length, subtext: `${pendingToday} remaining`, color: 'blue' },
        { label: 'Completed', icon: CheckCircle2, value: completedToday, subtext: 'Great job!', color: 'emerald' },
        { label: 'Active Projects', icon: FolderKanban, value: activeProjects, subtext: 'In progress', color: 'purple' },
        { label: 'Habit Streak', icon: Flame, value: `${topStreak} days`, subtext: topHabit, color: 'amber' },
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
  )
}
