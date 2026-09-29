'use server'

import { createClient, getUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { KyroContext } from '@/features/kyro/types'
import { KyroEngine } from '@/features/kyro/core/KyroEngine'

export async function getCalendarEvents() {
  const supabase = await createClient()
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', user.id)
    .order('start_time', { ascending: true })

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') return []
    throw new Error(error.message)
  }
  return data
}

export async function createCalendarEvent(title: string, start_time: string, end_time: string, is_all_day: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  // Resource limit: max 200 calendar events per user
  const { count, error: countError } = await supabase
    .from('calendar_events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (countError) throw new Error(countError.message)
  if (count !== null && count >= 200) {
    throw new Error('You have reached the maximum limit of 200 calendar events. Please delete some before creating new ones.')
  }

  const { data, error } = await supabase
    .from('calendar_events')
    .insert({ title, start_time, end_time, is_all_day, user_id: user.id })
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
  return data
}

export async function updateCalendarEvent(id: string, updates: Partial<{ title: string; start_time: string; end_time: string; is_all_day: boolean }>) {
  const supabase = await createClient()
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('calendar_events')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
  return data
}

export async function deleteCalendarEvent(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
  return { success: true }
}

/**
 * Fetches real authenticated tasks, calendar events, habits, and weekly timetable slots from Supabase
 * to construct the comprehensive KyroContext needed for the deterministic scheduling engine.
 */
export async function getKyroSchedulingContext(): Promise<KyroContext> {
  const supabase = await createClient()
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  const [tasksRes, eventsRes, habitsRes, slotsRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title, priority, due_date, estimated_time_minutes, status, is_urgent, is_important, is_schedule_for_today, project_id')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .neq('status', 'done')
      .order('created_at', { ascending: false }),
    supabase
      .from('calendar_events')
      .select('id, title, start_time, end_time')
      .eq('user_id', user.id)
      .order('start_time', { ascending: true }),
    supabase
      .from('habits')
      .select('id, name, frequency')
      .eq('user_id', user.id)
      .is('deleted_at', null),
    supabase
      .from('timetable_slots')
      .select('id, label, day_of_week, start_time, end_time, color')
      .eq('user_id', user.id)
  ])

  const tasks = (tasksRes.data || []).map(t => ({
    id: t.id,
    title: t.title,
    priority: (t.priority || 'medium') as 'low' | 'medium' | 'high' | 'urgent',
    estimatedMinutes: t.estimated_time_minutes && t.estimated_time_minutes > 0 ? t.estimated_time_minutes : 30,
    dueDate: t.due_date,
    isUrgent: Boolean(t.is_urgent),
    isImportant: Boolean(t.is_important),
    isScheduledForToday: Boolean(t.is_schedule_for_today),
    projectId: t.project_id
  }))

  const calendarEvents = (eventsRes.data || []).map(e => ({
    id: e.id,
    title: e.title,
    startTime: e.start_time,
    endTime: e.end_time
  }))

  const habits = (habitsRes.data || []).map(h => ({
    id: h.id,
    name: h.name,
    frequency: h.frequency
  }))

  const timetableSlots = (slotsRes.data || []).map(s => ({
    id: s.id,
    label: s.label,
    dayOfWeek: s.day_of_week,
    startTime: s.start_time,
    endTime: s.end_time,
    color: s.color
  }))

  return {
    tasks,
    habits,
    calendarEvents,
    timetableSlots
  }
}

/**
 * Server action to run Kyro conflict & capacity diagnosis for a specific target date.
 */
export async function getKyroDiagnostics(targetDateIso?: string) {
  const context = await getKyroSchedulingContext()
  const engine = new KyroEngine()
  const date = targetDateIso ? new Date(targetDateIso) : new Date()
  return engine.diagnose(context, date)
}

/**
 * Loads timeline blocks for the calendar display.
 * First checks timeline_blocks if present in the database.
 * If empty or table unavailable, gracefully falls back to fixed calendar_events.
 */
export async function getTimelineBlocksForCalendar(startDate: string, endDate: string) {
  const supabase = await createClient()
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  // 1. Try querying timeline_blocks
  try {
    const { data, error } = await supabase
      .from('timeline_blocks')
      .select('id, start_time, end_time, title, is_fixed, block_type, type')
      .eq('user_id', user.id)
      .gte('end_time', startDate)
      .lte('start_time', endDate)
      .order('start_time', { ascending: true })

    if (!error && data && data.length > 0) {
      return data.map(block => ({
        id: block.id,
        title: block.title,
        start: block.start_time,
        end: block.end_time,
        backgroundColor: block.is_fixed ? 'hsl(var(--brand-emerald, 158 64% 52%))' : 'hsl(var(--primary))',
        borderColor: 'transparent',
        extendedProps: {
          isFixed: block.is_fixed,
          blockType: block.block_type,
          type: block.type
        }
      }))
    }
  } catch {
    // If timeline_blocks query fails, fall through to calendar_events
  }

  // 2. Fallback: Fetch calendar events within the active timeframe so the calendar reflects real user events
  const { data: calEvents, error: calError } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', user.id)
    .gte('end_time', startDate)
    .lte('start_time', endDate)
    .order('start_time', { ascending: true })

  if (calError || !calEvents) {
    return []
  }

  return calEvents.map(e => ({
    id: `cal-${e.id}`,
    title: e.title,
    start: e.start_time,
    end: e.end_time,
    backgroundColor: 'hsl(var(--brand-emerald, 158 64% 52%))',
    borderColor: 'transparent',
    extendedProps: {
      isFixed: true,
      blockType: 'calendar',
      type: 'calendar'
    }
  }))
}

export interface BlockPersistencePayload {
  id: string
  title: string
  type: string
  startTime: string | null
  endTime: string | null
  priority?: string
  isFixed?: boolean
}

export interface SaveTimelineResult {
  success: boolean
  persisted: boolean
  count?: number
  reason?: string
  error?: string
}

/**
 * Persists scheduled blocks to timeline_blocks table scoped to the target timeframe,
 * preventing duplicate blocks upon repeated Reflow and strictly reporting database errors.
 */
export async function saveTimelineBlocks(
  blocks: BlockPersistencePayload[],
  timeframe?: { start: string; end: string }
): Promise<SaveTimelineResult> {
  const supabase = await createClient()
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  try {
    const dynamicRows = blocks
      .filter(b => b.type !== 'calendar' && !b.isFixed)
      .map(b => ({
        user_id: user.id,
        title: b.title,
        block_type: 'kyro',
        type: b.type,
        start_time: b.startTime || new Date().toISOString(),
        end_time: b.endTime || new Date().toISOString(),
        is_fixed: false,
        score: 0
      }))

    // Delete previous dynamic blocks scoped to timeframe to avoid duplicates
    let deleteQuery = supabase
      .from('timeline_blocks')
      .delete()
      .eq('user_id', user.id)
      .eq('is_fixed', false)

    if (timeframe?.start && timeframe?.end) {
      deleteQuery = deleteQuery
        .gte('start_time', timeframe.start)
        .lte('end_time', timeframe.end)
    }

    const { error: deleteError } = await deleteQuery

    if (deleteError) {
      // If table is missing in local/remote environment, notify gracefully
      if (deleteError.code === 'PGRST205' || deleteError.code === '42P01') {
        return { success: true, persisted: false, reason: 'table_unavailable' }
      }
      // Actual database error: return failure truthfully
      return { success: false, persisted: false, error: deleteError.message }
    }

    if (dynamicRows.length > 0) {
      const { error: insertError } = await supabase.from('timeline_blocks').insert(dynamicRows)
      if (insertError) {
        if (insertError.code === 'PGRST205' || insertError.code === '42P01') {
          return { success: true, persisted: false, reason: 'table_unavailable' }
        }
        // Actual database write error: return failure truthfully
        return { success: false, persisted: false, error: insertError.message }
      }
    }

    revalidatePath('/timeline')
    return { success: true, persisted: true, count: dynamicRows.length }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, persisted: false, error: message }
  }
}
