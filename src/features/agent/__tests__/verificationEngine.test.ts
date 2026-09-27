import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'task-1', title: 'Finish report', user_id: 'user-1', status: 'todo' },
        error: null
      })
    }))
  })),
  getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'user-1' } } }))
}))

import { VerificationEngine } from '../verification/VerificationEngine'

describe('VerificationEngine & Idempotency', () => {
  const engine = new VerificationEngine()

  it('should generate deterministic idempotency keys regardless of property ordering', () => {
    const key1 = engine.generateIdempotencyKey('user-1', 'create_task', {
      title: 'Finish report',
      priority: 'high'
    })
    const key2 = engine.generateIdempotencyKey('user-1', 'create_task', {
      priority: 'high',
      title: 'Finish report'
    })

    expect(key1).toBe(key2)
  })

  it('should detect duplicate execution after recordExecution is called', () => {
    const key = engine.generateIdempotencyKey('user-1', 'schedule_tasks', { targetDate: '2026-09-23' })

    expect(engine.isDuplicateExecution(key)).toBe(false)
    engine.recordExecution(key)
    expect(engine.isDuplicateExecution(key)).toBe(true)
  })

  it('should differentiate between different users or different actions', () => {
    const user1Key = engine.generateIdempotencyKey('user-1', 'create_task', { title: 'A' })
    const user2Key = engine.generateIdempotencyKey('user-2', 'create_task', { title: 'A' })
    const diffActionKey = engine.generateIdempotencyKey('user-1', 'update_task', { title: 'A' })

    expect(user1Key).not.toBe(user2Key)
    expect(user1Key).not.toBe(diffActionKey)
  })

  it('should verify database state after create_task mutation', async () => {
    const result = await engine.verifyMutation(
      'create_task',
      { title: 'Finish report' },
      { id: 'task-1', title: 'Finish report' }
    )

    expect(result.verified).toBe(true)
    expect(result.details).toContain('Verified: Task "Finish report"')
  })
})
