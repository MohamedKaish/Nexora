'use server'

import { createClient, getUser } from '@/lib/supabase/server'
import { TaskInput, taskSchema, updateTaskSchema } from '@/lib/validations/tasks'
import { revalidatePath } from 'next/cache'

export async function getTasks(projectId?: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  let query = supabase
    .from('tasks')
    .select('*, subtasks(*)')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  const { data, error } = await query

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') return []
    throw new Error(error.message)
  }
  return data || []
}

export async function getTodayTasks() {
  const supabase = await createClient()
  
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('tasks')
    .select('*, subtasks(*)')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .or(`is_schedule_for_today.eq.true,due_date.gte.${today}T00:00:00Z,due_date.lte.${today}T23:59:59Z`)
    .order('priority', { ascending: false })

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') return []
    throw new Error(error.message)
  }
  return data || []
}

export async function createTask(input: TaskInput) {
  const supabase = await createClient()
  
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  // Resource limit: max 500 active tasks per user
  const { count, error: countError } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .neq('status', 'done')

  if (countError) throw new Error(countError.message)
  if (count !== null && count >= 500) {
    throw new Error('You have reached the maximum limit of 500 active tasks. Please complete or delete some tasks before creating new ones.')
  }

  const parsed = taskSchema.parse(input)

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      ...parsed,
      user_id: user.id,
    })
    .select('*, subtasks(*)')
    .single()

  if (error) throw new Error(error.message)
  
  revalidatePath('/', 'layout')
  return {
    ...data,
    subtasks: data.subtasks || [],
  }
}

export async function updateTask(id: string, input: Partial<TaskInput>) {
  const supabase = await createClient()
  
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  const parsed = updateTaskSchema.parse(input)
  const fieldsToUpdate = Object.entries(parsed).reduce((acc, [key, val]) => {
    if (val !== undefined) acc[key] = val
    return acc
  }, {} as Record<string, unknown>)

  const { data, error } = await supabase
    .from('tasks')
    .update({
      ...fieldsToUpdate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*, subtasks(*)')
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error(`Task with ID ${id} not found or access denied`)
  
  revalidatePath('/', 'layout')
  return data
}

export async function toggleTaskStatus(id: string, currentStatus: 'todo' | 'in_progress' | 'done') {
  const newStatus = currentStatus === 'done' ? 'todo' : 'done'
  const result = await updateTask(id, { status: newStatus })
  
  // Update analytics safely without blocking task toggle
  try {
    const supabase = await createClient()
    const { data: { user } } = await getUser()
    if (user) {
      const today = new Date().toISOString().split('T')[0]
      const { data: analytics } = await supabase
        .from('analytics')
        .select('id, tasks_completed')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()
        
      if (analytics) {
        await supabase.from('analytics').update({
          tasks_completed: Math.max(0, analytics.tasks_completed + (newStatus === 'done' ? 1 : -1))
        }).eq('id', analytics.id)
      } else if (newStatus === 'done') {
        await supabase.from('analytics').insert({
          user_id: user.id,
          date: today,
          tasks_completed: 1
        })
      }
    }
  } catch (analyticsErr) {
    console.warn('Analytics update skipped:', analyticsErr)
  }
  
  revalidatePath('/', 'layout')
  return result
}

export async function deleteTask(id: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('tasks')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function createSubtask(taskId: string, title: string) {
  const supabase = await createClient()
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  const trimmedTitle = title.trim()
  if (!trimmedTitle) throw new Error('Subtask title is required')

  // Verify parent task belongs to user and is not deleted
  const { data: parentTask, error: parentError } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', taskId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (parentError || !parentTask) {
    throw new Error('Parent task not found or unauthorized')
  }

  const { data, error } = await supabase
    .from('subtasks')
    .insert({
      user_id: user.id,
      task_id: taskId,
      title: trimmedTitle,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  
  revalidatePath('/', 'layout')
  return data
}

export async function toggleSubtask(id: string, is_completed: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('subtasks')
    .update({
      is_completed,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  
  revalidatePath('/', 'layout')
  return data
}

export async function deleteSubtask(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('subtasks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/', 'layout')
  return { success: true }
}
