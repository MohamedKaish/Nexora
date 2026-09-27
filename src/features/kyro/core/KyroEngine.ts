import { KyroContext, BankruptcyDiagnostic } from '../types'
import { TimelineBlock } from '@/types/timeline'
import { ConstraintEngine, PriorityEngine, GapDetector, ReflowEngine, SplitEngine, ConflictResolver } from '../engine'
import { eventBus } from '../events/EventBus'

export class KyroEngine {
  private constraintEngine = new ConstraintEngine()
  private priorityEngine = new PriorityEngine()
  private gapDetector = new GapDetector()
  private reflowEngine = new ReflowEngine()
  private splitEngine = new SplitEngine()
  private conflictResolver = new ConflictResolver()

  constructor() {
    eventBus.subscribe('ExternalCalendarSynced', this.handleCalendarSync.bind(this))
  }

  private handleCalendarSync(event: unknown) {
    console.log('[KyroEngine] Intercepted external calendar sync. Triggering partial reflow.', event)
    eventBus.publish('KyroReflowRequested', { status: 'calendar_sync' })
  }

  /**
   * Builds the fixed non-schedulable commitments for a given date,
   * synthesizing both explicit calendar events and recurring weekly timetable slots.
   */
  public buildFixedBlocks(context: KyroContext, baseDate: Date): TimelineBlock[] {
    const fixedBlocks: TimelineBlock[] = context.calendarEvents.map(e => ({
      id: e.id,
      type: 'calendar',
      title: e.title,
      startTime: e.startTime ? new Date(e.startTime) : null,
      endTime: e.endTime ? new Date(e.endTime) : null,
      isCompleted: false
    }))

    // Incorporate weekly timetable commitments if available
    if (context.timetableSlots && context.timetableSlots.length > 0) {
      const targetDayOfWeek = baseDate.getDay() // 0 = Sun, 1 = Mon, ..., 6 = Sat
      const matchingSlots = context.timetableSlots.filter(s => s.dayOfWeek === targetDayOfWeek)

      for (const slot of matchingSlots) {
        const [startH, startM] = slot.startTime.split(':').map(Number)
        const [endH, endM] = slot.endTime.split(':').map(Number)

        const slotStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), startH, startM, 0)
        const slotEnd = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), endH, endM, 0)

        if (slotEnd.getTime() > slotStart.getTime()) {
          fixedBlocks.push({
            id: `slot-${slot.id}`,
            type: 'calendar', // Treated as fixed non-overlapping commitment
            title: `[Schedule] ${slot.label}`,
            startTime: slotStart,
            endTime: slotEnd,
            isCompleted: false
          })
        }
      }
    }

    return fixedBlocks
  }

  /**
   * Analyzes the schedule capacity vs task demand for a target date
   * and returns an explainable diagnostic report.
   */
  public diagnose(context: KyroContext, targetDate?: Date, referenceTime?: Date): BankruptcyDiagnostic {
    const baseDate = targetDate ? new Date(targetDate) : new Date()
    const fixedBlocks = this.buildFixedBlocks(context, baseDate)

    const dayStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 9, 0, 0).getTime()
    const dayEnd = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 21, 0, 0).getTime()

    const now = referenceTime ? new Date(referenceTime) : new Date()
    const isToday = now.getFullYear() === baseDate.getFullYear() &&
      now.getMonth() === baseDate.getMonth() &&
      now.getDate() === baseDate.getDate()

    const currentTimeMs = isToday && now.getTime() < dayEnd
      ? Math.max(now.getTime(), dayStart)
      : dayStart

    const gaps = this.gapDetector.findGaps(fixedBlocks, currentTimeMs, dayEnd)
    const sortedTasks = this.priorityEngine.sort(context.tasks, currentTimeMs)

    return this.conflictResolver.diagnoseBankruptcy(sortedTasks, gaps)
  }

  /**
   * Returns free contiguous time windows for a target date.
   */
  public getAvailableGaps(context: KyroContext, targetDate?: Date, referenceTime?: Date): { start: Date; end: Date; durationMinutes: number }[] {
    const baseDate = targetDate ? new Date(targetDate) : new Date()
    const fixedBlocks = this.buildFixedBlocks(context, baseDate)

    const dayStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 9, 0, 0).getTime()
    const dayEnd = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 21, 0, 0).getTime()

    const now = referenceTime ? new Date(referenceTime) : new Date()
    const isToday = now.getFullYear() === baseDate.getFullYear() &&
      now.getMonth() === baseDate.getMonth() &&
      now.getDate() === baseDate.getDate()

    const currentTimeMs = isToday && now.getTime() < dayEnd
      ? Math.max(now.getTime(), dayStart)
      : dayStart

    const gaps = this.gapDetector.findGaps(fixedBlocks, currentTimeMs, dayEnd)
    return gaps.map(g => ({
      start: new Date(g.start),
      end: new Date(g.end),
      durationMinutes: Math.round((g.end - g.start) / 60000)
    }))
  }

  public async schedule(context: KyroContext, targetDate?: Date, referenceTime?: Date): Promise<TimelineBlock[]> {
    const baseDate = targetDate ? new Date(targetDate) : new Date()
    const fixedBlocks = this.buildFixedBlocks(context, baseDate)

    // Day boundaries (9 AM to 9 PM)
    const dayStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 9, 0, 0).getTime()
    const dayEnd = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 21, 0, 0).getTime()

    const now = referenceTime ? new Date(referenceTime) : new Date()
    const isToday = now.getFullYear() === baseDate.getFullYear() &&
      now.getMonth() === baseDate.getMonth() &&
      now.getDate() === baseDate.getDate()

    // If scheduling for today and before 9 PM, start from max(now, 9 AM).
    // If it's already past 9 PM today or another day, start from 9 AM to provide a valid schedule.
    const currentTimeMs = isToday && now.getTime() < dayEnd
      ? Math.max(now.getTime(), dayStart)
      : dayStart

    // Sort Tasks Deterministically taking into account overdue status and urgency
    const sortedTasks = this.priorityEngine.sort(context.tasks, currentTimeMs)

    const newTimeline: TimelineBlock[] = [...fixedBlocks]
    const scheduledTaskIds = new Set<string>()

    const gaps = this.gapDetector.findGaps(newTimeline, currentTimeMs, dayEnd)

    // Check Time Bankruptcy
    if (this.conflictResolver.checkTimeBankruptcy(sortedTasks, gaps)) {
      eventBus.publish('KyroReflowRequested', { status: 'bankruptcy_detected' })
    }

    const remainingTasks = [...sortedTasks]

    // Assign tasks into gaps
    for (const gap of gaps) {
      let currentGapStart = gap.start
      let gapDurationMinutes = (gap.end - currentGapStart) / 60000

      while (gapDurationMinutes > 0 && remainingTasks.length > 0) {
        const task = remainingTasks[0]
        
        const splitResult = this.splitEngine.splitTask(task, gapDurationMinutes)
        
        let taskToSchedule = task
        let actualDuration = task.estimatedMinutes

        if (splitResult) {
          taskToSchedule = splitResult.currentPiece
          actualDuration = splitResult.currentPiece.estimatedMinutes
          remainingTasks[0] = splitResult.remainingPiece // Requeue remaining piece
        } else {
          remainingTasks.shift() // Task fully fits
        }

        const taskStart = currentGapStart
        const taskEnd = currentGapStart + actualDuration * 60000

        if (this.constraintEngine.isValidSlot(taskStart, taskEnd, fixedBlocks)) {
          newTimeline.push({
            id: taskToSchedule.id,
            type: 'task',
            title: taskToSchedule.title,
            startTime: new Date(taskStart),
            endTime: new Date(taskEnd),
            priority: (taskToSchedule.priority === 'urgent' ? 'high' : taskToSchedule.priority) || 'medium',
            isCompleted: false
          })
          
          scheduledTaskIds.add(taskToSchedule.id)
          currentGapStart = taskEnd
          gapDurationMinutes = (gap.end - currentGapStart) / 60000
        } else {
          break // Gap invalid, move to next gap
        }
      }
    }

    return newTimeline
  }
}
