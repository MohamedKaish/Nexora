import { describe, it, expect } from 'vitest'
import { habitSchema, calculateHabitStreak } from '../../../lib/validations/habits'

describe('Habit Validation & Streak Calculations', () => {
  it('validates a valid habit input', () => {
    const input = {
      name: 'Daily Mindfulness Meditation',
      frequency: 'daily' as const,
      color: '#10B981',
    }

    const res = habitSchema.safeParse(input)
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.name).toBe('Daily Mindfulness Meditation')
      expect(res.data.frequency).toBe('daily')
      expect(res.data.color).toBe('#10B981')
    }
  })

  it('rejects empty habit name', () => {
    const res = habitSchema.safeParse({
      name: '',
      frequency: 'daily',
      color: '#10B981',
    })
    expect(res.success).toBe(false)
  })

  it('rejects invalid frequency', () => {
    const res = habitSchema.safeParse({
      name: 'Exercise',
      frequency: 'monthly', // only daily, weekly, weekdays allowed
      color: '#10B981',
    })
    expect(res.success).toBe(false)
  })

  it('rejects invalid hex color format', () => {
    const res = habitSchema.safeParse({
      name: 'Exercise',
      frequency: 'daily',
      color: 'blue', // must be valid hex
    })
    expect(res.success).toBe(false)
  })

  it('computes 0 streak when no completions exist', () => {
    expect(calculateHabitStreak([])).toBe(0)
  })

  it('computes streak when completed today and consecutive previous days', () => {
    const today = '2026-09-21'
    const completions = ['2026-09-21', '2026-09-20', '2026-09-19', '2026-09-18']
    const streak = calculateHabitStreak(completions, today)
    expect(streak).toBe(4)
  })

  it('preserves streak when completed yesterday but not yet today', () => {
    const today = '2026-09-21'
    const completions = ['2026-09-20', '2026-09-19', '2026-09-18']
    const streak = calculateHabitStreak(completions, today)
    expect(streak).toBe(3)
  })

  it('resets streak to 0 if neither today nor yesterday was completed', () => {
    const today = '2026-09-21'
    const completions = ['2026-09-19', '2026-09-18'] // gap on 2026-09-20
    const streak = calculateHabitStreak(completions, today)
    expect(streak).toBe(0)
  })

  it('stops counting streak at the first gap', () => {
    const today = '2026-09-21'
    // Completed 21 and 20, then gap on 19, but had 18 and 17
    const completions = ['2026-09-21', '2026-09-20', '2026-09-18', '2026-09-17']
    const streak = calculateHabitStreak(completions, today)
    expect(streak).toBe(2)
  })
})
