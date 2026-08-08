'use server'

import { createClient } from '@/lib/supabase/server'
import { isToday, isTomorrow, isPast, parseISO } from 'date-fns'

export type Notification = {
  id: string
  title: string
  message: string
  type: 'system' | 'reminder' | 'achievement' | 'kyro'
  is_read: boolean
  created_at: string
}

export async function getNotifications(): Promise<Notification[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  // 0. Auto-delete notifications older than 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  await supabase
    .from('notifications')
    .delete()
    .lt('created_at', thirtyDaysAgo.toISOString())

  // 1. Get persisted notifications
  const { data: persisted } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  // 2. Generate virtual system notifications
  const virtualNotifications: Notification[] = []
  const todayDate = new Date()
  const todayStr = todayDate.toISOString().split('T')[0]
  const currentDayOfWeek = todayDate.getDay() // 0 = Sunday, 1 = Monday

  
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, due_date, status')
    .neq('status', 'done')
    .not('due_date', 'is', null)

  if (tasks) {
    tasks.forEach(task => {
      if (!task.due_date) return
      
      const dueDate = parseISO(task.due_date)
      
      if (isPast(dueDate) && !isToday(dueDate)) {
        virtualNotifications.push({
          id: `virtual-overdue-${task.id}`,
          title: 'Overdue Task',
          message: `"${task.title}" is overdue.`,
          type: 'reminder',
          is_read: false,
          created_at: new Date().toISOString()
        })
      } else if (isToday(dueDate)) {
        virtualNotifications.push({
          id: `virtual-today-${task.id}`,
          title: 'Due Today',
          message: `"${task.title}" is due today.`,
          type: 'reminder',
          is_read: false,
          created_at: new Date().toISOString()
        })
      } else if (isTomorrow(dueDate)) {
        virtualNotifications.push({
          id: `virtual-tomorrow-${task.id}`,
          title: 'Due Tomorrow',
          message: `"${task.title}" is due tomorrow.`,
          type: 'system',
          is_read: false,
          created_at: new Date().toISOString()
        })
      }
    })
  }

  // Projects
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, due_date, status')
    .neq('status', 'completed')
    .not('due_date', 'is', null)

  if (projects) {
    projects.forEach(project => {
      if (!project.due_date) return
      const dueDate = parseISO(project.due_date)
      
      if (isPast(dueDate) && !isToday(dueDate)) {
        virtualNotifications.push({
          id: `virtual-proj-overdue-${project.id}`,
          title: 'Project Overdue',
          message: `Project "${project.name}" is overdue.`,
          type: 'kyro',
          is_read: false,
          created_at: todayDate.toISOString()
        })
      } else if (isToday(dueDate)) {
        virtualNotifications.push({
          id: `virtual-proj-today-${project.id}`,
          title: 'Project Deadline',
          message: `Project "${project.name}" is due today.`,
          type: 'kyro',
          is_read: false,
          created_at: todayDate.toISOString()
        })
      }
    })
  }

  // Habits
  const { data: habits } = await supabase
    .from('habits')
    .select('id, name')
  
  if (habits && habits.length > 0) {
    const { data: completions } = await supabase
      .from('habit_completions')
      .select('habit_id')
      .eq('completed_date', todayStr)
      .eq('user_id', user.id)
    
    const completedHabitIds = new Set(completions?.map(c => c.habit_id) || [])
    
    habits.forEach(habit => {
      if (!completedHabitIds.has(habit.id)) {
        virtualNotifications.push({
          id: `virtual-habit-missed-${habit.id}`,
          title: 'Habit Reminder',
          message: `Don't forget to complete "${habit.name}" today!`,
          type: 'reminder',
          is_read: false,
          created_at: todayDate.toISOString()
        })
      }
    })
  }

  // Timetable
  const { data: slots } = await supabase
    .from('timetable_slots')
    .select('id, label, start_time')
    .eq('day_of_week', currentDayOfWeek)
    .eq('user_id', user.id)
    .order('start_time', { ascending: true })

  if (slots && slots.length > 0) {
    virtualNotifications.push({
      id: `virtual-schedule-today`,
      title: 'Today\'s Schedule',
      message: `You have ${slots.length} session(s) scheduled for today. First session: ${slots[0].label} at ${slots[0].start_time}.`,
      type: 'system',
      is_read: false,
      created_at: todayDate.toISOString()
    })
  }

  // Low Productivity Alert (Example logic: if it's past 5 PM and 0 tasks completed today)
  if (todayDate.getHours() >= 17) {
    const { data: analytics } = await supabase
      .from('analytics')
      .select('tasks_completed, habits_completed')
      .eq('date', todayStr)
      .eq('user_id', user.id)
      .single()
      
    if (!analytics || (analytics.tasks_completed === 0 && analytics.habits_completed === 0)) {
      virtualNotifications.push({
        id: `virtual-kyro-alert`,
        title: 'Kyro Insight',
        message: `It's getting late and no tasks or habits have been logged yet. Take a small step!`,
        type: 'kyro',
        is_read: false,
        created_at: todayDate.toISOString()
      })
    }
  }

  // Combine and sort
  const allNotifications = [...(persisted || []), ...virtualNotifications]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return allNotifications as Notification[]
}

export async function markNotificationAsRead(id: string) {
  if (id.startsWith('virtual-')) {
    // Virtual notifications don't persist read state yet in this architecture
    return
  }
  
  const supabase = await createClient()
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
}

export async function markAllNotificationsAsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)
}
