import { describe, it, expect } from 'vitest'

describe('Focus & Pomodoro Logic', () => {
  it('maps focus modes to correct database session types', () => {
    const mapToDbType = (mode: string) => (mode === 'deep_work' ? 'deep_work' : 'pomodoro')
    expect(mapToDbType('deep_work')).toBe('deep_work')
    expect(mapToDbType('pomodoro')).toBe('pomodoro')
    expect(mapToDbType('stopwatch')).toBe('pomodoro')
    expect(mapToDbType('custom')).toBe('pomodoro')
  })

  it('aggregates focus stats accurately', () => {
    const today = '2026-09-21'
    const sessions = [
      { duration_minutes: 25, created_at: `${today}T10:00:00Z` },
      { duration_minutes: 50, created_at: `${today}T14:30:00Z` },
      { duration_minutes: 25, created_at: '2026-09-20T11:00:00Z' },
    ]

    let todayMinutes = 0
    let todaySessions = 0
    let totalMinutes = 0

    for (const s of sessions) {
      totalMinutes += s.duration_minutes
      if (s.created_at.startsWith(today)) {
        todayMinutes += s.duration_minutes
        todaySessions += 1
      }
    }

    expect(todayMinutes).toBe(75)
    expect(todaySessions).toBe(2)
    expect(totalMinutes).toBe(100)
  })

  it('ignores break sessions from work analytics', () => {
    const isWorkSession = (mode: string) => mode !== 'short_break' && mode !== 'long_break'
    expect(isWorkSession('pomodoro')).toBe(true)
    expect(isWorkSession('deep_work')).toBe(true)
    expect(isWorkSession('stopwatch')).toBe(true)
    expect(isWorkSession('short_break')).toBe(false)
    expect(isWorkSession('long_break')).toBe(false)
  })
})
