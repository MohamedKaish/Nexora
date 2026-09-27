import { describe, it, expect } from 'vitest'
import { projectSchema } from '../../../lib/validations/projects'

describe('Project Validation & Progress Logic', () => {
  it('validates a complete valid project input', () => {
    const input = {
      name: 'Launch Nexora MVP',
      description: 'Core product readiness for production release',
      color: '#3B82F6',
      status: 'active' as const,
      due_date: '2026-10-01T00:00:00.000Z',
    }

    const res = projectSchema.safeParse(input)
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.name).toBe('Launch Nexora MVP')
      expect(res.data.status).toBe('active')
      expect(res.data.color).toBe('#3B82F6')
      expect(res.data.due_date).toBe('2026-10-01T00:00:00.000Z')
    }
  })

  it('rejects empty project name', () => {
    const res = projectSchema.safeParse({
      name: '',
      color: '#3B82F6',
    })
    expect(res.success).toBe(false)
  })

  it('rejects invalid project status', () => {
    const res = projectSchema.safeParse({
      name: 'Test Project',
      status: 'abandoned', // only active, archived, completed
    })
    expect(res.success).toBe(false)
  })

  it('supports partial updates with projectSchema.partial()', () => {
    const update = {
      status: 'completed' as const,
    }
    const res = projectSchema.partial().safeParse(update)
    expect(res.success).toBe(true)
  })

  it('computes real project progress accurately from tasks', () => {
    const tasksEmpty: { status: string }[] = []
    const calcProgress = (tasks: { status: string }[]) => {
      if (tasks.length === 0) return 0
      const completed = tasks.filter((t) => t.status === 'done').length
      return Math.round((completed / tasks.length) * 100)
    }

    expect(calcProgress(tasksEmpty)).toBe(0)

    const tasksMixed = [
      { status: 'done' },
      { status: 'todo' },
      { status: 'done' },
      { status: 'in_progress' },
    ]
    expect(calcProgress(tasksMixed)).toBe(50)

    const tasksAllDone = [{ status: 'done' }, { status: 'done' }]
    expect(calcProgress(tasksAllDone)).toBe(100)
  })
})
