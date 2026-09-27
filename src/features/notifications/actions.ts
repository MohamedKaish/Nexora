'use server'

import { createClient, getUser } from '@/lib/supabase/server'
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
  const { data: { user } } = await getUser()

  if (!user) return []

  // 0. Auto-delete old notifications scoped strictly to user
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  supabase
    .from('notifications')
    .delete()
    .eq('user_id', user.id)
    .lt('created_at', thirtyDaysAgo.toISOString())
    .then()

  // 1. Fetch user data in parallel with explicit user scoping
  const todayDate = new Date()
  const todayStr = todayDate.toISOString().split('T')[0]
  const currentDayOfWeek = todayDate.getDay() // 0 = Sunday, 1 = Monday ... 6 = Saturday

  const [
    { data: persisted },
    { data: tasks },
    { data: projects },
    { data: habits },
    { data: completions },
    { data: slots },
    { data: goals },
    analyticsResponse,
  ] = await Promise.all([
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('tasks')
      .select('id, title, due_date, status, estimated_time_minutes')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .neq('status', 'done'),
    supabase
      .from('projects')
      .select('id, name, due_date, status')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .neq('status', 'completed')
      .not('due_date', 'is', null),
    supabase
      .from('habits')
      .select('id, name')
      .eq('user_id', user.id)
      .is('deleted_at', null),
    supabase
      .from('habit_completions')
      .select('habit_id')
      .eq('completed_date', todayStr)
      .eq('user_id', user.id),
    supabase
      .from('timetable_slots')
      .select('id, label, start_time, end_time')
      .eq('day_of_week', currentDayOfWeek)
      .eq('user_id', user.id)
      .order('start_time', { ascending: true }),
    supabase
      .from('goals')
      .select('id, title, type, period_end')
      .eq('user_id', user.id)
      .neq('status', 'completed')
      .neq('status', 'failed')
      .not('period_end', 'is', null),
    todayDate.getHours() >= 17
      ? supabase
          .from('analytics')
          .select('tasks_completed, habits_completed')
          .eq('date', todayStr)
          .eq('user_id', user.id)
          .single()
      : Promise.resolve({ data: null }),
  ])

  // 2. Generate virtual system reminders from real stored data
  const virtualNotifications: Notification[] = []

  if (tasks) {
    tasks.forEach((task) => {
      if (!task.due_date) return
      try {
        const dueDate = parseISO(task.due_date)
        if (isPast(dueDate) && !isToday(dueDate)) {
          virtualNotifications.push({
            id: `virtual-overdue-${task.id}`,
            title: 'Overdue Task',
            message: `"${task.title}" is overdue.`,
            type: 'reminder',
            is_read: false,
            created_at: new Date().toISOString(),
          })
        } else if (isToday(dueDate)) {
          virtualNotifications.push({
            id: `virtual-today-${task.id}`,
            title: 'Due Today',
            message: `"${task.title}" is due today.`,
            type: 'reminder',
            is_read: false,
            created_at: new Date().toISOString(),
          })
        } else if (isTomorrow(dueDate)) {
          virtualNotifications.push({
            id: `virtual-tomorrow-${task.id}`,
            title: 'Due Tomorrow',
            message: `"${task.title}" is due tomorrow.`,
            type: 'system',
            is_read: false,
            created_at: new Date().toISOString(),
          })
        }
      } catch {
        // Invalid date format skipped
      }
    })
  }

  if (projects) {
    projects.forEach((project) => {
      if (!project.due_date) return
      try {
        const dueDate = parseISO(project.due_date)
        if (isPast(dueDate) && !isToday(dueDate)) {
          virtualNotifications.push({
            id: `virtual-proj-overdue-${project.id}`,
            title: 'Project Overdue',
            message: `Project "${project.name}" is overdue.`,
            type: 'kyro',
            is_read: false,
            created_at: todayDate.toISOString(),
          })
        } else if (isToday(dueDate)) {
          virtualNotifications.push({
            id: `virtual-proj-today-${project.id}`,
            title: 'Project Deadline',
            message: `Project "${project.name}" is due today.`,
            type: 'kyro',
            is_read: false,
            created_at: todayDate.toISOString(),
          })
        }
      } catch {
        // Invalid date skipped
      }
    })
  }

  if (habits && habits.length > 0) {
    const completedHabitIds = new Set(completions?.map((c) => c.habit_id) || [])

    habits.forEach((habit) => {
      if (!completedHabitIds.has(habit.id)) {
        virtualNotifications.push({
          id: `virtual-habit-missed-${habit.id}`,
          title: 'Habit Reminder',
          message: `Don't forget to complete "${habit.name}" today!`,
          type: 'reminder',
          is_read: false,
          created_at: todayDate.toISOString(),
        })
      }
    })
  }

  if (slots && slots.length > 0) {
    virtualNotifications.push({
      id: 'virtual-schedule-today',
      title: "Today's Schedule",
      message: `You have ${slots.length} session(s) scheduled for today. First session: ${slots[0].label} at ${slots[0].start_time}.`,
      type: 'system',
      is_read: false,
      created_at: todayDate.toISOString(),
    })
  }

  // Goal Period Warnings
  if (goals && goals.length > 0) {
    goals.forEach((goal) => {
      if (!goal.period_end) return
      try {
        const targetMs = new Date(goal.period_end).getTime()
        const daysLeft = Math.ceil((targetMs - todayDate.getTime()) / (1000 * 60 * 60 * 24))

        if (daysLeft >= 0 && daysLeft <= 2) {
          virtualNotifications.push({
            id: `virtual-goal-urgent-${goal.id}`,
            title: 'Goal Period Ending Soon',
            message: `${goal.type} goal "${goal.title}" period ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`,
            type: 'kyro',
            is_read: false,
            created_at: todayDate.toISOString(),
          })
        }
      } catch {
        // Invalid date format skipped
      }
    })
  }

  if (todayDate.getHours() >= 17) {
    const analytics = analyticsResponse.data
    if (!analytics || (analytics.tasks_completed === 0 && analytics.habits_completed === 0)) {
      virtualNotifications.push({
        id: 'virtual-kyro-alert',
        title: 'Kyro Insight',
        message: "It's getting late and no tasks or habits have been logged yet. Take a small step!",
        type: 'kyro',
        is_read: false,
        created_at: todayDate.toISOString(),
      })
    }
  }

  // Combine persisted and virtual notifications, sorted descending by created_at
  const allNotifications = [...(persisted || []), ...virtualNotifications].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return allNotifications as Notification[]
}

export async function createNotification(input: {
  title: string
  message: string
  type: 'system' | 'reminder' | 'achievement' | 'kyro'
}) {
  const supabase = await createClient()
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: user.id,
      title: input.title.trim(),
      message: input.message.trim(),
      type: input.type,
      is_read: false,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Creates an idempotent notification.
 * Prevents duplicate notification spam within the specified cooldown window (default 24h).
 */
export async function createIdempotentNotification(input: {
  title: string
  message: string
  type: 'system' | 'reminder' | 'achievement' | 'kyro'
  cooldownHours?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  const cooldownHours = input.cooldownHours ?? 24
  const cutoff = new Date(Date.now() - cooldownHours * 3600 * 1000).toISOString()

  // Check if an identical notification was recently generated
  const { data: existing } = await supabase
    .from('notifications')
    .select('id, title, created_at')
    .eq('user_id', user.id)
    .eq('title', input.title.trim())
    .gte('created_at', cutoff)
    .limit(1)

  if (existing && existing.length > 0) {
    return { created: false, notification: existing[0] }
  }

  const created = await createNotification(input)
  return { created: true, notification: created }
}

export async function markNotificationAsRead(id: string) {
  if (id.startsWith('virtual-')) {
    // Virtual notification read state is managed client-side
    return
  }

  const supabase = await createClient()
  const { data: { user } } = await getUser()
  if (!user) return

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('user_id', user.id)
}

export async function markAllNotificationsAsRead() {
  const supabase = await createClient()
  const { data: { user } } = await getUser()
  if (!user) return

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)
}
