import { z } from 'zod'

export const habitSchema = z.object({
  name: z.string().min(1, 'Habit name is required').max(100),
  frequency: z.enum(['daily', 'weekly', 'weekdays']).default('daily'),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format').default('#10B981'),
})

export type HabitInput = z.infer<typeof habitSchema>

export function calculateHabitStreak(
  completedDates: string[],
  referenceDateStr: string = new Date().toISOString().split('T')[0]
): number {
  if (!completedDates || completedDates.length === 0) return 0
  const dateSet = new Set(completedDates)

  const refDate = new Date(referenceDateStr)
  const yesterday = new Date(refDate)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  let startDate: Date
  if (dateSet.has(referenceDateStr)) {
    startDate = refDate
  } else if (dateSet.has(yesterdayStr)) {
    startDate = yesterday
  } else {
    return 0
  }

  let streak = 0
  const checkDate = new Date(startDate)

  while (true) {
    const dStr = checkDate.toISOString().split('T')[0]
    if (dateSet.has(dStr)) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}
