import { describe, it, expect } from 'vitest'
import { goalSchema } from '../../../lib/validations/goals'

describe('Goal Validation Logic', () => {
  it('validates a complete valid goal input', () => {
    const input = {
      title: 'Complete 5 Deep Work Sessions',
      type: 'weekly' as const,
      status: 'active' as const,
      period_start: '2026-09-21',
      period_end: '2026-09-28',
    }

    const res = goalSchema.safeParse(input)
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.title).toBe('Complete 5 Deep Work Sessions')
      expect(res.data.type).toBe('weekly')
      expect(res.data.status).toBe('active')
    }
  })

  it('rejects empty goal title', () => {
    const res = goalSchema.safeParse({
      title: '',
      type: 'daily',
      period_start: '2026-09-21',
      period_end: '2026-09-21',
    })
    expect(res.success).toBe(false)
  })

  it('rejects invalid goal type', () => {
    const res = goalSchema.safeParse({
      title: 'Valid title',
      type: 'yearly', // only daily, weekly, monthly
      period_start: '2026-09-21',
      period_end: '2026-09-21',
    })
    expect(res.success).toBe(false)
  })

  it('supports partial updates with goalSchema.partial()', () => {
    const res = goalSchema.partial().safeParse({
      status: 'completed' as const,
    })
    expect(res.success).toBe(true)
  })
})
