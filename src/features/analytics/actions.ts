'use server'

import { createClient, getUser } from '@/lib/supabase/server'
import { startOfWeek, endOfWeek, subWeeks, format, eachDayOfInterval, isSameDay, subMonths, eachMonthOfInterval, startOfMonth, isSameMonth, subYears, startOfYear } from 'date-fns'

export async function getAnalyticsData() {
  const supabase = await createClient()
  const { data: { user } } = await getUser()

  if (!user) {
    return null
  }

  // 1. Fetch data in parallel with strict authenticated user scoping
  const now = new Date()
  const twoWeeksAgo = subWeeks(now, 2)
  const sixMonthsAgo = subMonths(now, 5)
  const thirtyDaysAgo = subWeeks(now, 4)
  const oneYearAgo = subYears(now, 1)
  
  try {
    const [
      { data: projects },
      { data: allTasks },
      { data: habits },
      { data: habitCompletions },
      { data: dailyAnalytics },
      { data: focusSessions }
    ] = await Promise.all([
      supabase.from('projects').select('id, name, color').eq('user_id', user.id).is('deleted_at', null),
      supabase.from('tasks').select('id, project_id, title, status, created_at, updated_at, due_date, estimated_time_minutes, actual_time_minutes').eq('user_id', user.id).is('deleted_at', null),
      supabase.from('habits').select('id, name, streak').eq('user_id', user.id).is('deleted_at', null),
      supabase.from('habit_completions').select('id, completed_date, habit_id').eq('user_id', user.id).gte('completed_date', format(twoWeeksAgo, 'yyyy-MM-dd')),
      supabase.from('analytics').select('date, productivity_score, focus_time_minutes').eq('user_id', user.id).gte('date', format(thirtyDaysAgo, 'yyyy-MM-dd')).order('date', { ascending: true }),
      supabase.from('focus_sessions').select('id, duration_minutes, type, created_at').eq('user_id', user.id).gte('created_at', thirtyDaysAgo.toISOString())
    ])

    // Derive subsets in memory to save 3 database requests
    const completedTasks = (allTasks || []).filter(t => t.status === 'done' && new Date(t.updated_at) >= twoWeeksAgo)
    const monthlyCompletedTasks = (allTasks || []).filter(t => t.status === 'done' && new Date(t.updated_at) >= startOfMonth(sixMonthsAgo))
    const yearlyCompletedTasks = (allTasks || []).filter(t => t.status === 'done' && new Date(t.updated_at) >= startOfYear(oneYearAgo))

    // Transform Data for Recharts
    
    // Weekly Productivity (Tasks Completed Per Day - This Week)
    const startOfCurrentWeek = startOfWeek(now, { weekStartsOn: 1 })
    const endOfCurrentWeek = endOfWeek(now, { weekStartsOn: 1 })
    
    const currentWeekDays = eachDayOfInterval({ start: startOfCurrentWeek, end: endOfCurrentWeek })
    
    const weeklyProductivity = currentWeekDays.map(date => {
      const dayStr = format(date, 'EEE') // Mon, Tue, Wed
      const tasksDone = (completedTasks || []).filter(t => isSameDay(new Date(t.updated_at), date)).length
      return { name: dayStr, tasks: tasksDone }
    })

    // Project Distribution (Tasks done per project)
    const projectDistribution = (projects || []).map(p => {
      const tasksDone = (completedTasks || []).filter(t => t.project_id === p.id).length
      return { name: p.name, value: tasksDone, fill: p.color }
    }).filter(p => p.value > 0)

    // Project Progress
    const projectProgress = (projects || []).map(p => {
      const pTasks = (allTasks || []).filter(t => t.project_id === p.id)
      const total = pTasks.length
      const done = pTasks.filter(t => t.status === 'done').length
      return { 
        name: p.name, 
        completed: done, 
        total: total,
        progress: total > 0 ? Math.round((done / total) * 100) : 0,
        fill: p.color
      }
    }).filter(p => p.total > 0)

    // Monthly Productivity (Last 6 months)
    const lastSixMonths = eachMonthOfInterval({ start: sixMonthsAgo, end: now })
    const monthlyProductivity = lastSixMonths.map(date => {
      const monthStr = format(date, 'MMM')
      const tasksDone = (monthlyCompletedTasks || []).filter(t => isSameMonth(new Date(t.updated_at), date)).length
      return { name: monthStr, tasks: tasksDone }
    })
    
    // Habit Consistency (Completions per day this week)
    const habitConsistency = currentWeekDays.map(date => {
      const dayStr = format(date, 'EEE')
      const completions = (habitCompletions || []).filter(c => c.completed_date === format(date, 'yyyy-MM-dd')).length
      return { name: dayStr, completions }
    })

    // Smart Insights Generation
    const insights: string[] = []

    const thisWeekDone = (completedTasks || []).filter(t => new Date(t.updated_at) >= startOfCurrentWeek).length
    const lastWeekDone = (completedTasks || []).filter(t => new Date(t.updated_at) < startOfCurrentWeek).length
    
    if (thisWeekDone > 0) {
      let growth = 0
      if (lastWeekDone > 0) {
        growth = Math.round(((thisWeekDone - lastWeekDone) / lastWeekDone) * 100)
      } else {
        growth = 100
      }
      
      if (growth > 0) {
        insights.push(`Your productivity increased by ${growth}% compared to last week. Keep it up!`)
      } else if (growth < 0) {
        insights.push(`You completed ${Math.abs(growth)}% fewer tasks this week than last week.`)
      } else {
        insights.push(`You're maintaining a steady pace, completing exactly as many tasks as last week.`)
      }
    } else {
      insights.push(`You haven't completed any tasks this week yet. Time to get started!`)
    }

    const upcomingDeadlines = (allTasks || []).filter(t => 
      t.status !== 'done' && 
      t.due_date && 
      new Date(t.due_date) > now && 
      new Date(t.due_date) < new Date(now.getTime() + (48 * 60 * 60 * 1000))
    ).length

    if (upcomingDeadlines > 0) {
      insights.push(`You have ${upcomingDeadlines} task deadline${upcomingDeadlines > 1 ? 's' : ''} within the next 48 hours.`)
    }

    const bestHabit = (habits || []).sort((a, b) => b.streak - a.streak)[0]
    if (bestHabit && bestHabit.streak > 2) {
      insights.push(`Your "${bestHabit.name}" habit has an impressive ${bestHabit.streak}-day streak.`)
    }

    // Calculate generic completion rate
    const totalCreated = (allTasks || []).length
    const totalCompleted = (allTasks || []).filter(t => t.status === 'done').length
    const completionRate = totalCreated > 0 ? Math.round((totalCompleted / totalCreated) * 100) : 0

    // Calculate Average Task Duration & Kyro Accuracy
    const completedWithTime = (allTasks || []).filter(t => t.status === 'done' && t.actual_time_minutes && t.actual_time_minutes > 0)
    const averageTaskDuration = completedWithTime.length > 0 
      ? Math.round(completedWithTime.reduce((acc, t) => acc + (t.actual_time_minutes || 0), 0) / completedWithTime.length) 
      : 0

    const accuracyScores = completedWithTime.map(t => {
      const est = t.estimated_time_minutes || 0
      const act = t.actual_time_minutes || 0
      if (est === 0 || act === 0) return null
      return Math.min((est / act) * 100, 100)
    }).filter(s => s !== null) as number[]

    const kyroAccuracy = accuracyScores.length > 0 
      ? Math.round(accuracyScores.reduce((a, b) => a + b, 0) / accuracyScores.length) 
      : 100

    // Deep Work Hours (Last 30 days)
    const deepWorkMinutes = (focusSessions || [])
      .filter(s => s.type === 'deep_work')
      .reduce((acc, s) => acc + (s.duration_minutes || 0), 0)
    const deepWorkHours = Math.round((deepWorkMinutes / 60) * 10) / 10

    const totalFocusTime = (dailyAnalytics || []).reduce((acc, curr) => acc + (curr.focus_time_minutes || 0), 0)

    // Yearly Productivity (Last 12 months)
    const lastTwelveMonths = eachMonthOfInterval({ start: startOfYear(now), end: now })
    const yearlyProductivity = lastTwelveMonths.map(date => {
      const monthStr = format(date, 'MMM')
      const tasksDone = (yearlyCompletedTasks || []).filter(t => isSameMonth(new Date(t.updated_at), date)).length
      return { name: monthStr, tasks: tasksDone }
    })

    // Heatmap Data (Last 30 days)
    const heatmapData = eachDayOfInterval({ start: thirtyDaysAgo, end: now }).map(date => {
      const dStr = format(date, 'yyyy-MM-dd')
      const match = (dailyAnalytics || []).find(a => a.date === dStr)
      return {
        date: dStr,
        score: match ? (match.productivity_score || 0) + (match.focus_time_minutes > 0 ? 10 : 0) : 0
      }
    })

    return {
      weeklyProductivity,
      monthlyProductivity,
      yearlyProductivity,
      projectDistribution,
      projectProgress,
      habitConsistency,
      insights,
      completionRate,
      totalCompleted,
      topStreak: bestHabit?.streak || 0,
      totalFocusTime,
      heatmapData,
      averageTaskDuration,
      kyroAccuracy,
      deepWorkHours
    }
  } catch (error) {
    console.error("Failed to fetch analytics data", error)
    return {
      weeklyProductivity: [],
      monthlyProductivity: [],
      yearlyProductivity: [],
      projectDistribution: [],
      projectProgress: [],
      habitConsistency: [],
      insights: ["System is currently syncing data. Check back shortly."],
      completionRate: 0,
      totalCompleted: 0,
      topStreak: 0,
      totalFocusTime: 0,
      heatmapData: [],
      averageTaskDuration: 0,
      kyroAccuracy: 0,
      deepWorkHours: 0
    }
  }
}
