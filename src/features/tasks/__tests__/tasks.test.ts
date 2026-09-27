import { describe, it, expect } from 'vitest'
import { taskSchema, subtaskSchema } from '../../../lib/validations/tasks'

describe('Task Validation & Logic', () => {
  it('validates a complete valid task input', () => {
    const input = {
      title: 'Complete System Architecture Review',
      description: 'Audit database constraints and RLS policies',
      priority: 'high' as const,
      status: 'todo' as const,
      due_date: '2026-09-25T12:00:00.000Z',
      is_schedule_for_today: true,
      is_urgent: true,
      is_important: true,
      estimated_time_minutes: 45,
    }

    const result = taskSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('Complete System Architecture Review')
      expect(result.data.priority).toBe('high')
      expect(result.data.due_date).toBe('2026-09-25T12:00:00.000Z')
    }
  })

  it('rejects task with empty title', () => {
    const input = {
      title: '',
      priority: 'medium' as const,
    }

    const result = taskSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('rejects invalid priority values', () => {
    const input = {
      title: 'Test Task',
      priority: 'critical', // invalid enum value
    }

    const result = taskSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('rejects malformed datetime string for due_date', () => {
    const input = {
      title: 'Test Task',
      due_date: 'not-a-date',
    }

    const result = taskSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('supports partial updates with taskSchema.partial()', () => {
    const updatePayload = {
      status: 'done' as const,
      priority: 'urgent' as const,
    }

    const result = taskSchema.partial().safeParse(updatePayload)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('done')
      expect(result.data.priority).toBe('urgent')
    }
  })

  it('validates subtask schema', () => {
    const validSubtask = {
      task_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      title: 'Inspect RLS policies',
      is_completed: false,
    }

    const result = subtaskSchema.safeParse(validSubtask)
    expect(result.success).toBe(true)
  })

  it('rejects subtask with invalid uuid', () => {
    const invalidSubtask = {
      task_id: 'not-a-uuid',
      title: 'Invalid subtask',
    }

    const result = subtaskSchema.safeParse(invalidSubtask)
    expect(result.success).toBe(false)
  })
})
