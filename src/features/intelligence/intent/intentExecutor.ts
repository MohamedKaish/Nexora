import { getUser } from '@/lib/supabase/server'
import { IntentParser } from './intentParser'
import { ParsedIntent } from './types'
import { getDailyAdvisorReport } from '../actions'
import { getKyroSchedulingContext, saveTimelineBlocks } from '@/features/timeline/actions'
import { KyroEngine } from '@/features/kyro/core/KyroEngine'
import { updateTask } from '@/features/tasks/actions'

export interface IntentResponse {
  success: boolean
  intent: string
  message: string
  requiresUserConfirmation: boolean
  confirmationPrompt?: string | null
  data?: unknown
}

export async function processNaturalLanguageQuery(query: string): Promise<IntentResponse> {
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  const parser = new IntentParser()
  const parsed: ParsedIntent = parser.parse(query)

  // 1. Read-Only Intents (No Confirmation Required)
  if (!parsed.requiresConfirmation) {
    if (parsed.intent === 'FOCUS_NOW') {
      const report = await getDailyAdvisorReport()
      const freeMins = parsed.parameters.freeMinutes

      if (freeMins && freeMins > 0) {
        // Filter tasks that fit into specified free minutes
        const fitting = report.topPriorities.filter(p => p.task.estimatedMinutes <= freeMins)
        return {
          success: true,
          intent: parsed.intent,
          message: fitting.length > 0
            ? `Found ${fitting.length} task${fitting.length > 1 ? 's' : ''} fitting your ${freeMins}-minute window:`
            : `No single task under ${freeMins} minutes found. Top priority is "${report.recommendedNow?.task.title}".`,
          requiresUserConfirmation: false,
          data: {
            freeMinutes: freeMins,
            tasks: fitting.length > 0 ? fitting : [report.recommendedNow].filter(Boolean)
          }
        }
      }

      return {
        success: true,
        intent: parsed.intent,
        message: report.recommendedNow
          ? `Recommended: ${report.recommendedNow.task.title}`
          : 'All caught up! No urgent tasks pending.',
        requiresUserConfirmation: false,
        data: {
          recommendation: report.recommendedNow,
          topPriorities: report.topPriorities
        }
      }
    }

    if (parsed.intent === 'EXPLAIN_OVERLOAD') {
      const report = await getDailyAdvisorReport()
      const capacity = report.scheduleCapacity
      return {
        success: true,
        intent: parsed.intent,
        message: capacity.isBankrupt
          ? `Overload detected: ${capacity.totalPlannedMinutes}m of tasks exceeds available capacity of ${capacity.totalAvailableMinutes}m (${capacity.deficitMinutes}m deficit).`
          : `Schedule is balanced: ${capacity.totalPlannedMinutes}m planned within ${capacity.totalAvailableMinutes}m capacity.`,
        requiresUserConfirmation: false,
        data: capacity
      }
    }

    if (parsed.intent === 'SHOW_OVERDUE') {
      const report = await getDailyAdvisorReport()
      return {
        success: true,
        intent: parsed.intent,
        message: report.overdueTasks.length > 0
          ? `You have ${report.overdueTasks.length} overdue task${report.overdueTasks.length > 1 ? 's' : ''}:`
          : 'Zero overdue tasks. You are completely on schedule!',
        requiresUserConfirmation: false,
        data: report.overdueTasks
      }
    }
  }

  // 2. Mutating Intents: ALWAYS require explicit confirmation before database write!
  if (parsed.intent === 'PLAN_DAY' || parsed.intent === 'SCHEDULE_IMPORTANT') {
    // Generate proposed schedule preview using Kyro without writing to DB
    const context = await getKyroSchedulingContext()
    const engine = new KyroEngine()
    const proposedBlocks = await engine.schedule(context, new Date())

    return {
      success: true,
      intent: parsed.intent,
      message: `Kyro calculated a proposed plan with ${proposedBlocks.length} blocks for today. Confirm to apply to your timeline.`,
      requiresUserConfirmation: true,
      confirmationPrompt: parsed.confirmationPrompt,
      data: {
        proposedBlocks,
        taskCount: proposedBlocks.filter(b => b.type === 'task').length
      }
    }
  }

  if (parsed.intent === 'MOVE_DEADLINE') {
    return {
      success: true,
      intent: parsed.intent,
      message: 'Deadline modification requested. Confirm to update target date.',
      requiresUserConfirmation: true,
      confirmationPrompt: parsed.confirmationPrompt,
      data: parsed.parameters
    }
  }

  return {
    success: true,
    intent: 'UNKNOWN',
    message: 'Could not match a specific planning command. Try asking "Plan my day", "What should I work on?", or "Why is my schedule overloaded?".',
    requiresUserConfirmation: false
  }
}

/**
 * Executes a confirmed mutation action.
 * Strict agent safety: ONLY callable after explicit user confirmation.
 */
export async function executeConfirmedAction(params: {
  actionType: string
  payload: Record<string, unknown>
}): Promise<{ success: boolean; message: string }> {
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Unauthorized')

  if (params.actionType === 'schedule_reflow') {
    const blocks = params.payload.blocks as Parameters<typeof saveTimelineBlocks>[0]
    if (!blocks || !Array.isArray(blocks)) {
      throw new Error('Invalid blocks payload for schedule confirmation')
    }

    const result = await saveTimelineBlocks(blocks)
    if (!result.success) {
      throw new Error(result.error || 'Failed to save confirmed timeline blocks')
    }

    return {
      success: true,
      message: `Successfully scheduled ${blocks.length} blocks to your timeline!`
    }
  }

  if (params.actionType === 'update_deadline') {
    const taskId = params.payload.taskId as string
    const newDueDate = params.payload.newDueDate as string
    if (!taskId || !newDueDate) {
      throw new Error('Missing taskId or newDueDate for deadline confirmation')
    }

    await updateTask(taskId, { due_date: newDueDate })
    return {
      success: true,
      message: 'Deadline successfully updated in database.'
    }
  }

  throw new Error(`Unsupported action type: ${params.actionType}`)
}
