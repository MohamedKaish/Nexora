import { KyroContext } from '../types'
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
    // Extract new calendar blocks from event.payload.blocks
    // and trigger this.schedule or similar logic for the *future* timeframe
    eventBus.publish('KyroReflowRequested', { status: 'calendar_sync' })
  }

  public async schedule(context: KyroContext): Promise<TimelineBlock[]> {
    const fixedBlocks: TimelineBlock[] = context.calendarEvents.map(e => ({
      id: e.id,
      type: 'calendar',
      title: e.title,
      startTime: e.startTime ? new Date(e.startTime) : null,
      endTime: e.endTime ? new Date(e.endTime) : null,
      isCompleted: false
    }))
    
    // Sort Tasks Deterministically
    const sortedTasks = this.priorityEngine.sort(context.tasks)
    
    // Day boundaries (9 AM to 9 PM)
    const now = new Date()
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0).getTime()
    const currentTimeMs = Math.max(now.getTime(), dayStart) // Start scheduling from now or 9am
    const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 21, 0, 0).getTime()

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
