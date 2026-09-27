import { describe, it, expect } from 'vitest'
import { KyroEngine } from '../core/KyroEngine'
import { PriorityEngine, ConflictResolver } from '../engine'
import { KyroContext } from '../types'

describe('Kyro Deterministic Intelligence Engine', () => {
  it('should elevate overdue tasks above standard high-priority tasks', () => {
    const priorityEngine = new PriorityEngine()
    const now = new Date('2026-09-22T10:00:00Z').getTime()

    const regularHigh = {
      id: 'task-1',
      title: 'Regular High Priority',
      priority: 'high' as const,
      estimatedMinutes: 60,
      dueDate: '2026-09-25T10:00:00Z'
    }

    const overdueMedium = {
      id: 'task-2',
      title: 'Overdue Medium Task',
      priority: 'medium' as const,
      estimatedMinutes: 45,
      dueDate: '2026-09-20T10:00:00Z' // 2 days overdue
    }

    const sorted = priorityEngine.sort([regularHigh, overdueMedium], now)
    // Overdue task gets +150, regular high gets +50 -> overdue must come first!
    expect(sorted[0].id).toBe('task-2')
    expect(sorted[1].id).toBe('task-1')
  })

  it('should reward Eisenhower matrix attributes (urgent + important + today)', () => {
    const priorityEngine = new PriorityEngine()
    const now = new Date('2026-09-22T10:00:00Z').getTime()

    const basicMedium = {
      id: 'task-basic',
      title: 'Basic Medium',
      priority: 'medium' as const,
      estimatedMinutes: 30,
      dueDate: null
    }

    const eisenhowerMedium = {
      id: 'task-eisenhower',
      title: 'Important Urgent Medium',
      priority: 'medium' as const,
      estimatedMinutes: 30,
      dueDate: null,
      isUrgent: true,
      isImportant: true,
      isScheduledForToday: true
    }

    const scoreBasic = priorityEngine.calculateScore(basicMedium, now)
    const scoreEisenhower = priorityEngine.calculateScore(eisenhowerMedium, now)

    expect(scoreBasic).toBe(20) // base medium
    expect(scoreEisenhower).toBe(20 + 40 + 35 + 25) // 120
    expect(scoreEisenhower).toBeGreaterThan(scoreBasic)
  })

  it('should synthesize weekly timetable slots as fixed commitments on matching days', async () => {
    const engine = new KyroEngine()
    const targetTuesday = new Date('2026-09-22T12:00:00Z') // Tuesday (day 2)

    const context: KyroContext = {
      tasks: [
        {
          id: 'task-1',
          title: 'Deep Work Block',
          priority: 'high',
          estimatedMinutes: 60,
          dueDate: null
        }
      ],
      habits: [],
      calendarEvents: [],
      timetableSlots: [
        {
          id: 'slot-tue',
          label: 'Tuesday Morning Lecture',
          dayOfWeek: 2, // Tuesday
          startTime: '09:00',
          endTime: '11:00',
          color: '#6366F1'
        },
        {
          id: 'slot-wed',
          label: 'Wednesday Lab',
          dayOfWeek: 3, // Wednesday
          startTime: '09:00',
          endTime: '12:00'
        }
      ]
    }

    const fixedBlocks = engine.buildFixedBlocks(context, targetTuesday)
    // Only the Tuesday slot should be synthesized for targetTuesday
    expect(fixedBlocks).toHaveLength(1)
    expect(fixedBlocks[0].id).toBe('slot-slot-tue')
    expect(fixedBlocks[0].title).toBe('[Schedule] Tuesday Morning Lecture')
  })

  it('should accurately diagnose time bankruptcy and partition fitting vs overflow tasks', () => {
    const resolver = new ConflictResolver()
    const gaps = [
      { start: 0, end: 60 * 60000 } // 60 minutes available
    ]

    const tasks = [
      { id: 't1', title: 'Quick Win', priority: 'high' as const, estimatedMinutes: 30, dueDate: null },
      { id: 't2', title: 'Secondary Task', priority: 'medium' as const, estimatedMinutes: 25, dueDate: null },
      { id: 't3', title: 'Big Project', priority: 'low' as const, estimatedMinutes: 90, dueDate: null }
    ]

    const diag = resolver.diagnoseBankruptcy(tasks, gaps)
    expect(diag.isBankrupt).toBe(true)
    expect(diag.totalRequiredMinutes).toBe(145)
    expect(diag.totalAvailableMinutes).toBe(60)
    expect(diag.deficitMinutes).toBe(85)
    expect(diag.fittingTasks.map(t => t.id)).toEqual(['t1', 't2'])
    expect(diag.overflowTasks.map(t => t.id)).toEqual(['t3'])
    expect(diag.reason).toContain('Schedule is overloaded')
  })
})
