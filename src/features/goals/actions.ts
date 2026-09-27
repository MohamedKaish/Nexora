'use server'

import { createClient, getUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { goalSchema } from '@/lib/validations/goals'

export async function getGoals() {
  const supabase = await createClient()
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') return []
    throw new Error(error.message)
  }
  return data || []
}

export async function createGoal(
  title: string,
  type: 'daily' | 'weekly' | 'monthly',
  periodStart: string,
  periodEnd: string
) {
  const supabase = await createClient()
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  const validated = goalSchema.parse({
    title: title.trim(),
    type,
    status: 'active',
    period_start: periodStart,
    period_end: periodEnd,
  })

  const { data, error } = await supabase
    .from('goals')
    .insert({
      ...validated,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
  return data
}

export async function updateGoal(
  id: string,
  input: Partial<{ title: string; type: 'daily' | 'weekly' | 'monthly'; status: 'active' | 'completed' | 'failed' }>
) {
  const supabase = await createClient()
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  const validated = goalSchema.partial().parse(input)

  const { data, error } = await supabase
    .from('goals')
    .update(validated)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
  return data
}

export async function updateGoalStatus(id: string, status: 'active' | 'completed' | 'failed') {
  return updateGoal(id, { status })
}

export async function deleteGoal(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
  return { success: true }
}
