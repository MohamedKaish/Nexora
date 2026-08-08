'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { FocusMode } from '@/store/useFocusStore'

export async function saveFocusSession(
  durationMinutes: number, 
  mode: FocusMode,
  taskId?: string | null
) {
  // We only track actual work sessions, not breaks
  if (mode === 'short_break' || mode === 'long_break') return { success: true }
  
  // Map custom and stopwatch to pomodoro for database compatibility without schema changes
  const dbType = (mode === 'deep_work') ? 'deep_work' : 'pomodoro'
  
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Unauthorized')

  const date = new Date().toISOString().split('T')[0]

  // 1. Create focus_session record
  await supabase.from('focus_sessions').insert({
    user_id: user.id,
    task_id: taskId || null,
    duration_minutes: durationMinutes,
    type: dbType
  })

  // 2. Update task actual_time_minutes if task_id exists
  if (taskId) {
    const { data: task } = await supabase
      .from('tasks')
      .select('id, actual_time_minutes')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single()
      
    if (task) {
      await supabase.from('tasks').update({
        actual_time_minutes: (task.actual_time_minutes || 0) + durationMinutes
      }).eq('id', taskId)
    }
  }

  // 3. Update analytics (focus_time_minutes)
  const { data: analytics } = await supabase
    .from('analytics')
    .select('id, focus_time_minutes')
    .eq('user_id', user.id)
    .eq('date', date)
    .single()
    
  if (analytics) {
    await supabase.from('analytics').update({
      focus_time_minutes: (analytics.focus_time_minutes || 0) + durationMinutes
    }).eq('id', analytics.id)
  } else {
    await supabase.from('analytics').insert({
      user_id: user.id,
      date: date,
      focus_time_minutes: durationMinutes,
      tasks_completed: 0,
      habits_completed: 0
    })
  }

  revalidatePath('/', 'layout')
  
  return { success: true }
}
