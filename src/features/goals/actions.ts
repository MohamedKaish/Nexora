'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getGoals() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    if (error.code === 'PGRST205') return [];
    throw error;
  }
  return data || []
}

export async function createGoal(title: string, type: 'daily' | 'weekly' | 'monthly', periodStart: string, periodEnd: string) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id: user.id,
      title,
      type,
      period_start: periodStart,
      period_end: periodEnd,
      status: 'active'
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/', 'layout')
  return data
}

export async function updateGoalStatus(id: string, status: 'active' | 'completed' | 'failed') {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('goals')
    .update({ status })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error
  revalidatePath('/', 'layout')
  return data
}

export async function deleteGoal(id: string) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error
  revalidatePath('/', 'layout')
  return { success: true }
}
