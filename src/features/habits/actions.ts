'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getHabits() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('habits')
    .select('*, habit_completions(*)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') return [];
    throw new Error(error.message);
  }
  return data || [];
}

export async function createHabit(name: string, frequency: 'daily' | 'weekly' | 'weekdays', color: string) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('habits')
    .insert({
      user_id: user.id,
      name,
      frequency,
      color
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  
  revalidatePath('/', 'layout')
  return data
}

export async function toggleHabitCompletion(habitId: string, dateStr: string) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Unauthorized')

  // Check if exists
  const { data: existing } = await supabase
    .from('habit_completions')
    .select('id')
    .eq('habit_id', habitId)
    .eq('completed_date', dateStr)
    .single()

  let increment = 0

  if (existing) {
    await supabase.from('habit_completions').delete().eq('id', existing.id)
    increment = -1
  } else {
    await supabase.from('habit_completions').insert({
      user_id: user.id,
      habit_id: habitId,
      completed_date: dateStr
    })
    increment = 1
  }

  // Update streak logic
  const { data: habit } = await supabase.from('habits').select('streak').eq('id', habitId).single()
  if (habit) {
    await supabase.from('habits').update({ streak: Math.max(0, habit.streak + increment) }).eq('id', habitId)
  }

  // Update analytics
  const { data: analytics } = await supabase
    .from('analytics')
    .select('id, habits_completed')
    .eq('user_id', user.id)
    .eq('date', dateStr)
    .single()
    
  if (analytics) {
    await supabase.from('analytics').update({
      habits_completed: Math.max(0, analytics.habits_completed + increment)
    }).eq('id', analytics.id)
  } else if (increment > 0) {
    await supabase.from('analytics').insert({
      user_id: user.id,
      date: dateStr,
      habits_completed: 1
    })
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function deleteHabit(id: string) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('habits')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/', 'layout')
  return { success: true }
}
