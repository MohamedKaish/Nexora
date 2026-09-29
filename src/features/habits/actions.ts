'use server'

import { createClient, getUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { habitSchema, calculateHabitStreak } from '@/lib/validations/habits'

export async function getHabits() {
  const supabase = await createClient()
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('habits')
    .select('*, habit_completions(*)')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') return []
    throw new Error(error.message)
  }
  return data || []
}

export async function createHabit(name: string, frequency: 'daily' | 'weekly' | 'weekdays', color: string) {
  const supabase = await createClient()
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  // Resource limit: max 50 active habits per user
  const { count, error: countError } = await supabase
    .from('habits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('deleted_at', null)

  if (countError) throw new Error(countError.message)
  if (count !== null && count >= 50) {
    throw new Error('You have reached the maximum limit of 50 active habits. Please delete some habits before creating new ones.')
  }

  const validated = habitSchema.parse({ name: name.trim(), frequency, color })

  const { data, error } = await supabase
    .from('habits')
    .insert({
      user_id: user.id,
      name: validated.name,
      frequency: validated.frequency,
      color: validated.color,
      streak: 0,
    })
    .select('*, habit_completions(*)')
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/', 'layout')
  return {
    ...data,
    habit_completions: data.habit_completions || [],
  }
}

export async function updateHabit(
  id: string,
  input: Partial<{ name: string; frequency: 'daily' | 'weekly' | 'weekdays'; color: string }>
) {
  const supabase = await createClient()
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  const validated = habitSchema.partial().parse(input)

  const { data, error } = await supabase
    .from('habits')
    .update({
      ...validated,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*, habit_completions(*)')
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/', 'layout')
  return data
}

export async function toggleHabitCompletion(habitId: string, dateStr: string) {
  const supabase = await createClient()
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  // 1. Verify habit ownership
  const { data: habit, error: habitError } = await supabase
    .from('habits')
    .select('id, streak')
    .eq('id', habitId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (habitError || !habit) {
    throw new Error('Habit not found or unauthorized')
  }

  // 2. Check existing completion for date
  const { data: existing } = await supabase
    .from('habit_completions')
    .select('id')
    .eq('habit_id', habitId)
    .eq('user_id', user.id)
    .eq('completed_date', dateStr)
    .single()

  let isCompletedNow = false

  if (existing) {
    const { error: delError } = await supabase
      .from('habit_completions')
      .delete()
      .eq('id', existing.id)
      .eq('user_id', user.id)
    if (delError) throw new Error(delError.message)
    isCompletedNow = false
  } else {
    const { error: insError } = await supabase
      .from('habit_completions')
      .insert({
        user_id: user.id,
        habit_id: habitId,
        completed_date: dateStr,
      })
    if (insError) throw new Error(insError.message)
    isCompletedNow = true
  }

  // 3. Compute real streak from all stored completions
  const { data: allCompletions } = await supabase
    .from('habit_completions')
    .select('completed_date')
    .eq('habit_id', habitId)
    .eq('user_id', user.id)

  const completedDates = (allCompletions || []).map((c) => c.completed_date)
  const newStreak = calculateHabitStreak(completedDates)

  await supabase
    .from('habits')
    .update({ streak: newStreak, updated_at: new Date().toISOString() })
    .eq('id', habitId)
    .eq('user_id', user.id)

  // 4. Update analytics safely
  try {
    const { data: analytics } = await supabase
      .from('analytics')
      .select('id, habits_completed')
      .eq('user_id', user.id)
      .eq('date', dateStr)
      .single()

    const diff = isCompletedNow ? 1 : -1
    if (analytics) {
      await supabase
        .from('analytics')
        .update({
          habits_completed: Math.max(0, analytics.habits_completed + diff),
        })
        .eq('id', analytics.id)
    } else if (isCompletedNow) {
      await supabase.from('analytics').insert({
        user_id: user.id,
        date: dateStr,
        habits_completed: 1,
      })
    }
  } catch (analyticsErr) {
    console.warn('Analytics update skipped:', analyticsErr)
  }

  revalidatePath('/', 'layout')
  return { success: true, isCompleted: isCompletedNow, streak: newStreak }
}

export async function deleteHabit(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('habits')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/', 'layout')
  return { success: true }
}
