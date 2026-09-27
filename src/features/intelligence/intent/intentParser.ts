import { ParsedIntent, ParsedIntentSchema, IntentType } from './types'

export class IntentParser {
  /**
   * Parses natural language input from the user into a structured, validated intent.
   * Enforces strict validation via Zod before returning.
   */
  public parse(input: string): ParsedIntent {
    const rawQuery = (input || '').trim()
    const lower = rawQuery.toLowerCase()

    let intent: IntentType = 'UNKNOWN'
    let confidence = 0.5
    const parameters: Record<string, unknown> = {}
    let requiresConfirmation = false
    let confirmationPrompt: string | null = null
    let actionType: 'read_advice' | 'schedule_reflow' | 'update_deadline' | 'info' = 'info'
    let isMutation = false
    let description = 'Provide general productivity guidance based on your current data.'

    // 1. Extract free time duration if present (e.g. "2 hours free", "30 mins free", "90 minutes")
    const hourMatch = lower.match(/(\d+|one|two|three|four|five)\s*(hour|hr)s?/)
    const minuteMatch = lower.match(/(\d+)\s*(minute|min)s?/)

    if (hourMatch) {
      const valStr = hourMatch[1]
      const numHours = this.parseNumberWord(valStr)
      parameters.freeMinutes = numHours * 60
    } else if (minuteMatch) {
      parameters.freeMinutes = parseInt(minuteMatch[1], 10)
    }

    // 2. Classify Intent
    if (
      lower.includes('plan my day') ||
      lower.includes('plan today') ||
      lower.includes('organize today') ||
      lower.includes('organize my day')
    ) {
      intent = 'PLAN_DAY'
      confidence = 0.95
      requiresConfirmation = true
      confirmationPrompt = 'Would you like Kyro to compute and schedule today\'s optimal timeline based on your tasks and commitments?'
      actionType = 'schedule_reflow'
      isMutation = true
      description = 'Generate and propose an optimized schedule for today.'
    } else if (
      lower.includes('what should i work on') ||
      lower.includes('what to work on') ||
      lower.includes('what should i focus on') ||
      lower.includes('what to focus on') ||
      lower.includes('what next') ||
      (lower.includes('free') && (lower.includes('work') || lower.includes('do')))
    ) {
      intent = 'FOCUS_NOW'
      confidence = 0.95
      requiresConfirmation = false
      actionType = 'read_advice'
      isMutation = false
      description = parameters.freeMinutes
        ? `Recommend tasks fitting within your ${parameters.freeMinutes}m available window.`
        : 'Recommend the single most impactful task to tackle right now.'
    } else if (
      lower.includes('why is my schedule overloaded') ||
      lower.includes('overloaded') ||
      lower.includes('conflicts') ||
      lower.includes('too many tasks') ||
      lower.includes('is my schedule full')
    ) {
      intent = 'EXPLAIN_OVERLOAD'
      confidence = 0.9
      requiresConfirmation = false
      actionType = 'read_advice'
      isMutation = false
      description = 'Analyze timeline capacity, diagnose workload deficit, and explain schedule bottlenecks.'
    } else if (
      lower.includes('overdue') ||
      lower.includes('what is late') ||
      lower.includes('missed deadlines')
    ) {
      intent = 'SHOW_OVERDUE'
      confidence = 0.95
      requiresConfirmation = false
      actionType = 'read_advice'
      isMutation = false
      description = 'List all currently overdue tasks and upcoming critical deadlines.'
    } else if (
      lower.includes('schedule my most important') ||
      lower.includes('schedule important') ||
      lower.includes('schedule top tasks') ||
      lower.includes('schedule urgent')
    ) {
      intent = 'SCHEDULE_IMPORTANT'
      confidence = 0.9
      requiresConfirmation = true
      confirmationPrompt = 'Schedule your highest-priority and urgent tasks into available gaps?'
      actionType = 'schedule_reflow'
      isMutation = true
      description = 'Schedule top-priority tasks into today\'s free windows.'
    } else if (
      lower.includes('move') && (lower.includes('deadline') || lower.includes('due date')) ||
      lower.includes('reschedule')
    ) {
      intent = 'MOVE_DEADLINE'
      confidence = 0.85
      requiresConfirmation = true
      confirmationPrompt = 'Confirm moving this deadline? A database update will be executed only after your confirmation.'
      actionType = 'update_deadline'
      isMutation = true
      description = 'Update target deadline for specified task or project.'
    }

    const parsed = {
      intent,
      rawQuery,
      confidence,
      parameters,
      requiresConfirmation,
      confirmationPrompt,
      proposedAction: {
        actionType,
        description,
        isMutation,
        payload: parameters
      }
    }

    return ParsedIntentSchema.parse(parsed)
  }

  private parseNumberWord(word: string): number {
    switch (word) {
      case 'one': return 1
      case 'two': return 2
      case 'three': return 3
      case 'four': return 4
      case 'five': return 5
      default: {
        const n = parseInt(word, 10)
        return isNaN(n) ? 1 : n
      }
    }
  }
}
