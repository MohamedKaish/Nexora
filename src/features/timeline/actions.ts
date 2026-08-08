'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getCalendarEvents() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Unauthorized')

  const { data, error } = await supabase.from('calendar_events').select('*').order('start_time', { ascending: true })
  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') return [];
    throw new Error(error.message);
  }
  return data
}

export async function createCalendarEvent(title: string, start_time: string, end_time: string, is_all_day: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase.from('calendar_events').insert({ title, start_time, end_time, is_all_day, user_id: user.id }).select().single()
  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
  return data
}

export async function updateCalendarEvent(id: string, updates: Partial<{ title: string; start_time: string; end_time: string; is_all_day: boolean }>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase.from('calendar_events').update(updates).eq('id', id).eq('user_id', user.id).select().single()
  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
  return data
}

export async function deleteCalendarEvent(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('calendar_events').delete().eq('id', id).eq('user_id', user.id)
  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function getTimelineBlocksForCalendar(startDate: string, endDate: string) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('timeline_blocks')
    .select('id, start_time, end_time, title, is_fixed, block_type, type')
    .gte('end_time', startDate)
    .lte('start_time', endDate)
    .order('start_time', { ascending: true })

  if (error) {
    if (error.code === 'PGRST205') {
      console.warn("timeline_blocks table missing, skipping fetch.");
      return [];
    }
    throw new Error(error.message)
  }
  
  return data.map(block => ({
    id: block.id,
    title: block.title,
    start: block.start_time,
    end: block.end_time,
    backgroundColor: block.is_fixed ? 'hsl(var(--brand-emerald))' : 'hsl(var(--primary))',
    borderColor: 'transparent',
    extendedProps: {
      isFixed: block.is_fixed,
      blockType: block.block_type,
      type: block.type
    }
  }))
}
