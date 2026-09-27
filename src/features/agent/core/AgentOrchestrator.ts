import {
  AgentPlan,
  AgentPlanSchema,
  AgentExecutionReport,
  StepExecutionResult,
  ConversationTurn
} from '../types/plan'
import { ToolRegistry } from '../tools/ToolRegistry'
import { PermissionManager } from '../security/PermissionManager'
import { VerificationEngine } from '../verification/VerificationEngine'
import { RecoveryController } from '../core/RecoveryController'
import { AgentMemoryManager } from '../memory/AgentMemory'
import { AgentLogger } from '../observability/AgentLogger'
import { AutoSelectAgentModel, AgentModel, AgentContextSnapshot, AgentTaskReference } from '../llm/AgentModelProvider'
import { getDailyAdvisorReport } from '../../intelligence/actions'
import { getTasks } from '../../tasks/actions'
import { getUser } from '../../../lib/supabase/server'

export class AgentOrchestrator {
  private toolRegistry = new ToolRegistry()
  private permissionManager = new PermissionManager()
  private verificationEngine = new VerificationEngine()
  private recoveryController = new RecoveryController()
  private memoryManager = new AgentMemoryManager()
  private model: AgentModel = new AutoSelectAgentModel()

  /**
   * Optional setter allowing third-party or custom LLM provider injection.
   */
  public setModelProvider(model: AgentModel): void {
    this.model = model
  }

  /**
   * Main entry point: Processes a natural language user request through the full
   * agent pipeline with conversation context. Returns either a clarification question,
   * a pending plan requiring confirmation, or the executed report.
   */
  public async handleUserQuery(query: string, history?: ConversationTurn[]): Promise<AgentExecutionReport> {
    const sanitizedQuery = (query || '').trim()
    AgentLogger.log('REQUEST_RECEIVED', { query: sanitizedQuery })

    const { data: { user } } = await getUser()
    if (!user) {
      return {
        planId: 'unauthorized',
        overallStatus: 'failed',
        completedSteps: 0,
        totalSteps: 0,
        stepResults: [],
        finalSummary: 'Access denied: Please log in to Nexora to use the productivity agent.',
        requiresUserConfirmation: false,
        timestamp: new Date().toISOString()
      }
    }

    // 1. Context Gathering
    const memory = await this.memoryManager.getMemory()
    let activeTaskCount = 0
    let overdueTaskCount = 0
    let deficitMinutes = 0
    let isBankrupt = false
    let topPriorityTitle: string | undefined

    try {
      const report = await getDailyAdvisorReport()
      activeTaskCount = report.topPriorities.length
      overdueTaskCount = report.overdueTasks.length
      deficitMinutes = report.scheduleCapacity.deficitMinutes
      isBankrupt = report.scheduleCapacity.isBankrupt
      topPriorityTitle = report.recommendedNow?.task.title
    } catch {
      // Continue gracefully even if report fetching encounters empty data
    }

    // Fetch user recent active tasks for unambiguous pronoun & title resolution
    let recentTasks: AgentTaskReference[] = []
    try {
      const tasks = await getTasks()
      recentTasks = (tasks || []).slice(0, 15).map(t => ({
        id: t.id,
        title: t.title,
        due_date: t.due_date,
        priority: t.priority,
        status: t.status
      }))
    } catch {
      // Graceful fallback when running in isolated test or offline environment
    }

    // Track recently created task identity from conversation history
    let lastCreatedTaskId: string | undefined
    let lastCreatedTaskTitle: string | undefined
    if (history && history.length > 0) {
      for (let i = history.length - 1; i >= 0; i--) {
        const turn = history[i]
        const match = turn.content.match(/Task\s+"([^"]+)"\s+\(ID:\s*([^)]+)\)/i)
        if (match) {
          lastCreatedTaskTitle = match[1].trim()
          lastCreatedTaskId = match[2].trim()
          break
        }
        // Also check if user turn requested task creation and match against recentTasks
        const userCreateMatch = turn.content.match(/(?:create|add|new)\s+(?:a\s+)?(?:high\s+priority\s+|urgent\s+)?task\s+(?:called\s+)?([^,.;\n]+)/i)
        if (userCreateMatch) {
          const rawTitle = userCreateMatch[1]
            .replace(/\s*due\s+(?:friday|tomorrow|today|monday|tuesday|wednesday|thursday|saturday|sunday|[0-9\-]+)/i, '')
            .trim()
          const matched = recentTasks.find(t => t.title.toLowerCase() === rawTitle.toLowerCase())
          if (matched) {
            lastCreatedTaskId = matched.id
            lastCreatedTaskTitle = matched.title
            break
          }
        }
      }
    }

    const snapshot: AgentContextSnapshot = {
      userQuery: sanitizedQuery,
      activeTaskCount,
      overdueTaskCount,
      capacityDeficitMinutes: deficitMinutes,
      isScheduleBankrupt: isBankrupt,
      topPriorityTaskTitle: topPriorityTitle,
      constraintsSummary: this.memoryManager.getPlanningConstraintsSummary(memory),
      conversationHistory: history || [],
      recentTasks,
      lastCreatedTaskId,
      lastCreatedTaskTitle
    }

    // 2. Synthesize Plan
    const plan = await this.model.generateStructuredPlan(sanitizedQuery, snapshot)
    const validatedPlan = AgentPlanSchema.parse(plan)
    AgentLogger.log('PLAN_GENERATED', {
      planId: validatedPlan.id,
      intent: validatedPlan.intent,
      riskLevel: validatedPlan.risk_level,
      requiresConfirmation: validatedPlan.requires_confirmation
    })

    // 3. Security Refusal Guard (Step 18)
    if (validatedPlan.intent === 'SECURITY_REFUSAL' || validatedPlan.confidence_state === 'Cannot complete') {
      return {
        planId: validatedPlan.id,
        overallStatus: 'blocked',
        completedSteps: 0,
        totalSteps: 0,
        stepResults: [],
        finalSummary: validatedPlan.decision_explanation || 'Security refusal: Requested action permanently prohibited by policy.',
        decisionExplanation: validatedPlan.decision_explanation,
        confidenceState: 'Cannot complete',
        responseMode: 'failed_action',
        requiresUserConfirmation: false,
        timestamp: new Date().toISOString()
      }
    }

    // 4. Clarification Mode Check (Step 3)
    if (validatedPlan.response_mode === 'needs_clarification') {
      return {
        planId: validatedPlan.id,
        overallStatus: 'needs_clarification',
        completedSteps: 0,
        totalSteps: 0,
        stepResults: [],
        finalSummary: validatedPlan.clarification_question || 'Additional clarification needed to schedule your request.',
        decisionExplanation: validatedPlan.decision_explanation,
        confidenceState: validatedPlan.confidence_state,
        responseMode: 'needs_clarification',
        clarificationQuestion: validatedPlan.clarification_question,
        requiresUserConfirmation: false,
        timestamp: new Date().toISOString()
      }
    }

    // 4. Permission & Confirmation Gate
    if (validatedPlan.requires_confirmation) {
      AgentLogger.log('CONFIRMATION_REQUESTED', {
        planId: validatedPlan.id,
        prompt: validatedPlan.confirmation_prompt
      })

      return {
        planId: validatedPlan.id,
        overallStatus: 'partial',
        completedSteps: 0,
        totalSteps: validatedPlan.tools.length,
        stepResults: validatedPlan.tools.map((t, idx) => ({
          stepIndex: idx + 1,
          actionId: t.id,
          toolName: t.toolName,
          status: 'pending',
          inputParams: t.parameters,
          verified: false,
          retryCount: 0,
          durationMs: 0
        })),
        finalSummary: validatedPlan.confirmation_prompt || 'Confirmation required before executing plan.',
        decisionExplanation: validatedPlan.decision_explanation,
        confidenceState: validatedPlan.confidence_state,
        responseMode: 'proposed_plan',
        requiresUserConfirmation: true,
        pendingPlan: validatedPlan,
        timestamp: new Date().toISOString()
      }
    }

    // 5. Autonomous Execution for Read-Only / Pre-Approved Plans
    return this.executePlan(validatedPlan)
  }

  /**
   * Executes a validated AgentPlan step by step with verification,
   * idempotency checks, and failure recovery.
   */
  public async executePlan(plan: AgentPlan): Promise<AgentExecutionReport> {
    const validatedPlan = AgentPlanSchema.parse(plan)
    const { data: { user } } = await getUser()
    if (!user) throw new Error('Unauthorized')

    const stepResults: StepExecutionResult[] = []
    let failed = false

    for (let i = 0; i < validatedPlan.tools.length; i++) {
      const toolAction = validatedPlan.tools[i]
      const stepIndex = i + 1
      const startMs = Date.now()

      AgentLogger.log('TOOL_STARTED', {
        stepIndex,
        toolName: toolAction.toolName,
        params: toolAction.parameters
      }, { planId: validatedPlan.id, toolName: toolAction.toolName })

      // Idempotency check for mutations
      const idempotencyKey = this.verificationEngine.generateIdempotencyKey(
        user.id,
        toolAction.toolName,
        toolAction.parameters
      )

      if (toolAction.isMutation && this.verificationEngine.isDuplicateExecution(idempotencyKey)) {
        stepResults.push({
          stepIndex,
          actionId: toolAction.id,
          toolName: toolAction.toolName,
          status: 'skipped',
          inputParams: toolAction.parameters,
          verified: true,
          verificationDetails: 'Skipped: Duplicate execution prevented by idempotency engine',
          retryCount: 0,
          durationMs: Date.now() - startMs
        })
        continue
      }

      // If a previous mutation failed, skip dependent subsequent mutations safely
      if (failed && toolAction.isMutation) {
        stepResults.push({
          stepIndex,
          actionId: toolAction.id,
          toolName: toolAction.toolName,
          status: 'skipped',
          inputParams: toolAction.parameters,
          verified: false,
          verificationDetails: 'Skipped due to prior step failure in sequence',
          retryCount: 0,
          durationMs: 0
        })
        continue
      }

      // Execute tool with retry recovery
      const execution = await this.recoveryController.executeWithRecovery(
        async () => {
          const res = await this.toolRegistry.executeTool(toolAction.toolName, toolAction.parameters)
          if (!res.success) {
            throw new Error(res.error || `Tool execution failed: ${toolAction.toolName}`)
          }
          return res.data
        },
        {
          actionId: toolAction.id,
          toolName: toolAction.toolName,
          onRetry: (attempt, err) => {
            AgentLogger.log('RETRY_ATTEMPT', { attempt, error: String(err) }, { planId: validatedPlan.id, toolName: toolAction.toolName })
          }
        }
      )

      const durationMs = Date.now() - startMs

      if (!execution.success) {
        failed = true
        AgentLogger.log('FAILURE', { error: execution.error }, { planId: validatedPlan.id, toolName: toolAction.toolName })
        stepResults.push({
          stepIndex,
          actionId: toolAction.id,
          toolName: toolAction.toolName,
          status: 'failed',
          inputParams: toolAction.parameters,
          verified: false,
          error: execution.error,
          retryCount: execution.retryCount,
          durationMs
        })
        continue
      }

      // Step Verification for Mutations
      let isVerified = true
      let verificationMsg = 'Read-only operation completed successfully'

      if (toolAction.isMutation) {
        const verifyRes = await this.verificationEngine.verifyMutation(
          toolAction.toolName,
          toolAction.parameters,
          execution.result
        )

        isVerified = verifyRes.verified
        verificationMsg = verifyRes.details

        AgentLogger.log('VERIFICATION_RESULT', {
          verified: isVerified,
          details: verificationMsg
        }, { planId: validatedPlan.id, toolName: toolAction.toolName })

        if (isVerified) {
          this.verificationEngine.recordExecution(idempotencyKey)
        } else {
          failed = true
        }
      }

      stepResults.push({
        stepIndex,
        actionId: toolAction.id,
        toolName: toolAction.toolName,
        status: isVerified ? 'success' : 'failed',
        inputParams: toolAction.parameters,
        outputData: execution.result,
        verified: isVerified,
        verificationDetails: verificationMsg,
        retryCount: execution.retryCount,
        durationMs
      })

      AgentLogger.log('TOOL_COMPLETED', {
        status: isVerified ? 'success' : 'failed',
        durationMs
      }, { planId: validatedPlan.id, toolName: toolAction.toolName })
    }

    const completedCount = stepResults.filter(s => s.status === 'success').length
    const totalCount = stepResults.length
    let overallStatus: 'success' | 'partial' | 'failed' = 'success'

    if (completedCount === 0 && totalCount > 0) {
      overallStatus = 'failed'
    } else if (completedCount < totalCount) {
      overallStatus = 'partial'
    }

    let finalSummary = ''
    if (overallStatus === 'success') {
      if (validatedPlan.response_mode === 'informational') {
        const firstOutput = stepResults[0]?.outputData
        if (validatedPlan.intent === 'FOCUS_NOW' && firstOutput) {
          const report = firstOutput as {
            recommendedNow?: { task: { title: string; estimatedMinutes?: number; priority?: string }; reason?: string }
            topPriorities?: unknown[]
          }
          if (validatedPlan.decision_explanation && validatedPlan.decision_explanation.includes('window')) {
            if (report.recommendedNow) {
              finalSummary = `${validatedPlan.decision_explanation} Recommended focus: "${report.recommendedNow.task.title}" (${report.recommendedNow.task.estimatedMinutes || 30}m, priority: ${report.recommendedNow.task.priority || 'medium'}).`
            } else {
              finalSummary = validatedPlan.decision_explanation
            }
          } else if (report.recommendedNow) {
            finalSummary = `Recommended focus: "${report.recommendedNow.task.title}" (${report.recommendedNow.task.estimatedMinutes || 30}m, priority: ${report.recommendedNow.task.priority || 'medium'}). ${report.recommendedNow.reason || 'Optimal high-impact task.'}`
          } else if (report.topPriorities && report.topPriorities.length === 0) {
            finalSummary = 'All caught up! You currently have zero pending or urgent tasks scheduled. Great job staying ahead of your workload.'
          } else if (validatedPlan.decision_explanation) {
            finalSummary = validatedPlan.decision_explanation
          }
        } else if (validatedPlan.intent === 'SHOW_OVERDUE' && firstOutput) {
          const overdue = firstOutput as Array<{ title: string; daysOverdue?: number }>
          if (Array.isArray(overdue) && overdue.length > 0) {
            finalSummary = `Found ${overdue.length} overdue item(s): ${overdue.map(t => `"${t.title}"`).join(', ')}.`
          } else {
            finalSummary = 'Zero overdue tasks. You are completely on schedule!'
          }
        } else if (validatedPlan.intent === 'EXPLAIN_OVERLOAD' && firstOutput) {
          const report = firstOutput as {
            scheduleCapacity?: { isBankrupt: boolean; totalPlannedMinutes: number; totalAvailableMinutes: number; deficitMinutes: number }
          }
          const cap = report.scheduleCapacity
          if (cap) {
            finalSummary = cap.isBankrupt
              ? `Capacity Overload: ${cap.totalPlannedMinutes}m of planned tasks exceeds your ${cap.totalAvailableMinutes}m capacity (${cap.deficitMinutes}m deficit). Reorder tasks or defer lower-priority items.`
              : `Schedule is balanced: ${cap.totalPlannedMinutes}m planned within ${cap.totalAvailableMinutes}m available capacity.`
          } else if (validatedPlan.decision_explanation) {
            finalSummary = validatedPlan.decision_explanation
          }
        } else if (validatedPlan.decision_explanation) {
          finalSummary = validatedPlan.decision_explanation
        } else {
          finalSummary = `Plan completed successfully: All ${completedCount} step(s) executed and verified.`
        }
      } else {
        const createdTaskStep = stepResults.find(s => s.toolName === 'create_task' && s.status === 'success')
        const updatedTaskStep = stepResults.find(s => s.toolName === 'update_task' && s.status === 'success')
        if (createdTaskStep && createdTaskStep.outputData) {
          const t = createdTaskStep.outputData as { id?: string; title?: string }
          if (t?.id && t?.title) {
            finalSummary = `Task "${t.title}" (ID: ${t.id}) successfully created and verified in database.`
          } else {
            finalSummary = `Plan completed successfully: All ${completedCount} step(s) executed and verified.`
          }
        } else if (updatedTaskStep && updatedTaskStep.outputData) {
          const t = updatedTaskStep.outputData as { id?: string; title?: string }
          if (t?.id && t?.title) {
            finalSummary = `Task "${t.title}" (ID: ${t.id}) successfully updated and verified in database.`
          } else {
            finalSummary = `Plan completed successfully: All ${completedCount} step(s) executed and verified.`
          }
        } else {
          finalSummary = `Plan completed successfully: All ${completedCount} step(s) executed and verified.`
        }
      }
    } else if (overallStatus === 'partial') {
      const failedStep = stepResults.find(s => s.status === 'failed')
      finalSummary = `Plan partially completed: ${completedCount} of ${totalCount} step(s) succeeded. Step ${failedStep?.stepIndex || ''} (${failedStep?.toolName || 'action'}) failed: ${failedStep?.error || 'Execution halted safely'}.`
    } else {
      const failedStep = stepResults.find(s => s.status === 'failed')
      finalSummary = failedStep?.error
        ? `Plan execution failed: ${failedStep.error}. No unverified changes were committed to your database.`
        : `Plan execution failed. No unverified changes were committed to your database.`
    }

    AgentLogger.log('REPORT_FINALIZED', {
      overallStatus,
      completedCount,
      totalCount
    }, { planId: validatedPlan.id })

    return {
      planId: validatedPlan.id,
      overallStatus,
      completedSteps: completedCount,
      totalSteps: totalCount,
      stepResults,
      finalSummary,
      decisionExplanation: validatedPlan.decision_explanation,
      confidenceState: validatedPlan.confidence_state,
      responseMode: validatedPlan.response_mode || (overallStatus === 'success' ? 'completed_action' : 'failed_action'),
      requiresUserConfirmation: false,
      timestamp: new Date().toISOString()
    }
  }
}
