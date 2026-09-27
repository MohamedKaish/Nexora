import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createIdempotentNotification } from '../actions'

const mockInsert = vi.fn()
const mockSelect = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'notifications') {
        return {
          insert: mockInsert,
          select: mockSelect
        }
      }
      return {}
    })
  })),
  getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'user-automation-123' } } }))
}))

describe('Internal Notification Automation & Idempotency', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create notification when no recent duplicate exists', async () => {
    // Setup select chain returning empty (no existing)
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [] })
          })
        })
      })
    })

    const fakeNotification = {
      id: 'notif-1',
      user_id: 'user-automation-123',
      title: 'Daily Plan Ready',
      message: 'Your day has been planned.',
      type: 'kyro',
      is_read: false
    }

    mockInsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: fakeNotification, error: null })
      })
    })

    const result = await createIdempotentNotification({
      title: 'Daily Plan Ready',
      message: 'Your day has been planned.',
      type: 'kyro'
    })

    expect(result.created).toBe(true)
    expect(result.notification).toEqual(fakeNotification)
  })

  it('should skip creation and return existing notification if duplicate found within cooldown', async () => {
    const existingNotif = {
      id: 'notif-existing',
      title: 'Schedule Overload Alert',
      created_at: new Date().toISOString()
    }

    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [existingNotif] })
          })
        })
      })
    })

    const result = await createIdempotentNotification({
      title: 'Schedule Overload Alert',
      message: 'Overloaded schedule warning.',
      type: 'kyro',
      cooldownHours: 24
    })

    expect(result.created).toBe(false)
    expect(result.notification).toEqual(existingNotif)
    expect(mockInsert).not.toHaveBeenCalled()
  })
})
