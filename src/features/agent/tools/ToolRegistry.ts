import { z } from 'zod'
import { RiskLevel } from '../types/plan'
import { getUser } from '@/lib/supabase/server'

// Domain actions
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask
} from '../../tasks/actions'
import {
  getProjects,
  createProject,
  updateProject
} from '../../projects/actions'
import {
  getGoals,
  createGoal,
  updateGoal
} from '../../goals/actions'
import {
  getHabits
} from '../../habits/actions'
import {
  getFocusStats
} from '../../focus/actions'
import {
  getTimelineBlocksForCalendar,
  getKyroSchedulingContext,
  saveTimelineBlocks
} from '../../timeline/actions'
import {
  getNotifications,
  createIdempotentNotification
} from '../../notifications/actions'
import {
  getDailyAdvisorReport
} from '../../intelligence/actions'
import {
  createTimetableSlot,
  updateTimetableSlot
} from '../../timeline/timetable-actions'
import { KyroEngine } from '../../kyro/core/KyroEngine'

export interface ToolDefinition<TParams = unknown, TOutput = unknown> {
  name: string
  description: string
  riskLevel: RiskLevel
  isMutation: boolean
  schema: z.ZodType<TParams>
  execute: (params: TParams) => Promise<TOutput>
}

// --------------------------------------------------------------------------
// READ TOOL SCHEMAS (10)
// --------------------------------------------------------------------------
export const GetTasksSchema = z.object({
  projectId: z.string().optional()
})

export const GetOverdueTasksSchema = z.object({})

export const GetProjectsSchema = z.object({})

export const GetGoalsSchema = z.object({})

export const GetHabitsSchema = z.object({})

export const GetFocusStatsSchema = z.object({})

export const GetScheduleSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional()
})

export const GetNotificationsSchema = z.object({})

export const GetProductivityReportSchema = z.object({
  targetDateIso: z.string().optional()
})

export const GetKyroRecommendationSchema = z.object({
  targetDateIso: z.string().optional()
})

// --------------------------------------------------------------------------
// ACTION TOOL SCHEMAS (13)
// --------------------------------------------------------------------------
export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  due_date: z.string().nullable().optional(),
  estimated_time_minutes: z.number().optional(),
  project_id: z.string().nullable().optional(),
  is_schedule_for_today: z.boolean().optional()
})

export const UpdateTaskSchema = z.object({
  id: z.string().min(1, 'Task ID is required'),
  title: z.string().optional(),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  due_date: z.string().nullable().optional(),
  estimated_time_minutes: z.number().optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  is_schedule_for_today: z.boolean().optional()
})

export const CompleteTaskSchema = z.object({
  id: z.string().min(1, 'Task ID is required')
})

export const DeleteTaskSchema = z.object({
  id: z.string().min(1, 'Task ID is required')
})

export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  color: z.string().optional(),
  due_date: z.string().optional()
})

export const UpdateProjectSchema = z.object({
  id: z.string().min(1, 'Project ID is required'),
  name: z.string().optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  status: z.enum(['active', 'archived', 'completed']).optional(),
  due_date: z.string().optional()
})

export const CreateGoalSchema = z.object({
  title: z.string().min(1, 'Goal title is required'),
  type: z.enum(['daily', 'weekly', 'monthly']),
  period_start: z.string(),
  period_end: z.string()
})

export const UpdateGoalSchema = z.object({
  id: z.string().min(1, 'Goal ID is required'),
  title: z.string().optional(),
  type: z.enum(['daily', 'weekly', 'monthly']).optional(),
  status: z.enum(['active', 'completed', 'failed']).optional()
})

export const ScheduleTasksSchema = z.object({
  targetDateIso: z.string().optional(),
  blocks: z.array(z.any()).optional()
})

export const MoveDeadlineSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  newDueDate: z.string().min(1, 'New due date is required')
})

export const CreateTimetableBlockSchema = z.object({
  day_of_week: z.number().min(0).max(6),
  start_time: z.string(),
  end_time: z.string(),
  label: z.string().min(1, 'Slot label is required'),
  color: z.string().optional()
})

export const UpdateTimetableBlockSchema = z.object({
  id: z.string().min(1, 'Slot ID is required'),
  day_of_week: z.number().min(0).max(6).optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  label: z.string().optional(),
  color: z.string().optional()
})

export const CreateNotificationSchema = z.object({
  title: z.string().min(1, 'Notification title is required'),
  message: z.string().min(1, 'Notification message is required'),
  type: z.enum(['system', 'reminder', 'achievement', 'kyro']).default('system'),
  cooldownHours: z.number().optional()
})

// --------------------------------------------------------------------------
// CONTROLLED TOOL REGISTRY
// --------------------------------------------------------------------------
export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>()

  constructor() {
    this.registerReadTools()
    this.registerActionTools()
  }

  private registerReadTools(): void {
    // 1. get_tasks
    this.register({
      name: 'get_tasks',
      description: 'Retrieve user tasks, optionally filtered by project ID',
      riskLevel: 'LEVEL_0_READ',
      isMutation: false,
      schema: GetTasksSchema,
      execute: async (params) => {
        return getTasks(params.projectId)
      }
    })

    // 2. get_overdue_tasks
    this.register({
      name: 'get_overdue_tasks',
      description: 'Inspect all currently overdue tasks and critical missed deadlines',
      riskLevel: 'LEVEL_0_READ',
      isMutation: false,
      schema: GetOverdueTasksSchema,
      execute: async () => {
        const report = await getDailyAdvisorReport()
        return report.overdueTasks
      }
    })

    // 3. get_projects
    this.register({
      name: 'get_projects',
      description: 'Retrieve user active and archived projects with child task metrics',
      riskLevel: 'LEVEL_0_READ',
      isMutation: false,
      schema: GetProjectsSchema,
      execute: async () => {
        return getProjects()
      }
    })

    // 4. get_goals
    this.register({
      name: 'get_goals',
      description: 'Retrieve active daily, weekly, and monthly productivity goals',
      riskLevel: 'LEVEL_0_READ',
      isMutation: false,
      schema: GetGoalsSchema,
      execute: async () => {
        return getGoals()
      }
    })

    // 5. get_habits
    this.register({
      name: 'get_habits',
      description: 'Retrieve recurring habits and active streak statistics',
      riskLevel: 'LEVEL_0_READ',
      isMutation: false,
      schema: GetHabitsSchema,
      execute: async () => {
        return getHabits()
      }
    })

    // 6. get_focus_stats
    this.register({
      name: 'get_focus_stats',
      description: 'Inspect today and historical Pomodoro / deep focus session minutes',
      riskLevel: 'LEVEL_0_READ',
      isMutation: false,
      schema: GetFocusStatsSchema,
      execute: async () => {
        return getFocusStats()
      }
    })

    // 7. get_schedule
    this.register({
      name: 'get_schedule',
      description: 'Retrieve scheduled timeline blocks and calendar events for a date range',
      riskLevel: 'LEVEL_0_READ',
      isMutation: false,
      schema: GetScheduleSchema,
      execute: async (params) => {
        const start = params.startDate || new Date().toISOString().split('T')[0]
        const end = params.endDate || start
        return getTimelineBlocksForCalendar(start, end)
      }
    })

    // 8. get_notifications
    this.register({
      name: 'get_notifications',
      description: 'Retrieve user system, reminder, achievement, and Kyro notifications',
      riskLevel: 'LEVEL_0_READ',
      isMutation: false,
      schema: GetNotificationsSchema,
      execute: async () => {
        return getNotifications()
      }
    })

    // 9. get_productivity_report
    this.register({
      name: 'get_productivity_report',
      description: 'Generate full deterministic advisor report analyzing capacity and top priorities',
      riskLevel: 'LEVEL_0_READ',
      isMutation: false,
      schema: GetProductivityReportSchema,
      execute: async (params) => {
        return getDailyAdvisorReport(params.targetDateIso)
      }
    })

    // 10. get_kyro_recommendation
    this.register({
      name: 'get_kyro_recommendation',
      description: 'Calculate optimal task scheduling plan without saving to database',
      riskLevel: 'LEVEL_0_READ',
      isMutation: false,
      schema: GetKyroRecommendationSchema,
      execute: async (params) => {
        const context = await getKyroSchedulingContext()
        const engine = new KyroEngine()
        const targetDate = params.targetDateIso ? new Date(params.targetDateIso) : new Date()
        const proposedBlocks = await engine.schedule(context, targetDate)
        const diagnostics = engine.diagnose(context, targetDate)
        return { proposedBlocks, diagnostics }
      }
    })
  }

  private registerActionTools(): void {
    // 1. create_task
    this.register({
      name: 'create_task',
      description: 'Create a new task in user workspace',
      riskLevel: 'LEVEL_1_REVERSIBLE',
      isMutation: true,
      schema: CreateTaskSchema,
      execute: async (params) => {
        return createTask({
          title: params.title,
          description: params.description ?? null,
          priority: params.priority || 'medium',
          status: 'todo',
          due_date: params.due_date ?? null,
          estimated_time_minutes: params.estimated_time_minutes ?? null,
          project_id: params.project_id ?? null,
          is_schedule_for_today: params.is_schedule_for_today ?? false,
          is_urgent: params.priority === 'urgent',
          is_important: params.priority === 'high' || params.priority === 'urgent',
          recurrence_rule: null
        })
      }
    })

    // 2. update_task
    this.register({
      name: 'update_task',
      description: 'Update existing task title, priority, due date, or status',
      riskLevel: 'LEVEL_1_REVERSIBLE',
      isMutation: true,
      schema: UpdateTaskSchema,
      execute: async (params) => {
        const { id, ...updates } = params
        return updateTask(id, updates)
      }
    })

    // 3. complete_task
    this.register({
      name: 'complete_task',
      description: 'Mark a task as completed',
      riskLevel: 'LEVEL_1_REVERSIBLE',
      isMutation: true,
      schema: CompleteTaskSchema,
      execute: async (params) => {
        return updateTask(params.id, { status: 'done' })
      }
    })

    // 4. delete_task
    this.register({
      name: 'delete_task',
      description: 'Permanently remove or soft-delete a task',
      riskLevel: 'LEVEL_2_HIGH_IMPACT',
      isMutation: true,
      schema: DeleteTaskSchema,
      execute: async (params) => {
        return deleteTask(params.id)
      }
    })

    // 5. create_project
    this.register({
      name: 'create_project',
      description: 'Create a new project folder for organizing tasks',
      riskLevel: 'LEVEL_1_REVERSIBLE',
      isMutation: true,
      schema: CreateProjectSchema,
      execute: async (params) => {
        return createProject({
          name: params.name,
          description: params.description ?? null,
          color: params.color || '#3B82F6',
          status: 'active',
          due_date: params.due_date ?? null
        })
      }
    })

    // 6. update_project
    this.register({
      name: 'update_project',
      description: 'Update project details, color, or status',
      riskLevel: 'LEVEL_1_REVERSIBLE',
      isMutation: true,
      schema: UpdateProjectSchema,
      execute: async (params) => {
        const { id, ...updates } = params
        return updateProject(id, updates)
      }
    })

    // 7. create_goal
    this.register({
      name: 'create_goal',
      description: 'Create a daily, weekly, or monthly goal',
      riskLevel: 'LEVEL_1_REVERSIBLE',
      isMutation: true,
      schema: CreateGoalSchema,
      execute: async (params) => {
        return createGoal(params.title, params.type, params.period_start, params.period_end)
      }
    })

    // 8. update_goal
    this.register({
      name: 'update_goal',
      description: 'Update goal title, type, or completion status',
      riskLevel: 'LEVEL_1_REVERSIBLE',
      isMutation: true,
      schema: UpdateGoalSchema,
      execute: async (params) => {
        const { id, ...updates } = params
        return updateGoal(id, updates)
      }
    })

    // 9. schedule_tasks
    this.register({
      name: 'schedule_tasks',
      description: 'Apply Kyro calculated timetable blocks directly to user timeline',
      riskLevel: 'LEVEL_2_HIGH_IMPACT',
      isMutation: true,
      schema: ScheduleTasksSchema,
      execute: async (params) => {
        let blocksToSave = params.blocks
        if (!blocksToSave || blocksToSave.length === 0) {
          const context = await getKyroSchedulingContext()
          const engine = new KyroEngine()
          const targetDate = params.targetDateIso ? new Date(params.targetDateIso) : new Date()
          blocksToSave = await engine.schedule(context, targetDate)
        }
        return saveTimelineBlocks(blocksToSave as unknown as Parameters<typeof saveTimelineBlocks>[0])
      }
    })

    // 10. move_deadline
    this.register({
      name: 'move_deadline',
      description: 'Reschedule task due date to a new target timestamp',
      riskLevel: 'LEVEL_2_HIGH_IMPACT',
      isMutation: true,
      schema: MoveDeadlineSchema,
      execute: async (params) => {
        return updateTask(params.taskId, { due_date: params.newDueDate })
      }
    })

    // 11. create_timetable_block
    this.register({
      name: 'create_timetable_block',
      description: 'Create a recurring weekly commitment block in timetable',
      riskLevel: 'LEVEL_1_REVERSIBLE',
      isMutation: true,
      schema: CreateTimetableBlockSchema,
      execute: async (params) => {
        return createTimetableSlot(params)
      }
    })

    // 12. update_timetable_block
    this.register({
      name: 'update_timetable_block',
      description: 'Update recurring weekly timetable block timing or label',
      riskLevel: 'LEVEL_1_REVERSIBLE',
      isMutation: true,
      schema: UpdateTimetableBlockSchema,
      execute: async (params) => {
        const { id, ...updates } = params
        return updateTimetableSlot(id, updates)
      }
    })

    // 13. create_notification
    this.register({
      name: 'create_notification',
      description: 'Generate an in-app reminder or alert for the user',
      riskLevel: 'LEVEL_1_REVERSIBLE',
      isMutation: true,
      schema: CreateNotificationSchema,
      execute: async (params) => {
        return createIdempotentNotification(params)
      }
    })
  }

  public register<TParams, TOutput>(tool: ToolDefinition<TParams, TOutput>): void {
    this.tools.set(tool.name, tool as unknown as ToolDefinition<unknown, unknown>)
  }

  public getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name)
  }

  public listTools(): ToolDefinition[] {
    return Array.from(this.tools.values())
  }

  public getReadTools(): ToolDefinition[] {
    return this.listTools().filter(t => !t.isMutation)
  }

  public getActionTools(): ToolDefinition[] {
    return this.listTools().filter(t => t.isMutation)
  }

  /**
   * Executes a tool with strict authentication, validation, and error containment.
   */
  public async executeTool(name: string, rawParams: unknown): Promise<{
    success: boolean
    data?: unknown
    error?: string
  }> {
    const tool = this.getTool(name)
    if (!tool) {
      return { success: false, error: `Tool "${name}" is not registered in Nexora ToolRegistry.` }
    }

    // 1. Authenticate user
    const { data: { user } } = await getUser()
    if (!user) {
      return { success: false, error: 'Unauthorized: No active session.' }
    }

    // 2. Validate parameters against strict Zod schema
    const parseResult = tool.schema.safeParse(rawParams || {})
    if (!parseResult.success) {
      const issueDetails = parseResult.error.issues
        .map(i => `${i.path.join('.')}: ${i.message}`)
        .join(', ')
      return {
        success: false,
        error: `Parameter validation failed for tool "${name}": ${issueDetails}`
      }
    }

    // 3. Execute domain action
    try {
      const data = await (tool.execute as (p: unknown) => Promise<unknown>)(parseResult.data)
      return { success: true, data }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      return { success: false, error: message }
    }
  }
}
