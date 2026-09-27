import { describe, it, expect } from 'vitest'
import { ProductivityAdvisor } from '../advisor/ProductivityAdvisor'
import { KyroContext } from '../../kyro/types'

describe('ProductivityAdvisor Service', () => {
  const advisor = new ProductivityAdvisor()
  const referenceTime = new Date('2026-09-22T10:00:00Z')

  it('should rank overdue and urgent tasks at the top with explainable reasons', () => {
    const context: KyroContext = {
      tasks: [
        {
          id: 'task-overdue',
          title: 'Submit Tax Filings',
          priority: 'urgent',
          estimatedMinutes: 45,
          dueDate: '2026-09-20T12:00:00Z', // 2 days overdue
          isUrgent: true
        },
        {
          id: 'task-future',
          title: 'Plan Team Offsite',
          priority: 'low',
          estimatedMinutes: 60,
          dueDate: '2026-09-30T12:00:00Z'
        }
      ],
      habits: [],
      calendarEvents: []
    }

    const report = advisor.generateReport({ context, referenceTime })

    expect(report.topPriorities[0].task.id).toBe('task-overdue')
    expect(report.topPriorities[0].reason).toContain('Overdue by 2 days')
    expect(report.topPriorities[0].reason).toContain('Urgent priority')
    expect(report.overdueTasks).toHaveLength(1)
    expect(report.overdueTasks[0].id).toBe('task-overdue')
    expect(report.overdueTasks[0].daysOverdue).toBe(2)
  })

  it('should recommend a task that fits cleanly into current open window for recommendedNow', () => {
    const context: KyroContext = {
      tasks: [
        {
          id: 'task-large',
          title: 'Draft Quarterly Architecture Report',
          priority: 'high',
          estimatedMinutes: 120, // 2 hours
          dueDate: null
        },
        {
          id: 'task-compact',
          title: 'Review PR #42',
          priority: 'high',
          estimatedMinutes: 30, // 30 mins
          dueDate: null
        }
      ],
      habits: [],
      calendarEvents: [
        {
          id: 'cal-1',
          title: 'All Hands Meeting',
          startTime: '2026-09-22T11:00:00Z',
          endTime: '2026-09-22T12:00:00Z'
        }
      ]
    }

    // Reference time is 10:00. The gap before 11:00 is 60 minutes.
    // 'task-compact' (30m) fits into 60m. 'task-large' (120m) does not!
    const report = advisor.generateReport({ context, referenceTime, targetDate: referenceTime })

    expect(report.recommendedNow).not.toBeNull()
    expect(report.recommendedNow?.task.id).toBe('task-compact')
    expect(report.recommendedNow?.reason).toContain('Fits cleanly in your upcoming')
  })

  it('should identify unmet habits and goals needing attention', () => {
    const context: KyroContext = {
      tasks: [],
      habits: [],
      calendarEvents: []
    }

    const habitsWithStatus = [
      { id: 'h1', name: 'Drink Water', frequency: 'daily', streak: 5, completedToday: true },
      { id: 'h2', name: 'Read Book', frequency: 'daily', streak: 2, completedToday: false }
    ]

    const goals = [
      { id: 'g1', title: 'Complete Course', type: 'weekly' as const, status: 'active' as const, period_end: '2026-09-24T00:00:00Z' }, // 2 days left
      { id: 'g2', title: 'Read 20 Books', type: 'monthly' as const, status: 'active' as const, period_end: '2026-12-31T00:00:00Z' }
    ]

    const report = advisor.generateReport({ context, habitsWithStatus, goals, referenceTime })

    // h2 is not completed today
    expect(report.unmetHabitsToday).toHaveLength(1)
    expect(report.unmetHabitsToday[0].name).toBe('Read Book')

    // g1 has period ending in 2 days
    expect(report.goalsNeedingAttention).toHaveLength(1)
    expect(report.goalsNeedingAttention[0].title).toBe('Complete Course')
    expect(report.goalsNeedingAttention[0].reason).toContain('weekly goal period ends in 2 days')
  })
})
