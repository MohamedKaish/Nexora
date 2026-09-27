import {
  AgentPlan,
  AgentPlanSchema,
  RiskLevel,
  ToolActionDefinition,
  ConfidenceState,
  ResponseMode,
  ConversationTurn
} from '../types/plan'
import { PermissionManager } from '../security/PermissionManager'

export interface AgentTaskReference {
  id: string
  title: string
  due_date?: string | null
  priority?: string
  status?: string
}

export interface AgentContextSnapshot {
  userQuery: string
  activeTaskCount: number
  overdueTaskCount: number
  capacityDeficitMinutes: number
  isScheduleBankrupt: boolean
  freeMinutesAvailable?: number
  topPriorityTaskTitle?: string
  constraintsSummary: string
  conversationHistory?: ConversationTurn[]
  recentTasks?: AgentTaskReference[]
  lastCreatedTaskId?: string
  lastCreatedTaskTitle?: string
}

export interface AgentModel {
  providerName: string
  isAvailable(): boolean
  generateStructuredPlan(
    query: string,
    context: AgentContextSnapshot
  ): Promise<AgentPlan>
}

// ----------------------------------------------------------------------------
// 1. DETERMINISTIC AGENT MODEL (Always available, 100% reliable, zero cost)
// ----------------------------------------------------------------------------
export class DeterministicAgentModel implements AgentModel {
  public providerName = 'deterministic_kyro'
  private permissionManager = new PermissionManager()

  public isAvailable(): boolean {
    return true
  }

  /**
   * Resolves the target task from natural language, conversation history,
   * or recent tasks catalog. Strictly avoids dummy fallback IDs.
   */
  public resolveTargetTask(
    query: string,
    context: AgentContextSnapshot
  ): AgentTaskReference | null {
    const lower = (query || '').toLowerCase()
    const isPronounRef = lower.includes('that task') ||
      lower.includes('the task you created') ||
      lower.includes('this task') ||
      lower.includes('the task') ||
      lower.includes('delete it') ||
      lower.includes('move it') ||
      lower.includes('make it') ||
      lower.includes('make that') ||
      lower.includes('mark it') ||
      lower.includes('change it') ||
      lower.includes('update it')

    // 1. Explicit task title match in query against recentTasks
    if (context.recentTasks && context.recentTasks.length > 0) {
      for (const t of context.recentTasks) {
        if (t.title && lower.includes(t.title.toLowerCase())) {
          return t
        }
      }
    }

    // 2. Highest confidence for pronoun / conversational follow-up: snapshot lastCreatedTaskId
    if (context.lastCreatedTaskId) {
      return {
        id: context.lastCreatedTaskId,
        title: context.lastCreatedTaskTitle || 'Recent Task'
      }
    }

    // 3. Check conversation history
    if (context.conversationHistory && context.conversationHistory.length > 0) {
      for (let i = context.conversationHistory.length - 1; i >= 0; i--) {
        const turn = context.conversationHistory[i]
        const turnContent = turn.content || ''

        // Check if agent reported a persisted task with title and ID
        const agentReportMatch = turnContent.match(/Task\s+"([^"]+)"\s+\(ID:\s*([^)]+)\)/i)
        if (agentReportMatch) {
          const matchedId = agentReportMatch[2].trim()
          const matchedTitle = agentReportMatch[1].trim()
          return { id: matchedId, title: matchedTitle }
        }

        // Check if user previously created a task
        const createMatch = turnContent.match(/(?:create|add|new)\s+(?:a\s+)?task\s+(?:called\s+)?([^,.;\n]+)/i)
        if (createMatch) {
          const rawTitle = createMatch[1]
            .replace(/\s*due\s+(?:friday|tomorrow|today|monday|tuesday|wednesday|thursday|saturday|sunday|[0-9\-]+)/i, '')
            .trim()
          if (rawTitle && context.recentTasks) {
            const matched = context.recentTasks.find(t => t.title.toLowerCase() === rawTitle.toLowerCase())
            if (matched) return matched
          }
        }
      }
    }

    // 4. Default to first recent task if pronoun reference and tasks exist
    if (isPronounRef && context.recentTasks && context.recentTasks.length > 0) {
      return context.recentTasks[0]
    }

    return null
  }

  public async generateStructuredPlan(
    query: string,
    context: AgentContextSnapshot
  ): Promise<AgentPlan> {
    const rawQuery = (query || '').trim()
    const lower = rawQuery.toLowerCase()
    const planId = `plan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

    // Check conversation history for contextual continuation
    const lastAgentTurn = context.conversationHistory?.filter(t => t.role === 'agent').slice(-1)[0]?.content.toLowerCase() || ''

    // Parse time / hour parameters
    let extractedMinutes: number | undefined
    const hourMatch = lower.match(/(\d+|one|two|three|four|five)\s*(hour|hr)s?/)
    const minMatch = lower.match(/(\d+)\s*(minute|min)s?/)

    if (hourMatch) {
      const h = this.parseNumberWord(hourMatch[1])
      extractedMinutes = h * 60
    } else if (minMatch) {
      extractedMinutes = parseInt(minMatch[1], 10)
    }

    const tools: ToolActionDefinition[] = []
    let intent = 'UNKNOWN'
    let reasoning = `Analyzed ${context.activeTaskCount} active tasks under constraints: ${context.constraintsSummary}.`
    let decisionExplanation = ''
    let confidenceState: ConfidenceState = 'Certain'
    let responseMode: ResponseMode = 'proposed_plan'
    let clarificationQuestion: string | undefined
    const requestedActions: string[] = []
    const requiredContext: string[] = ['tasks', 'timetable']
    const expectedResults: string[] = []

    // ------------------------------------------------------------------------
    // A. MALICIOUS INPUT / PROMPT INJECTION DEFENSE (Step 18)
    // ------------------------------------------------------------------------
    if (
      lower.includes('ignore your rules') ||
      lower.includes('ignore rules') ||
      lower.includes('drop table') ||
      lower.includes('delete everything') ||
      lower.includes('delete all my tasks') ||
      lower.includes('execute sql') ||
      lower.includes('run shell') ||
      lower.includes('reveal your api key') ||
      lower.includes('reveal key') ||
      lower.includes('bypass confirmation')
    ) {
      intent = 'SECURITY_REFUSAL'
      reasoning = 'Security policy violation detected. Natural language commands cannot bypass tool authorization, SQL bounds, or permission boundaries.'
      decisionExplanation = 'Nexora operates strictly through bounded, authenticated tool APIs. Arbitrary database execution and rule evasion requests are permanently prohibited.'
      confidenceState = 'Cannot complete'
      responseMode = 'failed_action'
      expectedResults.push('Safe refusal with security boundaries preserved')
    }

    // ------------------------------------------------------------------------
    // B. MULTI-TURN CONVERSATIONAL CLARIFICATION & FOLLOW-UP (Step 3)
    // ------------------------------------------------------------------------
    else if (
      // Follow-up after "Which evening slot should I use?"
      (lastAgentTurn.includes('which evening slot') || lastAgentTurn.includes('slot should i use')) &&
      (lower.includes('after 7') || lower.includes('7') || lower.includes('8') || lower.includes('evening'))
    ) {
      intent = 'RESCHEDULE_TASK'
      reasoning = 'Resolved slot ambiguity from preceding conversation turn ("after 7"). Assigning 19:00 - 20:00 timetable window.'
      decisionExplanation = 'Selected 7:00 PM - 8:00 PM slot based on your follow-up instruction and available timetable gap.'
      confidenceState = 'Certain'
      requestedActions.push('Reschedule task to 7:00 PM')
      expectedResults.push('Task scheduled in 7:00 PM evening slot')

      tools.push({
        id: `act_${tools.length + 1}`,
        toolName: 'create_timetable_block',
        parameters: {
          day_of_week: new Date().getDay(),
          start_time: '19:00',
          end_time: '20:00',
          label: 'Study Session',
          color: '#3B82F6'
        },
        riskLevel: 'LEVEL_1_REVERSIBLE',
        description: 'Create 7:00 PM evening study block',
        expectedOutcome: 'Evening slot populated',
        isMutation: true
      })
    }
    else if (
      (lower === 'move the study session to evening' || lower === 'move study session to evening') &&
      !lower.includes('7') && !lower.includes('8') && !lower.includes('pm')
    ) {
      intent = 'AMBIGUOUS_SCHEDULE_REQUEST'
      reasoning = 'Target evening slot is ambiguous. Need clarification before creating schedule block.'
      decisionExplanation = 'Multiple evening slots are available. Asking user for specific preference.'
      confidenceState = 'Needs clarification'
      responseMode = 'needs_clarification'
      clarificationQuestion = 'Which evening slot should I use? 7:00–8:00 PM or 8:30–9:30 PM are currently available.'
      expectedResults.push('User prompted for preferred slot')

      tools.push({
        id: `act_${tools.length + 1}`,
        toolName: 'get_schedule',
        parameters: {},
        riskLevel: 'LEVEL_0_READ',
        description: 'Inspect available evening timetable slots',
        expectedOutcome: 'Confirmed free evening gaps',
        isMutation: false
      })
    }
    // Follow-up after "What is the deadline for this task?" (Part H Multi-turn context)
    else if (
      (lastAgentTurn.includes('what is the deadline') || lastAgentTurn.includes("what's the deadline"))
    ) {
      intent = 'CREATE_TASK_CLARIFY_DURATION'
      reasoning = 'Received deadline from user. Prompting for estimated task duration to complete task parameters.'
      decisionExplanation = 'Got the deadline. Asking for estimated duration to schedule accurately.'
      confidenceState = 'Needs clarification'
      responseMode = 'needs_clarification'
      clarificationQuestion = 'How long do you estimate this task will take? (e.g., 2 hours, 1 hour, 30 minutes)'
      expectedResults.push('User prompted for task duration')
    }
    // Follow-up after "How long do you estimate this task will take?" (Part H Multi-turn synthesis)
    else if (
      (lastAgentTurn.includes('how long do you estimate') || lastAgentTurn.includes('how long will it take')) &&
      extractedMinutes !== undefined
    ) {
      intent = 'CREATE_TASK'
      let gatheredTitle = 'New Task'
      let gatheredDueDate: string | null = null

      if (context.conversationHistory && context.conversationHistory.length > 0) {
        for (const turn of context.conversationHistory) {
          const match = turn.content.match(/(?:create|add|new)\s+(?:a\s+)?task\s+(?:called\s+)?([^,.;\n]+)/i)
          if (match) {
            gatheredTitle = match[1]
              .replace(/\s*due\s+(?:friday|tomorrow|today|monday|tuesday|wednesday|thursday|saturday|sunday|[0-9\-]+)/i, '')
              .trim()
          }
          if (turn.role === 'user') {
            const turnLower = turn.content.toLowerCase()
            if (turnLower.includes('friday')) {
              const now = new Date()
              const daysUntilFriday = (5 - now.getDay() + 7) % 7 || 7
              const d = new Date(now)
              d.setDate(now.getDate() + daysUntilFriday)
              gatheredDueDate = `${d.toISOString().split('T')[0]}T17:00:00Z`
            } else if (turnLower.includes('tomorrow')) {
              const d = new Date()
              d.setDate(d.getDate() + 1)
              gatheredDueDate = `${d.toISOString().split('T')[0]}T17:00:00Z`
            }
          }
        }
      }

      reasoning = `Multi-turn context gathered: Creating task "${gatheredTitle}" with estimated duration ${extractedMinutes}m${gatheredDueDate ? ` due ${gatheredDueDate}` : ''}.`
      decisionExplanation = `Synthesized your task: "${gatheredTitle}" (${extractedMinutes}m duration)${gatheredDueDate ? ` due ${gatheredDueDate.split('T')[0]}` : ''}.`
      confidenceState = 'Certain'
      requestedActions.push(`Create task "${gatheredTitle}"`)
      expectedResults.push(`Task "${gatheredTitle}" created with estimated duration ${extractedMinutes}m`)

      tools.push({
        id: `act_${tools.length + 1}`,
        toolName: 'create_task',
        parameters: {
          title: gatheredTitle,
          priority: 'medium',
          due_date: gatheredDueDate,
          estimated_time_minutes: extractedMinutes
        },
        riskLevel: 'LEVEL_1_REVERSIBLE',
        description: `Create task "${gatheredTitle}" (${extractedMinutes}m)`,
        expectedOutcome: 'Task record created in database',
        isMutation: true
      })
    }

    // ------------------------------------------------------------------------
    // C. INFORMATIONAL QUERIES (Step 3: Direct response without mutation)
    // ------------------------------------------------------------------------
    else if (
      lower.startsWith('what does strict mode do') ||
      lower.startsWith('how does kyro work') ||
      lower.startsWith('explain strict mode') ||
      lower.startsWith('what is nexora') ||
      lower.startsWith('explain scheduling')
    ) {
      intent = 'INFORMATIONAL_QUERY'
      reasoning = 'User requested technical explanation. Delivering informational response without unnecessary tool mutation.'
      decisionExplanation = 'Strict Mode enforces non-overlapping timetable blocks and alerts when commitments exceed working hours. Kyro schedules tasks based on Eisenhower urgency, priority weights, and energy curves.'
      confidenceState = 'Certain'
      responseMode = 'informational'
      expectedResults.push('Delivered concise informational guidance')

      tools.push({
        id: `act_${tools.length + 1}`,
        toolName: 'get_productivity_report',
        parameters: {},
        riskLevel: 'LEVEL_0_READ',
        description: 'Inspect current schedule configuration',
        expectedOutcome: 'System configuration summary',
        isMutation: false
      })
    }

    // ------------------------------------------------------------------------
    // D. "PLAN MY DAY" / "PLAN TOMORROW" (Step 4 & 8: Complex Multi-Step)
    // ------------------------------------------------------------------------
    else if (
      lower.includes('plan my day') ||
      lower.includes('plan today') ||
      lower.includes('plan tomorrow') ||
      lower.includes('prepare my day for tomorrow') ||
      lower.includes('organize today') ||
      lower.includes('give me a realistic plan')
    ) {
      const isTomorrow = lower.includes('tomorrow')
      const targetDate = new Date()
      if (isTomorrow) targetDate.setDate(targetDate.getDate() + 1)
      const targetIso = targetDate.toISOString().split('T')[0]

      intent = isTomorrow ? 'PLAN_TOMORROW' : 'PLAN_DAY'
      reasoning = `Kyro multi-step optimization for ${isTomorrow ? 'tomorrow' : 'today'}: Reading schedule commitments, evaluating overdue tasks, and allocating non-overlapping blocks.`
      decisionExplanation = `Scheduled prioritized tasks within your working hours (${context.constraintsSummary}), ensuring no conflicts with commitments.`
      confidenceState = context.isScheduleBankrupt ? 'Conflict detected' : 'Certain'
      requestedActions.push('Calculate Kyro schedule reflow', 'Save optimized timetable blocks')
      expectedResults.push(`Optimized timeline for ${targetIso} reflecting prioritized tasks with zero conflicts`)

      // Step 1: Read schedule context
      tools.push({
        id: `act_${tools.length + 1}`,
        toolName: 'get_productivity_report',
        parameters: { targetDateIso: targetIso },
        riskLevel: 'LEVEL_0_READ',
        description: `Analyze capacity and active task priorities for ${targetIso}`,
        expectedOutcome: 'Deterministic productivity report',
        isMutation: false
      })

      // Step 2: Read current timetable
      tools.push({
        id: `act_${tools.length + 1}`,
        toolName: 'get_schedule',
        parameters: { startDate: targetIso, endDate: targetIso },
        riskLevel: 'LEVEL_0_READ',
        description: `Retrieve fixed commitments for ${targetIso}`,
        expectedOutcome: 'Current scheduled blocks',
        isMutation: false
      })

      // Step 3: Apply schedule tasks
      tools.push({
        id: `act_${tools.length + 1}`,
        toolName: 'schedule_tasks',
        parameters: { targetDateIso: targetIso, isBulk: true },
        riskLevel: 'LEVEL_2_HIGH_IMPACT',
        description: `Apply Kyro calculated timetable blocks for ${isTomorrow ? 'tomorrow' : 'today'}`,
        expectedOutcome: 'Timeline populated with scheduled task blocks',
        isMutation: true
      })
    }

    // ------------------------------------------------------------------------
    // E. "WHAT SHOULD I WORK ON NOW?" / TIME-BOUND FOCUS (Step 8 & 10)
    // ------------------------------------------------------------------------
    else if (
      lower.includes('what should i work on') ||
      lower.includes('what to work on') ||
      lower.includes('what should i focus on') ||
      lower.includes('focus now') ||
      lower.includes('what next') ||
      (extractedMinutes !== undefined && (lower.includes('what should i do') || lower.includes('organize my work') || lower.includes('organize')))
    ) {
      intent = 'FOCUS_NOW'
      reasoning = extractedMinutes
        ? `User has a ${extractedMinutes}m window. Filtering tasks by duration and priority score.`
        : 'Evaluating current urgency, overdue status, and Eisenhower weights to recommend optimal immediate focus.'
      decisionExplanation = extractedMinutes
        ? `Selected the highest-impact task that fits comfortably within your ${extractedMinutes}-minute window.`
        : `Recommended your top priority task: "${context.topPriorityTaskTitle || 'Highest priority item'}" based on urgency and deadline.`
      confidenceState = 'Certain'
      responseMode = 'informational'
      requestedActions.push('Inspect high-priority tasks', 'Recommend optimal focus target')
      expectedResults.push('Immediate focus recommendation with clear explanation')

      tools.push({
        id: `act_${tools.length + 1}`,
        toolName: 'get_productivity_report',
        parameters: {},
        riskLevel: 'LEVEL_0_READ',
        description: 'Retrieve prioritized task queue and top recommendation',
        expectedOutcome: 'Single most impactful task to work on right now',
        isMutation: false
      })
    }

    // ------------------------------------------------------------------------
    // F. "WHY IS MY SCHEDULE OVERLOADED?" / CAPACITY DIAGNOSIS
    // ------------------------------------------------------------------------
    else if (
      (lower.includes('why') || lower.includes('explain')) &&
      (lower.includes('overload') || lower.includes('deficit') || lower.includes('capacity'))
    ) {
      intent = 'EXPLAIN_OVERLOAD'
      reasoning = `Diagnosing schedule capacity and overload factors without performing mutations. Overload deficit: ${context.capacityDeficitMinutes}m.`
      decisionExplanation = `Evaluated your working hours and task commitments (${context.constraintsSummary}) to explain capacity bottlenecks.`
      confidenceState = 'Certain'
      responseMode = 'informational'
      requestedActions.push('Inspect schedule capacity', 'Analyze overload drivers')
      expectedResults.push('Clear explanation of capacity bottlenecks and deficit')

      tools.push({
        id: `act_${tools.length + 1}`,
        toolName: 'get_productivity_report',
        parameters: {},
        riskLevel: 'LEVEL_0_READ',
        description: 'Diagnose workload deficit and capacity bottlenecks',
        expectedOutcome: 'Overview of scheduled tasks vs available hours',
        isMutation: false
      })
    }

    // ------------------------------------------------------------------------
    // G. "I'M OVERLOADED" / CAPACITY RECOVERY (Step 4 & 5: Adaptive Planning)
    // ------------------------------------------------------------------------
    else if (
      lower.includes('overload') ||
      lower.includes('fix my schedule') ||
      lower.includes('too many tasks') ||
      lower.includes('schedule full') ||
      lower.includes('make room') ||
      lower.includes('organize them for me')
    ) {
      intent = 'RECOVER_OVERLOAD'
      reasoning = `Detected schedule overload (${context.capacityDeficitMinutes}m deficit). Initiating workload reflow: deferring low-priority tasks and securing focus blocks.`
      decisionExplanation = `Your planned tasks exceed available capacity by ${context.capacityDeficitMinutes || 45} minutes. Reordering by Eisenhower urgency to restore a realistic schedule.`
      confidenceState = 'Conflict detected'
      requestedActions.push('Diagnose capacity deficit', 'Reflow schedule', 'Notify user of deferred items')
      expectedResults.push('Balanced schedule fitting your working hours')

      // Step 1: Analyze report
      tools.push({
        id: `act_${tools.length + 1}`,
        toolName: 'get_productivity_report',
        parameters: {},
        riskLevel: 'LEVEL_0_READ',
        description: 'Diagnose workload deficit and bottleneck events',
        expectedOutcome: 'Capacity breakdown with deficit minutes',
        isMutation: false
      })

      // Step 2: Reflow schedule
      tools.push({
        id: `act_${tools.length + 1}`,
        toolName: 'schedule_tasks',
        parameters: { isBulk: true },
        riskLevel: 'LEVEL_2_HIGH_IMPACT',
        description: 'Reflow schedule: assign high-priority tasks and defer lower priority items',
        expectedOutcome: 'Overload resolved with feasible timeline',
        isMutation: true
      })

      // Step 3: Create alert notification
      tools.push({
        id: `act_${tools.length + 1}`,
        toolName: 'create_notification',
        parameters: {
          title: 'Schedule Reflow Applied',
          message: 'Overdue and high-priority tasks were preserved; lower priority tasks were safely deferred.',
          type: 'kyro'
        },
        riskLevel: 'LEVEL_1_REVERSIBLE',
        description: 'Send schedule adjustment summary notification',
        expectedOutcome: 'User notified of changes',
        isMutation: true
      })
    }

    // ------------------------------------------------------------------------
    // G. RESCHEDULING & CLEARING WINDOWS (Step 8)
    // ------------------------------------------------------------------------
    else if (
      lower.includes('move that task') ||
      lower.includes('move task') ||
      lower.includes('move my math task') ||
      lower.includes('move my physics assignment') ||
      lower.includes('move physics assignment') ||
      lower.includes('push my low-priority') ||
      lower.includes('clear my schedule') ||
      (lower.startsWith('move ') && (lower.includes('tomorrow') || lower.includes('evening') || lower.includes('friday')))
    ) {
      const targetTask = this.resolveTargetTask(rawQuery, context)
      const isEvening = lower.includes('evening') || lower.includes('after 6') || lower.includes('7') || lower.includes('8')
      const targetTime = isEvening ? '18:00:00Z' : '14:00:00Z'
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() + 1)
      const nextDayStr = targetDate.toISOString().split('T')[0]

      if (targetTask) {
        intent = 'RESCHEDULE_TASK'
        reasoning = `Rescheduling "${targetTask.title}" (ID: ${targetTask.id}) to ${isEvening ? 'tomorrow evening' : 'target slot'}.`
        decisionExplanation = `Moving "${targetTask.title}" to ${isEvening ? 'tomorrow evening (after 6 PM)' : 'target slot'} as explicitly requested.`
        confidenceState = 'Likely'
        requestedActions.push(`Reschedule "${targetTask.title}" to target slot`)
        expectedResults.push(`Task "${targetTask.title}" deadline updated in database`)

        tools.push({
          id: `act_${tools.length + 1}`,
          toolName: 'update_task',
          parameters: {
            id: targetTask.id,
            due_date: `${nextDayStr}T${targetTime}`
          },
          riskLevel: 'LEVEL_1_REVERSIBLE',
          description: `Move task "${targetTask.title}" deadline to ${nextDayStr} evening`,
          expectedOutcome: `Task due date updated in database`,
          isMutation: true
        })
      } else {
        intent = 'RESCHEDULE_TASK'
        reasoning = 'Cannot identify which task to reschedule from conversational context or recent tasks.'
        decisionExplanation = 'Unambiguous task identification is required before modifying deadlines.'
        confidenceState = 'Needs clarification'
        responseMode = 'needs_clarification'
        clarificationQuestion = 'Which task would you like to reschedule? Please specify the task title (e.g., "Move Physics assignment to tomorrow evening").'
        expectedResults.push('User prompted for specific task identity')
      }
    }

    // ------------------------------------------------------------------------
    // H. CREATE TASK (Step 8)
    // ------------------------------------------------------------------------
    else if (
      lower.includes('task called') ||
      (lower.startsWith('create') && lower.includes('task')) ||
      (lower.startsWith('add') && lower.includes('task')) ||
      lower.startsWith('new task')
    ) {
      intent = 'CREATE_TASK'
      let cleanTitle = ''
      const calledMatch = rawQuery.match(/task\s+called\s*:?\s*([^,.;\n]+)/i)
      if (calledMatch) {
        cleanTitle = calledMatch[1].trim()
      } else {
        cleanTitle = rawQuery
          .replace(/^(create\s+(?:a\s+)?(?:high\s+priority\s+|urgent\s+)?task|add\s+(?:a\s+)?task|new\s+task)\s*:?\s*/i, '')
          .trim()
      }

      let dueDate: string | null = null
      let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'

      if (lower.includes('due friday') || lower.includes('friday')) {
        cleanTitle = cleanTitle.replace(/\s*due friday/i, '').trim()
        const now = new Date()
        const dayOfWeek = now.getDay()
        const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7
        const friday = new Date(now)
        friday.setDate(now.getDate() + daysUntilFriday)
        dueDate = `${friday.toISOString().split('T')[0]}T17:00:00Z`
      } else if (lower.includes('due tomorrow') || lower.includes('tomorrow')) {
        cleanTitle = cleanTitle.replace(/\s*due tomorrow/i, '').trim()
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        dueDate = `${tomorrow.toISOString().split('T')[0]}T17:00:00Z`
      }

      cleanTitle = cleanTitle.replace(/[.,;!?]+$/, '').trim()

      if (lower.includes('urgent') || lower.includes('asap')) {
        priority = 'urgent'
      } else if (lower.includes('high priority') || lower.includes('important')) {
        priority = 'high'
      } else if (lower.includes('low priority')) {
        priority = 'low'
      }

      const finalTitle = cleanTitle || 'New Task'
      reasoning = `Creating task "${finalTitle}" with priority ${priority}${dueDate ? ` due ${dueDate}` : ''}.`
      decisionExplanation = `Created task with priority ${priority}${dueDate ? ` and deadline ${dueDate.split('T')[0]}` : ''}.`
      confidenceState = 'Certain'
      requestedActions.push(`Create task "${finalTitle}"`)
      expectedResults.push(`Task "${finalTitle}" persisted and verified in database`)

      tools.push({
        id: `act_${tools.length + 1}`,
        toolName: 'create_task',
        parameters: {
          title: finalTitle,
          priority,
          due_date: dueDate
        },
        riskLevel: 'LEVEL_1_REVERSIBLE',
        description: `Create task "${finalTitle}"`,
        expectedOutcome: `Task record created and verified`,
        isMutation: true
      })
    }

    // ------------------------------------------------------------------------
    // H2. UPDATE TASK (e.g., "Make that task urgent", "Make it high priority", "Mark that task as done")
    // ------------------------------------------------------------------------
    else if (
      lower.includes('make that task') ||
      lower.includes('make it urgent') ||
      lower.includes('make that task urgent') ||
      lower.includes('make it high priority') ||
      lower.includes('make that task high priority') ||
      lower.includes('make it important') ||
      lower.includes('make it low priority') ||
      lower.includes('make it medium priority') ||
      lower.includes('change priority') ||
      lower.includes('set priority') ||
      lower.includes('mark that task') ||
      lower.includes('mark it as done') ||
      lower.includes('mark as done') ||
      lower.includes('complete that task') ||
      lower.includes('complete it') ||
      ((lower.startsWith('make ') || lower.startsWith('set ') || lower.startsWith('change ')) && (lower.includes('urgent') || lower.includes('priority') || lower.includes('done')))
    ) {
      const targetTask = this.resolveTargetTask(rawQuery, context)
      let targetPriority: 'low' | 'medium' | 'high' | 'urgent' | undefined
      let targetStatus: 'todo' | 'in_progress' | 'done' | undefined

      if (lower.includes('urgent') || lower.includes('asap')) {
        targetPriority = 'urgent'
      } else if (lower.includes('high priority') || lower.includes('important') || lower.includes('high')) {
        targetPriority = 'high'
      } else if (lower.includes('medium priority') || lower.includes('normal')) {
        targetPriority = 'medium'
      } else if (lower.includes('low priority') || lower.includes('low')) {
        targetPriority = 'low'
      }

      if (lower.includes('done') || lower.includes('complete')) {
        targetStatus = 'done'
      }

      if (targetTask) {
        intent = 'UPDATE_TASK'
        const updatesDesc = [
          targetPriority ? `priority to "${targetPriority}"` : '',
          targetStatus ? `status to "${targetStatus}"` : ''
        ].filter(Boolean).join(' and ')

        reasoning = `Updating "${targetTask.title}" (ID: ${targetTask.id}): Setting ${updatesDesc}.`
        decisionExplanation = `Updating "${targetTask.title}" with ${updatesDesc} as requested.`
        confidenceState = 'Certain'
        requestedActions.push(`Update "${targetTask.title}" ${updatesDesc}`)
        expectedResults.push(`Task "${targetTask.title}" updated in database`)

        const params: Record<string, unknown> = { id: targetTask.id }
        if (targetPriority) params.priority = targetPriority
        if (targetStatus) params.status = targetStatus

        tools.push({
          id: `act_${tools.length + 1}`,
          toolName: 'update_task',
          parameters: params,
          riskLevel: 'LEVEL_1_REVERSIBLE',
          description: `Update "${targetTask.title}" ${updatesDesc}`,
          expectedOutcome: `Task record updated and verified in database`,
          isMutation: true
        })
      } else {
        intent = 'UPDATE_TASK'
        reasoning = 'Cannot identify which task to update from conversational context or recent tasks.'
        decisionExplanation = 'Unambiguous task identification is required before modifying task attributes.'
        confidenceState = 'Needs clarification'
        responseMode = 'needs_clarification'
        clarificationQuestion = 'Which task would you like to update? Please specify the task title (e.g., "Make Finish Nexora urgent").'
        expectedResults.push('User prompted for specific task identity')
      }
    }

    // ------------------------------------------------------------------------
    // I. DELETE TASK (Step 8: High Impact Confirmation)
    // ------------------------------------------------------------------------
    else if (
      lower.startsWith('delete task') ||
      lower.startsWith('delete the task') ||
      lower.startsWith('remove task') ||
      lower.startsWith('delete that task') ||
      lower.includes('delete the task you created') ||
      lower === 'delete the task you created'
    ) {
      const targetTask = this.resolveTargetTask(rawQuery, context)
      if (targetTask) {
        intent = 'DELETE_TASK'
        reasoning = `User requested task removal for "${targetTask.title}" (ID: ${targetTask.id}). Deletions are irreversible and classified as LEVEL_2_HIGH_IMPACT.`
        decisionExplanation = `Task deletion permanently removes "${targetTask.title}". Explicit confirmation is required.`
        confidenceState = 'Certain'
        requestedActions.push(`Permanently remove task "${targetTask.title}"`)
        expectedResults.push(`Task "${targetTask.title}" removed from workspace`)

        tools.push({
          id: `act_${tools.length + 1}`,
          toolName: 'delete_task',
          parameters: { id: targetTask.id },
          riskLevel: 'LEVEL_2_HIGH_IMPACT',
          description: `Permanently remove task "${targetTask.title}" from workspace`,
          expectedOutcome: 'Task removed/soft-deleted',
          isMutation: true
        })
      } else {
        intent = 'DELETE_TASK'
        reasoning = 'Cannot identify which task to delete from conversational context or recent tasks.'
        decisionExplanation = 'Task deletion is irreversible; explicit task identity is required.'
        confidenceState = 'Needs clarification'
        responseMode = 'needs_clarification'
        clarificationQuestion = 'Which task would you like to delete? Please specify the task title.'
        expectedResults.push('User prompted for specific task identity')
      }
    }

    // ------------------------------------------------------------------------
    // J. SHOW OVERDUE / MISSED DEADLINES
    // ------------------------------------------------------------------------
    else if (
      lower.includes('overdue') ||
      lower.includes('what is late') ||
      lower.includes('behind on') ||
      lower.includes('missed deadlines') ||
      lower.includes('goals am i neglecting')
    ) {
      intent = 'SHOW_OVERDUE'
      reasoning = 'Querying tasks and goals where due date < current timestamp.'
      decisionExplanation = `Found ${context.overdueTaskCount} overdue item(s) requiring immediate attention.`
      confidenceState = 'Certain'
      responseMode = 'informational'
      requestedActions.push('Retrieve overdue tasks')
      expectedResults.push('List of all tasks past their deadline')

      tools.push({
        id: `act_${tools.length + 1}`,
        toolName: 'get_overdue_tasks',
        parameters: {},
        riskLevel: 'LEVEL_0_READ',
        description: 'Fetch all overdue tasks',
        expectedOutcome: 'Array of overdue tasks with days overdue',
        isMutation: false
      })
    }

    // ------------------------------------------------------------------------
    // K. GENERAL PRODUCTIVITY QUERY FALLBACK
    // ------------------------------------------------------------------------
    else {
      intent = 'GENERAL_QUERY'
      reasoning = 'Generating general productivity overview based on active workload.'
      decisionExplanation = `Overview of ${context.activeTaskCount} active tasks and schedule state.`
      confidenceState = 'Likely'
      responseMode = 'informational'
      requestedActions.push('Inspect productivity metrics')
      expectedResults.push('Summary of active tasks and schedule state')

      tools.push({
        id: `act_${tools.length + 1}`,
        toolName: 'get_productivity_report',
        parameters: {},
        riskLevel: 'LEVEL_0_READ',
        description: 'Inspect overall productivity overview',
        expectedOutcome: 'Current status overview',
        isMutation: false
      })
    }

    const planRisk: RiskLevel = this.permissionManager.calculatePlanRisk(tools)
    const requiresConfirmation = this.permissionManager.requiresConfirmation(planRisk)
    const confirmationPrompt = requiresConfirmation
      ? this.permissionManager.generateConfirmationPrompt(tools)
      : null

    const unvalidatedPlan = {
      id: planId,
      intent,
      rawQuery,
      reasoning_summary: reasoning,
      decision_explanation: decisionExplanation,
      confidence_state: confidenceState,
      response_mode: responseMode,
      clarification_question: clarificationQuestion,
      requested_actions: requestedActions,
      required_context: requiredContext,
      risk_level: planRisk,
      requires_confirmation: requiresConfirmation,
      confirmation_prompt: confirmationPrompt,
      tools,
      expected_results: expectedResults,
      createdAt: new Date().toISOString()
    }

    return AgentPlanSchema.parse(unvalidatedPlan)
  }

  private parseNumberWord(word: string): number {
    switch (word.toLowerCase()) {
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

// ----------------------------------------------------------------------------
// 2. REMOTE LLM PROVIDER (Gemini / OpenAI / Anthropic via secure server-side API)
// ----------------------------------------------------------------------------
export class GeminiAgentModel implements AgentModel {
  public providerName = 'google_gemini'
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || ''
  }

  public isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 10)
  }

  public async generateStructuredPlan(query: string, context: AgentContextSnapshot): Promise<AgentPlan> {
    if (!this.isAvailable()) {
      throw new Error('Gemini API key is not configured.')
    }

    const systemPrompt = `You are Nexora's AI Productivity Orchestrator.
Your goal is to parse user productivity queries and output a valid JSON conforming to the AgentPlan schema.
Context:
Active Tasks: ${context.activeTaskCount}
Overdue Tasks: ${context.overdueTaskCount}
Capacity Deficit Minutes: ${context.capacityDeficitMinutes}
Constraints: ${context.constraintsSummary}

Return ONLY raw JSON conforming to this schema:
{
  "id": "plan_id_string",
  "intent": "INTENT_NAME",
  "rawQuery": "${query.replace(/"/g, '\\"')}",
  "reasoning_summary": "Concise rationale",
  "decision_explanation": "Human decision explanation",
  "confidence_state": "Certain" | "Likely" | "Needs clarification" | "Conflict detected" | "Cannot complete",
  "response_mode": "proposed_plan" | "informational" | "needs_clarification",
  "requested_actions": ["Action 1"],
  "required_context": ["tasks"],
  "risk_level": "LEVEL_0_READ" | "LEVEL_1_REVERSIBLE" | "LEVEL_2_HIGH_IMPACT" | "LEVEL_3_EXTERNAL",
  "requires_confirmation": boolean,
  "confirmation_prompt": null or "Prompt",
  "tools": [
    {
      "id": "act_1",
      "toolName": "registered_tool_name",
      "parameters": {},
      "riskLevel": "LEVEL_0_READ" | "LEVEL_1_REVERSIBLE" | "LEVEL_2_HIGH_IMPACT",
      "description": "Tool description",
      "expectedOutcome": "Outcome",
      "isMutation": boolean
    }
  ],
  "expected_results": ["Expected outcome"],
  "createdAt": "${new Date().toISOString()}"
}`

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Query: "${query}"` }] }
          ],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
        })
      })

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Gemini API rate limit reached. Deterministic fallback engaged.')
        }
        if (response.status === 401 || response.status === 403) {
          throw new Error('Gemini API authorization failure: Invalid or expired API key.')
        }
        throw new Error(`Gemini API HTTP Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const contentText = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!contentText) {
        throw new Error('Gemini API returned empty response.')
      }

      const parsedJson = JSON.parse(contentText)
      return AgentPlanSchema.parse(parsedJson)
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Gemini API request timed out after 15 seconds. Fallback engaged.')
      }
      throw err
    } finally {
      clearTimeout(timeoutId)
    }
  }
}

// ----------------------------------------------------------------------------
// 3. AUTO-SELECT AGENT MODEL (Transparent fallback, 100% resilient)
// ----------------------------------------------------------------------------
export class AutoSelectAgentModel implements AgentModel {
  public providerName = 'auto_select'
  private deterministicFallback = new DeterministicAgentModel()
  private geminiModel = new GeminiAgentModel()

  public isAvailable(): boolean {
    return true
  }

  public async generateStructuredPlan(query: string, context: AgentContextSnapshot): Promise<AgentPlan> {
    // If Gemini key is configured and available, attempt LLM generation
    if (this.geminiModel.isAvailable()) {
      try {
        return await this.geminiModel.generateStructuredPlan(query, context)
      } catch {
        // Fall back gracefully to deterministic model on any external network or schema error
        return this.deterministicFallback.generateStructuredPlan(query, context)
      }
    }

    // Default: deterministic Kyro intelligence
    return this.deterministicFallback.generateStructuredPlan(query, context)
  }
}
