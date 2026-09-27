import { describe, it, expect } from 'vitest'
import { isPast, isToday, isTomorrow, parseISO } from 'date-fns'

describe('Notifications Logic', () => {
  it('correctly categorizes task deadlines for reminders', () => {
    const today = new Date()
    const todayIso = today.toISOString()

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 2)
    const overdueIso = yesterday.toISOString()

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowIso = tomorrow.toISOString()

    const checkCategory = (dateStr: string) => {
      const d = parseISO(dateStr)
      if (isPast(d) && !isToday(d)) return 'overdue'
      if (isToday(d)) return 'today'
      if (isTomorrow(d)) return 'tomorrow'
      return 'future'
    }

    expect(checkCategory(overdueIso)).toBe('overdue')
    expect(checkCategory(todayIso)).toBe('today')
    expect(checkCategory(tomorrowIso)).toBe('tomorrow')
  })

  it('calculates unread count accurately', () => {
    const notifications = [
      { id: '1', title: 'A', is_read: false },
      { id: '2', title: 'B', is_read: true },
      { id: '3', title: 'C', is_read: false },
    ]

    const unread = notifications.filter((n) => !n.is_read).length
    expect(unread).toBe(2)
  })

  it('orders notifications chronologically descending', () => {
    const list = [
      { id: '1', created_at: '2026-09-20T10:00:00Z' },
      { id: '2', created_at: '2026-09-21T12:00:00Z' },
      { id: '3', created_at: '2026-09-19T08:00:00Z' },
    ]

    const sorted = [...list].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    expect(sorted[0].id).toBe('2')
    expect(sorted[1].id).toBe('1')
    expect(sorted[2].id).toBe('3')
  })
})
