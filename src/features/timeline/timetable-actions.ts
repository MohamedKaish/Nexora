'use server'

import { createClient, getUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getTimetableSlots() {
  const supabase = await createClient()
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('timetable_slots')
    .select('*')
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  return data
}

export async function createTimetableSlot(input: { day_of_week: number, start_time: string, end_time: string, label: string, color?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  if (input.day_of_week < 0 || input.day_of_week > 6) {
    throw new Error('day_of_week must be between 0 (Sunday) and 6 (Saturday)')
  }

  const { data, error } = await supabase
    .from('timetable_slots')
    .insert({
      ...input,
      user_id: user.id
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  
  revalidatePath('/', 'layout')
  return data
}

export async function updateTimetableSlot(
  id: string,
  input: Partial<{ day_of_week: number, start_time: string, end_time: string, label: string, color: string }>
) {
  const supabase = await createClient()
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  if (input.day_of_week !== undefined && (input.day_of_week < 0 || input.day_of_week > 6)) {
    throw new Error('day_of_week must be between 0 (Sunday) and 6 (Saturday)')
  }

  const { data, error } = await supabase
    .from('timetable_slots')
    .update(input)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  
  revalidatePath('/', 'layout')
  return data
}

export async function deleteTimetableSlot(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('timetable_slots')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/', 'layout')
  return { success: true }
}
