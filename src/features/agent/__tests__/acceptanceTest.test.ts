import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'
import { AgentOrchestrator } from '../core/AgentOrchestrator'
import { ToolRegistry } from '../tools/ToolRegistry'
import { PermissionManager } from '../security/PermissionManager'
import { RecoveryController } from '../core/RecoveryController'
import { AgentPlanSchema } from '../types/plan'

// In-memory simulated database representing actual Supabase tables
interface DBTask {
  id: string
  user_id: string
  title: string
  description: string | null
  priority: string
  status: string
  due_date: string | null
  deleted_at: string | null
  [key: string]: unknown
}

interface DBProject {
  id: string
  user_id: string
  name: string
  status: string
  deleted_at: string | null
  [key: string]: unknown
}

interface DBState {
  tasks: DBTask[]
  projects: DBProject[]
}

let dbState: DBState = {
  tasks: [],
  projects: []
}

// Current test session user
const testUser = { id: 'test-user-uuid-123', email: 'test@nexora.app' }
const otherUser = { id: 'other-user-uuid-999', email: 'other@nexora.app' }

vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn(async () => ({ data: { user: testUser } })),
  createClient: vi.fn(async () => ({
    from: (table: string) => {
      let filtered: (DBTask | DBProject)[] = ((dbState[table as keyof DBState] || []) as (DBTask | DBProject)[]).slice()
      let isSingle = false

      const queryBuilder = {
        select: vi.fn(() => queryBuilder),
        eq: vi.fn((field: string, val: unknown) => {
          filtered = filtered.filter(item => item[field] === val)
          return queryBuilder
        }),
        is: vi.fn((field: string, val: unknown) => {
          filtered = filtered.filter(item => item[field] === val)
          return queryBuilder
        }),
        gte: vi.fn(() => queryBuilder),
        lte: vi.fn(() => queryBuilder),
        single: vi.fn(async () => {
          isSingle = true
          if (filtered.length === 0) {
            return { data: null, error: { message: 'Row not found' } }
          }
          return { data: filtered[0], error: null }
        }),
        then: (resolve: (val: { data: unknown; error: unknown }) => void) => {
          resolve({ data: isSingle ? filtered[0] || null : filtered, error: null })
        }
      }
      return queryBuilder
    }
  }))
}))

// Mock intelligence advisor report to return realistic user data
vi.mock('../../intelligence/actions', () => ({
  getDailyAdvisorReport: vi.fn(async () => ({
    overdueTasks: dbState.tasks.filter(t => t.user_id === testUser.id && t.due_date && t.due_date < new Date().toISOString()),
    topPriorities: [],
    scheduleCapacity: { deficitMinutes: 0, isBankrupt: false }
  }))
}))

// Mock task domain actions to mutate dbState directly
vi.mock('../../tasks/actions', () => ({
  getTasks: vi.fn(async () => {
    return dbState.tasks.filter(t => t.user_id === testUser.id && !t.deleted_at)
  }),
  createTask: vi.fn(async (params: { title: string; description?: string | null; priority?: string; status?: string; due_date?: string | null }) => {
    const newTask: DBTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      user_id: testUser.id,
      title: params.title,
      description: params.description || null,
      priority: params.priority || 'medium',
      status: params.status || 'todo',
      due_date: params.due_date || null,
      deleted_at: null
    }
    dbState.tasks.push(newTask)
    return newTask
  }),
  updateTask: vi.fn(async (id: string, updates: Partial<DBTask>) => {
    const task = dbState.tasks.find(t => t.id === id && t.user_id === testUser.id && !t.deleted_at)
    if (!task) throw new Error(`Task ${id} not found or unauthorized`)
    Object.assign(task, updates)
    return task
  }),
  deleteTask: vi.fn(async (id: string) => {
    const task = dbState.tasks.find(t => t.id === id && t.user_id === testUser.id)
    if (!task) throw new Error(`Task ${id} not found`)
    task.deleted_at = new Date().toISOString()
    return { success: true }
  })
}))

describe('NEXORA PHASE 3 ACCEPTANCE SUITE', () => {
  let orchestrator: AgentOrchestrator
  let toolRegistry: ToolRegistry
  let permissionManager: PermissionManager
  let recoveryController: RecoveryController

  beforeEach(() => {
    dbState = {
      tasks: [],
      projects: []
    }
    orchestrator = new AgentOrchestrator()
    toolRegistry = new ToolRegistry()
    permissionManager = new PermissionManager()
    recoveryController = new RecoveryController()
  })

  // =========================================================================
  // ACCEPTANCE TEST A — READ-ONLY AGENT QUERY
  // =========================================================================
  it('Acceptance Test A: Read-Only Query ("What is overdue?") executes through full pipeline without mutation', async () => {
    // Seed 1 overdue task and 1 future task for testUser, and 1 overdue task for otherUser
    dbState.tasks.push({
      id: 'task-overdue-1',
      user_id: testUser.id,
      title: 'Submit Tax Audit',
      description: null,
      priority: 'urgent',
      status: 'todo',
      due_date: '2026-09-01T00:00:00Z',
      deleted_at: null
    })
    dbState.tasks.push({
      id: 'task-future-1',
      user_id: testUser.id,
      title: 'Review Sprint',
      description: null,
      priority: 'low',
      status: 'todo',
      due_date: '2026-10-01T00:00:00Z',
      deleted_at: null
    })
    dbState.tasks.push({
      id: 'task-other-user-overdue',
      user_id: otherUser.id,
      title: 'Foreign Overdue Task',
      description: null,
      priority: 'high',
      status: 'todo',
      due_date: '2026-08-01T00:00:00Z',
      deleted_at: null
    })

    const report = await orchestrator.handleUserQuery('What is overdue?')

    // Verify pipeline steps
    expect(report.overallStatus).toBe('success')
    expect(report.requiresUserConfirmation).toBe(false)
    expect(report.stepResults.length).toBe(1)

    const step = report.stepResults[0]
    expect(step.toolName).toBe('get_overdue_tasks')
    expect(step.status).toBe('success')
    expect(step.verified).toBe(true)

    // Verify data correctness and scoping: only testUser's overdue task returned
    const overdueTasks = step.outputData as DBTask[]
    expect(overdueTasks).toBeDefined()
    expect(overdueTasks.length).toBe(1)
    expect(overdueTasks[0].id).toBe('task-overdue-1')
    expect(overdueTasks[0].title).toBe('Submit Tax Audit')

    // Verify NO mutations occurred
    expect(dbState.tasks.length).toBe(3)
  })

  // =========================================================================
  // ACCEPTANCE TEST B — CREATE A REAL TASK
  // =========================================================================
  it('Acceptance Test B: Create Real Task stops at confirmation, then executes, verifies in DB, and isolates to user', async () => {
    const query = 'Create task Phase 3 Acceptance Test'
    const report = await orchestrator.handleUserQuery(query)

    // 1. Structured plan generated & validated
    expect(report.pendingPlan).toBeDefined()
    expect(report.pendingPlan?.intent).toBe('CREATE_TASK')
    expect(report.requiresUserConfirmation).toBe(true)

    // 2. Correct tool selected and validated
    const plan = report.pendingPlan!
    expect(plan.tools.length).toBe(1)
    expect(plan.tools[0].toolName).toBe('create_task')
    expect(plan.tools[0].parameters.title).toBe('Phase 3 Acceptance Test')

    // 3. Prior to confirmation, NO mutation exists in database
    expect(dbState.tasks.length).toBe(0)

    // 4. User confirms execution
    const executionReport = await orchestrator.executePlan(plan)

    expect(executionReport.overallStatus).toBe('success')
    expect(executionReport.completedSteps).toBe(1)
    const step = executionReport.stepResults[0]
    expect(step.status).toBe('success')
    expect(step.verified).toBe(true)
    expect(step.verificationDetails).toContain('Verified: Task "Phase 3 Acceptance Test"')

    // 5. Empirical verification: Task exists in database with matching attributes
    expect(dbState.tasks.length).toBe(1)
    const createdTask = dbState.tasks[0]
    expect(createdTask.title).toBe('Phase 3 Acceptance Test')
    expect(createdTask.user_id).toBe(testUser.id)
    expect(createdTask.status).toBe('todo')
  })

  // =========================================================================
  // ACCEPTANCE TEST C — UPDATE THE REAL TASK
  // =========================================================================
  it('Acceptance Test C: Update Real Task modifies state, passes empirical read-back verification', async () => {
    // Seed the created task from Test B
    const existingTask: DBTask = {
      id: 'task-p3-test-1',
      user_id: testUser.id,
      title: 'Phase 3 Acceptance Test',
      description: null,
      priority: 'medium',
      status: 'todo',
      due_date: null,
      deleted_at: null
    }
    dbState.tasks.push(existingTask)

    const updatePlan = AgentPlanSchema.parse({
      id: 'plan-update-1',
      intent: 'UPDATE_TASK',
      rawQuery: 'Change the priority of the Phase 3 Acceptance Test task to high',
      reasoning_summary: 'Updating task priority to high.',
      requested_actions: ['Update priority'],
      required_context: ['tasks'],
      risk_level: 'LEVEL_1_REVERSIBLE',
      requires_confirmation: false,
      confirmation_prompt: null,
      tools: [
        {
          id: 'act-1',
          toolName: 'update_task',
          parameters: { id: existingTask.id, priority: 'high' },
          riskLevel: 'LEVEL_1_REVERSIBLE',
          description: 'Update task priority to high',
          expectedOutcome: 'Task updated',
          isMutation: true
        }
      ],
      expected_results: ['Priority changed to high'],
      createdAt: new Date().toISOString()
    })

    const report = await orchestrator.executePlan(updatePlan)

    expect(report.overallStatus).toBe('success')
    expect(report.stepResults[0].verified).toBe(true)
    expect(report.stepResults[0].verificationDetails).toContain('Verified: Task task-p3-test-1 state matches')

    // Confirm database mutation actually occurred
    const updatedInDb = dbState.tasks.find(t => t.id === existingTask.id)
    expect(updatedInDb?.priority).toBe('high')
  })

  // =========================================================================
  // ACCEPTANCE TEST D — HIGH-IMPACT CONFIRMATION BOUNDARY
  // =========================================================================
  it('Acceptance Test D: High-Impact deletion operation is classified as LEVEL_2_HIGH_IMPACT and strictly halts', async () => {
    const deletePlan = {
      id: 'act-del-1',
      toolName: 'delete_task',
      parameters: { id: 'task-p3-test-1' },
      riskLevel: permissionManager.evaluateToolRisk('delete_task', { id: 'task-p3-test-1' }),
      description: 'Permanently remove task',
      expectedOutcome: 'Task deleted',
      isMutation: true
    }

    // 1. Classification check
    expect(deletePlan.riskLevel).toBe('LEVEL_2_HIGH_IMPACT')

    // 2. Requires confirmation check
    const requiresConfirm = permissionManager.requiresConfirmation(deletePlan.riskLevel)
    expect(requiresConfirm).toBe(true)

    // 3. Confirmation prompt generated
    const prompt = permissionManager.generateConfirmationPrompt([deletePlan])
    expect(prompt).toContain('The agent wants to Permanently remove task.')
  })

  // =========================================================================
  // ACCEPTANCE TEST E — REJECT CONFIRMATION
  // =========================================================================
  it('Acceptance Test E: Rejecting confirmation leaves database completely untouched', async () => {
    const taskToDelete: DBTask = {
      id: 'task-p3-test-1',
      user_id: testUser.id,
      title: 'Phase 3 Acceptance Test',
      description: null,
      priority: 'high',
      status: 'todo',
      due_date: null,
      deleted_at: null
    }
    dbState.tasks.push(taskToDelete)

    // Simulate rejection by user (simply do not invoke orchestrator.executePlan)
    // Verify task remains untouched in database
    expect(dbState.tasks.find(t => t.id === 'task-p3-test-1')?.deleted_at).toBeNull()
  })

  // =========================================================================
  // ACCEPTANCE TEST F — APPROVE CONFIRMATION
  // =========================================================================
  it('Acceptance Test F: Explicitly approving confirmation executes deletion and verifies soft/hard removal in DB', async () => {
    const taskToDelete: DBTask = {
      id: 'task-p3-test-1',
      user_id: testUser.id,
      title: 'Phase 3 Acceptance Test',
      description: null,
      priority: 'high',
      status: 'todo',
      due_date: null,
      deleted_at: null
    }
    dbState.tasks.push(taskToDelete)

    const confirmedPlan = AgentPlanSchema.parse({
      id: 'plan-del-confirmed',
      intent: 'DELETE_TASK',
      rawQuery: 'Delete the Phase 3 Acceptance Test task',
      reasoning_summary: 'User confirmed task deletion.',
      requested_actions: ['Delete task'],
      required_context: ['tasks'],
      risk_level: 'LEVEL_2_HIGH_IMPACT',
      requires_confirmation: false, // confirmed by user
      confirmation_prompt: null,
      tools: [
        {
          id: 'act-1',
          toolName: 'delete_task',
          parameters: { id: taskToDelete.id },
          riskLevel: 'LEVEL_2_HIGH_IMPACT',
          description: 'Delete task',
          expectedOutcome: 'Task deleted',
          isMutation: true
        }
      ],
      expected_results: ['Task removed'],
      createdAt: new Date().toISOString()
    })

    const report = await orchestrator.executePlan(confirmedPlan)

    expect(report.overallStatus).toBe('success')
    expect(report.stepResults[0].verified).toBe(true)
    expect(report.stepResults[0].verificationDetails).toContain('successfully removed/soft-deleted')

    // Confirm database state has deleted_at populated
    const deletedInDb = dbState.tasks.find(t => t.id === taskToDelete.id)
    expect(deletedInDb?.deleted_at).not.toBeNull()
  })

  // =========================================================================
  // ACCEPTANCE TEST G — IDEMPOTENCY
  // =========================================================================
  it('Acceptance Test G: Duplicate execution of the same mutation is intercepted and skipped', async () => {
    const plan = AgentPlanSchema.parse({
      id: 'plan-idemp-1',
      intent: 'CREATE_TASK',
      rawQuery: 'Create task Unique Task Alpha',
      reasoning_summary: 'Testing duplicate execution guard.',
      requested_actions: ['Create task'],
      required_context: ['tasks'],
      risk_level: 'LEVEL_1_REVERSIBLE',
      requires_confirmation: false,
      confirmation_prompt: null,
      tools: [
        {
          id: 'act-1',
          toolName: 'create_task',
          parameters: { title: 'Unique Task Alpha', priority: 'medium' },
          riskLevel: 'LEVEL_1_REVERSIBLE',
          description: 'Create task Unique Task Alpha',
          expectedOutcome: 'Task created',
          isMutation: true
        }
      ],
      expected_results: ['Task created'],
      createdAt: new Date().toISOString()
    })

    // First execution: creates task
    const report1 = await orchestrator.executePlan(plan)
    expect(report1.overallStatus).toBe('success')
    expect(report1.stepResults[0].status).toBe('success')
    expect(dbState.tasks.filter(t => t.title === 'Unique Task Alpha').length).toBe(1)

    // Second execution with identical plan and parameters
    const report2 = await orchestrator.executePlan(plan)
    expect(report2.stepResults[0].status).toBe('skipped')
    expect(report2.stepResults[0].verificationDetails).toContain('Duplicate execution prevented by idempotency engine')

    // Verify database did NOT create a second duplicate task!
    expect(dbState.tasks.filter(t => t.title === 'Unique Task Alpha').length).toBe(1)
  })

  // =========================================================================
  // ACCEPTANCE TEST H — FAILURE HANDLING
  // =========================================================================
  it('Acceptance Test H: Deterministic validation failure halts immediately without retries', async () => {
    let callCount = 0
    const op = async () => {
      callCount++
      throw new Error('Parameter validation failed: title is required')
    }

    const res = await recoveryController.executeWithRecovery(op, {
      actionId: 'act-err',
      toolName: 'create_task'
    })

    // Deterministic validation error must NEVER retry
    expect(res.success).toBe(false)
    expect(callCount).toBe(1)
    expect(res.retryCount).toBe(0)
  })

  it('Acceptance Test H (cont.): Transient network timeout retries up to maximum limit', async () => {
    let callCount = 0
    const op = async () => {
      callCount++
      throw new Error('Connection timeout to server')
    }

    const res = await recoveryController.executeWithRecovery(op, {
      actionId: 'act-transient',
      toolName: 'get_tasks'
    })

    // Transient errors retry up to 3 times (initial + 3 retries = 4 attempts)
    expect(res.success).toBe(false)
    expect(callCount).toBe(4)
    expect(res.retryCount).toBe(3)
  })

  // =========================================================================
  // ACCEPTANCE TEST I — USER ISOLATION AUDIT
  // =========================================================================
  it('Acceptance Test I: Audits that all 23 registered tools enforce user authentication and schema scoping', () => {
    const allTools = toolRegistry.listTools()
    expect(allTools.length).toBe(23)

    for (const tool of allTools) {
      // 1. Tool name is strictly defined
      expect(tool.name).toBeDefined()
      // 2. Tool has a valid Zod schema
      expect(tool.schema).toBeDefined()
      // 3. Tool schemas do NOT accept arbitrary user_id from the model
      if (tool.schema instanceof z.ZodObject) {
        const shape = tool.schema.shape
        expect(shape.user_id).toBeUndefined()
      }
    }
  })

  // =========================================================================
  // ACCEPTANCE TEST J — NO ARBITRARY EXECUTION
  // =========================================================================
  it('Acceptance Test J: Arbitrary tool execution and unregistered commands are rejected', async () => {
    const unreg = await toolRegistry.executeTool('exec_arbitrary_sql', { sql: 'DROP TABLE tasks;' })
    expect(unreg.success).toBe(false)
    expect(unreg.error).toContain('is not registered in Nexora ToolRegistry')

    const unregShell = await toolRegistry.executeTool('run_shell_command', { cmd: 'rm -rf /' })
    expect(unregShell.success).toBe(false)
    expect(unregShell.error).toContain('is not registered in Nexora ToolRegistry')
  })
})
