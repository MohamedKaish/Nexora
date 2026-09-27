'use server'

import { createClient, getUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { FocusMode } from './types'

export async function getFocusSessions(limit = 20) {
  const supabase = await createClient()
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('focus_sessions')
    .select('*, tasks(id, title)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') return []
    throw new Error(error.message)
  }
  return data || []
}

export async function getFocusStats() {
  const supabase = await createClient()
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  const todayStr = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('focus_sessions')
    .select('duration_minutes, created_at')
    .eq('user_id', user.id)

  if (error) {
    return { todayMinutes: 0, todaySessions: 0, totalMinutes: 0 }
  }

  const sessions = data || []
  let todayMinutes = 0
  let todaySessions = 0
  let totalMinutes = 0

  for (const s of sessions) {
    const mins = s.duration_minutes || 0
    totalMinutes += mins
    if (s.created_at && s.created_at.startsWith(todayStr)) {
      todayMinutes += mins
      todaySessions += 1
    }
  }

  return { todayMinutes, todaySessions, totalMinutes }
}

export async function saveFocusSession(
  durationMinutes: number,
  mode: FocusMode,
  taskId?: string | null
) {
  // We only track actual work sessions, not breaks
  if (mode === 'short_break' || mode === 'long_break') return { success: true }

  const mins = Math.max(1, Math.round(durationMinutes))

  // Map custom and stopwatch to pomodoro for database compatibility without schema changes
  const dbType: 'pomodoro' | 'deep_work' = mode === 'deep_work' ? 'deep_work' : 'pomodoro'

  const supabase = await createClient()
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  const date = new Date().toISOString().split('T')[0]

  // Validate task ownership if taskId is provided
  let validatedTaskId: string | null = null
  if (taskId) {
    const { data: task } = await supabase
      .from('tasks')
      .select('id, actual_time_minutes')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (task) {
      validatedTaskId = task.id
      // Update task actual_time_minutes
      await supabase
        .from('tasks')
        .update({
          actual_time_minutes: (task.actual_time_minutes || 0) + mins,
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id)
        .eq('user_id', user.id)
    }
  }

  // 1. Create focus_session record
  const { error: insertError } = await supabase.from('focus_sessions').insert({
    user_id: user.id,
    task_id: validatedTaskId,
    duration_minutes: mins,
    type: dbType,
  })

  if (insertError) {
    console.error('Failed to save focus session:', insertError)
    throw new Error(insertError.message)
  }

  // 2. Update analytics (focus_time_minutes) safely
  try {
    const { data: analytics } = await supabase
      .from('analytics')
      .select('id, focus_time_minutes')
      .eq('user_id', user.id)
      .eq('date', date)
      .single()

    if (analytics) {
      await supabase
        .from('analytics')
        .update({
          focus_time_minutes: (analytics.focus_time_minutes || 0) + mins,
        })
        .eq('id', analytics.id)
    } else {
      await supabase.from('analytics').insert({
        user_id: user.id,
        date: date,
        focus_time_minutes: mins,
        tasks_completed: 0,
        habits_completed: 0,
      })
    }
  } catch (analyticsErr) {
    console.warn('Analytics update skipped for focus session:', analyticsErr)
  }

  revalidatePath('/', 'layout')
  return { success: true, durationMinutes: mins }
}
