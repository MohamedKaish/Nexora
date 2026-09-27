import { KyroContext } from '../../kyro/types'
import { KyroEngine } from '../../kyro/core/KyroEngine'
import { PriorityEngine } from '../../kyro/engine'

export interface TaskRecommendation {
  task: {
    id: string
    title: string
    priority: string
    estimatedMinutes: number
    dueDate: string | null
    projectId?: string | null
  }
  score: number
  reason: string
}

export interface OverdueTask {
  id: string
  title: string
  dueDate: string
  daysOverdue: number
  priority: string
}

export interface UnmetHabit {
  id: string
  name: string
  frequency: string
  streak: number
}

export interface GoalAttention {
  id: string
  title: string
  progress: number
  targetDate: string | null
  reason: string
}

export interface ScheduleCapacitySummary {
  totalPlannedMinutes: number
  totalAvailableMinutes: number
  deficitMinutes: number
  isBankrupt: boolean
  freeWindows: { start: string; end: string; durationMinutes: number }[]
  conflictExplanation: string
}

export interface AdvisorReport {
  recommendedNow: TaskRecommendation | null
  topPriorities: TaskRecommendation[]
  overdueTasks: OverdueTask[]
  unmetHabitsToday: UnmetHabit[]
  goalsNeedingAttention: GoalAttention[]
  scheduleCapacity: ScheduleCapacitySummary
  timestamp: string
}

export interface GoalInput {
  id: string
  title: string
  type: 'daily' | 'weekly' | 'monthly'
  status?: 'active' | 'completed' | 'failed'
  period_start?: string
  period_end?: string
}

export interface HabitWithCompletion {
  id: string
  name: string
  frequency: string
  streak?: number
  completedToday: boolean
}

export class ProductivityAdvisor {
  private engine = new KyroEngine()
  private priorityEngine = new PriorityEngine()

  /**
   * Generates a fully explainable, deterministic productivity advisor report
   * based purely on real user data across tasks, habits, goals, timetable, and calendar.
   */
  public generateReport(params: {
    context: KyroContext
    goals?: GoalInput[]
    habitsWithStatus?: HabitWithCompletion[]
    targetDate?: Date
    referenceTime?: Date
  }): AdvisorReport {
    const targetDate = params.targetDate ? new Date(params.targetDate) : new Date()
    const now = params.referenceTime ? new Date(params.referenceTime) : new Date()
    const nowMs = now.getTime()

    // 1. Analyze Overdue Tasks
    const overdueTasks: OverdueTask[] = []
    for (const t of params.context.tasks) {
      if (t.dueDate) {
        const dueMs = new Date(t.dueDate).getTime()
        if (dueMs < nowMs) {
          const daysOverdue = Math.max(1, Math.round((nowMs - dueMs) / (1000 * 60 * 60 * 24)))
          overdueTasks.push({
            id: t.id,
            title: t.title,
            dueDate: t.dueDate,
            daysOverdue,
            priority: t.priority
          })
        }
      }
    }
    overdueTasks.sort((a, b) => b.daysOverdue - a.daysOverdue)

    // 2. Rank All Actionable Tasks using Kyro Priority Engine
    const sortedTasks = this.priorityEngine.sort(params.context.tasks, nowMs)
    const topPriorities: TaskRecommendation[] = sortedTasks.slice(0, 5).map(t => {
      const score = this.priorityEngine.calculateScore(t, nowMs)
      const reason = this.buildTaskReason(t, nowMs)
      return {
        task: {
          id: t.id,
          title: t.title,
          priority: t.priority,
          estimatedMinutes: t.estimatedMinutes,
          dueDate: t.dueDate,
          projectId: t.projectId
        },
        score,
        reason
      }
    })

    // 3. Compute Free Time Windows & Capacity Diagnosis
    const gaps = this.engine.getAvailableGaps(params.context, targetDate, now)
    const diagnosis = this.engine.diagnose(params.context, targetDate, now)

    const scheduleCapacity: ScheduleCapacitySummary = {
      totalPlannedMinutes: diagnosis.totalRequiredMinutes,
      totalAvailableMinutes: diagnosis.totalAvailableMinutes,
      deficitMinutes: diagnosis.deficitMinutes,
      isBankrupt: diagnosis.isBankrupt,
      freeWindows: gaps.map(g => ({
        start: g.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        end: g.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        durationMinutes: g.durationMinutes
      })),
      conflictExplanation: diagnosis.reason
    }

    // 4. Determine "What Should I Work on Now?"
    let recommendedNow: TaskRecommendation | null = null
    if (topPriorities.length > 0) {
      // Find the best gap available right now or next
      const currentGap = gaps.find(g => g.durationMinutes >= 15)
      if (currentGap) {
        // Find highest priority task that fits the current window without overflowing
        const fittingTask = topPriorities.find(p => p.task.estimatedMinutes <= currentGap.durationMinutes)
        if (fittingTask) {
          recommendedNow = {
            ...fittingTask,
            reason: `${fittingTask.reason} Fits cleanly in your upcoming ${currentGap.durationMinutes}m open window (${currentGap.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${currentGap.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).`
          }
        } else {
          // If none fits cleanly, recommend the top priority task with split notice
          recommendedNow = {
            ...topPriorities[0],
            reason: `${topPriorities[0].reason} Note: Requires ${topPriorities[0].task.estimatedMinutes}m, which exceeds the next available ${currentGap.durationMinutes}m window and will need split focus.`
          }
        }
      } else {
        recommendedNow = topPriorities[0]
      }
    }

    // 5. Unmet Habits Today
    const unmetHabitsToday: UnmetHabit[] = []
    if (params.habitsWithStatus) {
      for (const h of params.habitsWithStatus) {
        if (!h.completedToday) {
          unmetHabitsToday.push({
            id: h.id,
            name: h.name,
            frequency: h.frequency,
            streak: h.streak || 0
          })
        }
      }
    }

    // 6. Goals Needing Attention
    const goalsNeedingAttention: GoalAttention[] = []
    if (params.goals) {
      for (const g of params.goals) {
        if (g.status === 'completed' || g.status === 'failed') continue

        let attentionReason = ''
        if (g.period_end) {
          const endMs = new Date(g.period_end).getTime()
          const daysLeft = Math.ceil((endMs - nowMs) / (1000 * 60 * 60 * 24))
          if (daysLeft < 0) {
            attentionReason = `${g.type} goal period ended ${Math.abs(daysLeft)} days ago without completion.`
          } else if (daysLeft <= 2) {
            attentionReason = `${g.type} goal period ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`
          }
        } else {
          attentionReason = `Active ${g.type} goal needing scheduled focus.`
        }

        if (attentionReason) {
          goalsNeedingAttention.push({
            id: g.id,
            title: g.title,
            progress: 0,
            targetDate: g.period_end || null,
            reason: attentionReason
          })
        }
      }
    }

    return {
      recommendedNow,
      topPriorities,
      overdueTasks,
      unmetHabitsToday,
      goalsNeedingAttention,
      scheduleCapacity,
      timestamp: now.toISOString()
    }
  }

  private buildTaskReason(task: KyroContext['tasks'][0], nowMs: number): string {
    const reasons: string[] = []

    if (task.dueDate) {
      const dueMs = new Date(task.dueDate).getTime()
      const diffHours = (dueMs - nowMs) / (1000 * 60 * 60)
      if (diffHours < 0) {
        const days = Math.max(1, Math.round(Math.abs(diffHours) / 24))
        reasons.push(`Overdue by ${days} day${days > 1 ? 's' : ''}`)
      } else if (diffHours <= 24) {
        reasons.push('Due today')
      } else if (diffHours <= 72) {
        reasons.push('Due within 3 days')
      }
    }

    if (task.priority === 'urgent' || task.isUrgent) {
      reasons.push('Urgent priority')
    } else if (task.priority === 'high') {
      reasons.push('High priority')
    }

    if (task.isImportant) {
      reasons.push('High impact (Important)')
    }

    if (task.isScheduledForToday) {
      reasons.push('Scheduled for today')
    }

    reasons.push(`${task.estimatedMinutes}m duration`)

    return reasons.join(' • ')
  }
}
