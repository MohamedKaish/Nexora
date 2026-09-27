import { TaskInput, BankruptcyDiagnostic } from '../types'
import { TimelineBlock, BufferBlock } from '@/types/timeline'

// ============================================================================
// PriorityEngine
// Deterministic sorting based on Eisenhower Matrix (Urgency/Importance), Due Dates & Proximity
// ============================================================================
export class PriorityEngine {
  public sort(tasks: TaskInput[], referenceTimeMs: number = Date.now()): TaskInput[] {
    return [...tasks].sort((a, b) => {
      const scoreA = this.calculateScore(a, referenceTimeMs)
      const scoreB = this.calculateScore(b, referenceTimeMs)
      if (scoreA !== scoreB) return scoreB - scoreA // Higher score first
      
      // Secondary sort: Due date ascending
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
      if (a.dueDate) return -1
      if (b.dueDate) return 1
      
      return 0
    })
  }

  public calculateScore(task: TaskInput, referenceTimeMs: number = Date.now()): number {
    let score = 0
    
    // Base Priority Score
    if (task.priority === 'urgent') score += 100
    else if (task.priority === 'high') score += 50
    else if (task.priority === 'medium') score += 20
    else if (task.priority === 'low') score += 5

    // Eisenhower Attribute Weighting
    if (task.isUrgent) score += 40
    if (task.isImportant) score += 35
    if (task.isScheduledForToday) score += 25

    // Due Date Proximity Weighting
    if (task.dueDate) {
      const dueMs = new Date(task.dueDate).getTime()
      const diffHours = (dueMs - referenceTimeMs) / (1000 * 60 * 60)

      if (diffHours < 0) {
        score += 150 // Overdue tasks take absolute precedence
      } else if (diffHours <= 24) {
        score += 80 // Due within 24 hours
      } else if (diffHours <= 72) {
        score += 30 // Due within 3 days
      }
    }

    return score
  }
}

// ============================================================================
// ConstraintEngine
// Prevents overlap with fixed blocks (Calendar, Timetable Slots, Pinned)
// ============================================================================
export class ConstraintEngine {
  public isValidSlot(startTime: number, endTime: number, fixedBlocks: TimelineBlock[]): boolean {
    for (const block of fixedBlocks) {
      if ((block.type === 'calendar' || block.type === 'pinned_task') && block.startTime && block.endTime) {
        const blockStart = new Date(block.startTime).getTime()
        const blockEnd = new Date(block.endTime).getTime()
        // Check for overlap
        if (startTime < blockEnd && endTime > blockStart) {
          return false
        }
      }
    }
    return true
  }
}

// ============================================================================
// GapDetector
// Scans the timeline to find free contiguous intervals (Buffers)
// ============================================================================
export class GapDetector {
  public findGaps(blocks: TimelineBlock[], dayStart: number, dayEnd: number): { start: number, end: number }[] {
    const gaps: { start: number, end: number }[] = []
    
    const sorted = [...blocks]
      .filter(b => b.startTime !== null)
      .sort((a, b) => new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime())
    
    let currentTime = dayStart
    
    for (const block of sorted) {
      if (!block.startTime || !block.endTime) continue;
      const blockStart = new Date(block.startTime).getTime()
      const blockEnd = new Date(block.endTime).getTime()
      
      if (blockStart > currentTime) {
        gaps.push({ start: currentTime, end: blockStart })
      }
      currentTime = Math.max(currentTime, blockEnd)
    }
    
    if (currentTime < dayEnd) {
      gaps.push({ start: currentTime, end: dayEnd })
    }
    
    return gaps
  }
}

// ============================================================================
// SplitEngine
// Splits tasks that exceed the available gap duration
// ============================================================================
export class SplitEngine {
  public splitTask(task: TaskInput, gapDurationMinutes: number): { currentPiece: TaskInput, remainingPiece: TaskInput } | null {
    if (task.estimatedMinutes <= gapDurationMinutes) return null
    if (gapDurationMinutes < 15) return null // Do not split into chunks smaller than 15 mins

    return {
      currentPiece: { ...task, estimatedMinutes: gapDurationMinutes },
      remainingPiece: { ...task, id: `${task.id}_split_${Date.now()}`, estimatedMinutes: task.estimatedMinutes - gapDurationMinutes }
    }
  }
}

// ============================================================================
// DependencyEngine
// Sorts based on direct dependencies (stubbed for future advanced relational graphs)
// ============================================================================
export class DependencyEngine {
  public resolve(tasks: TaskInput[]): TaskInput[] {
    return tasks
  }
}

// ============================================================================
// ConflictResolver & ReflowEngine
// Orchestrates the math and generates explainable diagnostic reports
// ============================================================================
export class ConflictResolver {
  public checkTimeBankruptcy(tasks: TaskInput[], gaps: { start: number, end: number }[]): boolean {
    const totalRequiredMinutes = tasks.reduce((acc, t) => acc + t.estimatedMinutes, 0)
    const totalAvailableMinutes = gaps.reduce((acc, gap) => acc + (gap.end - gap.start) / 60000, 0)
    return totalRequiredMinutes > totalAvailableMinutes
  }

  public diagnoseBankruptcy(tasks: TaskInput[], gaps: { start: number, end: number }[]): BankruptcyDiagnostic {
    const totalRequiredMinutes = tasks.reduce((acc, t) => acc + t.estimatedMinutes, 0)
    const totalAvailableMinutes = gaps.reduce((acc, gap) => acc + (gap.end - gap.start) / 60000, 0)
    const deficitMinutes = Math.max(0, totalRequiredMinutes - totalAvailableMinutes)
    const isBankrupt = deficitMinutes > 0

    let remainingMinutes = totalAvailableMinutes
    const fittingTasks: TaskInput[] = []
    const overflowTasks: TaskInput[] = []

    for (const task of tasks) {
      if (remainingMinutes >= task.estimatedMinutes) {
        fittingTasks.push(task)
        remainingMinutes -= task.estimatedMinutes
      } else {
        overflowTasks.push(task)
      }
    }

    const reason = isBankrupt
      ? `Schedule is overloaded: ${totalRequiredMinutes}m of planned tasks exceed available capacity of ${totalAvailableMinutes}m (${deficitMinutes}m deficit).`
      : `Schedule is balanced: ${totalRequiredMinutes}m of planned tasks fit within ${totalAvailableMinutes}m of available capacity.`

    return {
      isBankrupt,
      totalRequiredMinutes,
      totalAvailableMinutes,
      deficitMinutes,
      fittingTasks,
      overflowTasks,
      reason
    }
  }
}

export class ReflowEngine {
  public generateBufferBlocks(gaps: { start: number, end: number }[]): BufferBlock[] {
    return gaps.map(gap => ({
      id: `buffer_${gap.start}`,
      type: 'buffer',
      title: 'Free Time',
      startTime: new Date(gap.start),
      endTime: new Date(gap.end),
      isCompleted: false
    }))
  }
}
