'use server'

import { createClient, getUser } from '@/lib/supabase/server'
import { getKyroSchedulingContext } from '@/features/timeline/actions'
import { ProductivityAdvisor, AdvisorReport } from './advisor/ProductivityAdvisor'
import { processNaturalLanguageQuery as processQuery, executeConfirmedAction as executeAction } from './intent/intentExecutor'
import { format } from 'date-fns'

export async function getDailyAdvisorReport(targetDateIso?: string): Promise<AdvisorReport> {
  const supabase = await createClient()
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  const targetDate = targetDateIso ? new Date(targetDateIso) : new Date()
  const dateStr = format(targetDate, 'yyyy-MM-dd')

  // Fetch Kyro context (tasks, timetable slots, calendar events)
  const kyroContext = await getKyroSchedulingContext()

  // Fetch habits with completion status for target date
  const [habitsRes, completionsRes, goalsRes] = await Promise.all([
    supabase
      .from('habits')
      .select('id, name, frequency, streak')
      .eq('user_id', user.id)
      .is('deleted_at', null),
    supabase
      .from('habit_completions')
      .select('habit_id')
      .eq('user_id', user.id)
      .eq('completed_date', dateStr),
    supabase
      .from('goals')
      .select('id, title, type, status, period_start, period_end')
      .eq('user_id', user.id)
      .neq('status', 'completed')
      .neq('status', 'failed')
  ])

  const completedHabitIds = new Set((completionsRes.data || []).map(c => c.habit_id))

  const habitsWithStatus = (habitsRes.data || []).map(h => ({
    id: h.id,
    name: h.name,
    frequency: h.frequency,
    streak: h.streak,
    completedToday: completedHabitIds.has(h.id)
  }))

  const advisor = new ProductivityAdvisor()
  return advisor.generateReport({
    context: kyroContext,
    goals: goalsRes.data || [],
    habitsWithStatus,
    targetDate,
    referenceTime: new Date()
  })
}

export async function processNaturalLanguageQuery(query: string) {
  return processQuery(query)
}

export async function executeConfirmedAction(params: {
  actionType: string
  payload: Record<string, unknown>
}) {
  return executeAction(params)
}
