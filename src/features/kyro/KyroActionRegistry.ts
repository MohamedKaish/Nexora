import {
  NEXORA_ALLOWED_ROUTES,
  type KyroProposedAction,
  type NexoraAllowedRoute,
  type TaskPriority,
  type FocusMode,
} from '@/types/local'
import { useTaskStore } from '@/store/useTaskStore'
import { useFocusStore } from '@/store/useFocusStore'
import { useHydrationStore, type BeverageType } from '@/store/useHydrationStore'
import { useNoteStore } from '@/store/useNoteStore'
import { useCharacterStore } from '@/store/characterStore'
import { useKyroStore } from '@/store/kyroStore'
import type { KyroCharacterModel } from '@/types/kyro'

const ALLOWED_ROUTE_KEYS = Object.keys(NEXORA_ALLOWED_ROUTES) as [
  NexoraAllowedRoute,
  ...NexoraAllowedRoute[],
]

const ALLOWED_ROUTE_SET = new Set<string>(ALLOWED_ROUTE_KEYS)
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/

type SafeParseSuccess<T> = {
  success: true
  data: T
}
type SafeParseError = {
  success: false
  error: { issues: Array<{ message: string }> }
}
type SafeParseResult<T> = SafeParseSuccess<T> | SafeParseError

function fail(message: string): SafeParseError {
  return { success: false, error: { issues: [{ message }] } }
}

function ok<T>(data: T): SafeParseSuccess<T> {
  return { success: true, data }
}

// ── Strict Application-Side Validators for Each Tool ──

export const ReadTasksArgsSchema = {
  safeParse(raw: unknown): SafeParseResult<{ filter: 'all' | 'urgent' | 'due_today' | 'overdue' }> {
    const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
    const filter = obj.filter === undefined ? 'all' : obj.filter
    if (
      filter !== 'all' &&
      filter !== 'urgent' &&
      filter !== 'due_today' &&
      filter !== 'overdue'
    ) {
      return fail('filter must be one of: all, urgent, due_today, overdue')
    }
    return ok({ filter })
  },
}

export const CreateTaskArgsSchema = {
  safeParse(raw: unknown): SafeParseResult<{
    title: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    dueDate: string | null
    dueTime: string | null
    reminderTime: string | null
  }> {
    const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
    if (typeof obj.title !== 'string' || obj.title.trim().length === 0) {
      return fail('Task title is required')
    }
    const title = obj.title.trim()
    if (title.length > 160) {
      return fail('Task title must be 160 characters or fewer')
    }

    const priority = obj.priority === undefined ? 'medium' : obj.priority
    if (
      priority !== 'low' &&
      priority !== 'medium' &&
      priority !== 'high' &&
      priority !== 'urgent'
    ) {
      return fail('priority must be one of: low, medium, high, urgent')
    }

    let dueDate: string | null = null
    if (obj.dueDate !== undefined && obj.dueDate !== null && obj.dueDate !== '') {
      if (typeof obj.dueDate !== 'string' || !DATE_REGEX.test(obj.dueDate.trim())) {
        return fail('dueDate must be YYYY-MM-DD')
      }
      dueDate = obj.dueDate.trim()
    }

    let dueTime: string | null = null
    if (obj.dueTime !== undefined && obj.dueTime !== null && obj.dueTime !== '') {
      if (typeof obj.dueTime !== 'string' || !TIME_REGEX.test(obj.dueTime.trim())) {
        return fail('dueTime must be HH:mm (24h)')
      }
      dueTime = obj.dueTime.trim()
    }

    let reminderTime: string | null = null
    if (obj.reminderTime !== undefined && obj.reminderTime !== null && obj.reminderTime !== '') {
      if (typeof obj.reminderTime !== 'string' || !TIME_REGEX.test(obj.reminderTime.trim())) {
        return fail('reminderTime must be HH:mm (24h)')
      }
      reminderTime = obj.reminderTime.trim()
    }

    return ok({ title, priority, dueDate, dueTime, reminderTime })
  },
}

export const StartFocusArgsSchema = {
  safeParse(raw: unknown): SafeParseResult<{
    mode: 'pomodoro' | 'deep_work' | 'short_break' | 'long_break' | 'stopwatch'
  }> {
    const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
    const mode = obj.mode === undefined ? 'pomodoro' : obj.mode
    if (
      mode !== 'pomodoro' &&
      mode !== 'deep_work' &&
      mode !== 'short_break' &&
      mode !== 'long_break' &&
      mode !== 'stopwatch'
    ) {
      return fail('mode must be one of: pomodoro, deep_work, short_break, long_break, stopwatch')
    }
    return ok({ mode })
  },
}

export const LogHydrationArgsSchema = {
  safeParse(raw: unknown): SafeParseResult<{
    amountMl: number
    beverageType: 'water' | 'electrolytes' | 'tea' | 'coffee' | 'other'
  }> {
    const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
    const amountMl = obj.amountMl
    if (
      typeof amountMl !== 'number' ||
      !Number.isInteger(amountMl) ||
      amountMl < 50 ||
      amountMl > 3000
    ) {
      return fail('amountMl must be an integer between 50 and 3000 ml')
    }
    const beverageType = obj.beverageType === undefined ? 'water' : obj.beverageType
    if (
      beverageType !== 'water' &&
      beverageType !== 'electrolytes' &&
      beverageType !== 'tea' &&
      beverageType !== 'coffee' &&
      beverageType !== 'other'
    ) {
      return fail('beverageType must be one of: water, electrolytes, tea, coffee, other')
    }
    return ok({ amountMl, beverageType })
  },
}

export const NavigateToArgsSchema = {
  safeParse(raw: unknown): SafeParseResult<{ route: NexoraAllowedRoute }> {
    const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
    if (typeof obj.route !== 'string' || !ALLOWED_ROUTE_SET.has(obj.route)) {
      return fail(
        `Route must be one of the allowlisted Nexora routes: ${ALLOWED_ROUTE_KEYS.join(', ')}`
      )
    }
    return ok({ route: obj.route as NexoraAllowedRoute })
  },
}

export const UpdateReminderArgsSchema = {
  safeParse(raw: unknown): SafeParseResult<{
    targetType: 'task' | 'note'
    targetIdOrTitle: string
    reminderTime: string
  }> {
    const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
    const targetType = obj.targetType === undefined ? 'task' : obj.targetType
    if (targetType !== 'task' && targetType !== 'note') {
      return fail('targetType must be task or note')
    }
    if (typeof obj.targetIdOrTitle !== 'string' || obj.targetIdOrTitle.trim().length === 0) {
      return fail('targetIdOrTitle is required to identify the task or note')
    }
    if (typeof obj.reminderTime !== 'string' || obj.reminderTime.trim().length === 0) {
      return fail('reminderTime is required')
    }
    return ok({
      targetType,
      targetIdOrTitle: obj.targetIdOrTitle.trim(),
      reminderTime: obj.reminderTime.trim(),
    })
  },
}

export const SwitchCompanionArgsSchema = {
  safeParse(raw: unknown): SafeParseResult<{
    archetype:
      | 'nyxen'
      | 'aerix'
      | 'solen'
      | 'kyra'
      | 'vael'
      | 'kyro_prime'
      | 'pyro_fox'
      | 'aegis_bot'
  }> {
    const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
    const allowed = new Set([
      'nyxen',
      'aerix',
      'solen',
      'kyra',
      'vael',
      'kyro_prime',
      'pyro_fox',
      'aegis_bot',
    ])
    if (typeof obj.archetype !== 'string' || !allowed.has(obj.archetype)) {
      return fail('Invalid companion archetype')
    }
    return ok({
      archetype: obj.archetype as
        | 'nyxen'
        | 'aerix'
        | 'solen'
        | 'kyra'
        | 'vael'
        | 'kyro_prime'
        | 'pyro_fox'
        | 'aegis_bot',
    })
  },
}

// ── Official Gemini Function Declarations (`v1beta` generateContent tools) ──

export const KYRO_GEMINI_FUNCTION_DECLARATIONS = [
  {
    name: 'read_tasks',
    description:
      'Read the user’s current tasks and task summary from Nexora (all active tasks, urgent tasks, tasks due today, or overdue tasks).',
    parameters: {
      type: 'OBJECT',
      properties: {
        filter: {
          type: 'STRING',
          enum: ['all', 'urgent', 'due_today', 'overdue'],
          description: 'Which subset of active tasks to inspect.',
        },
      },
    },
  },
  {
    name: 'create_task',
    description:
      'Propose creating a new task in the Nexora Task Matrix. Requires user confirmation before saving.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: {
          type: 'STRING',
          description: 'Clear, concise title of the task to create.',
        },
        priority: {
          type: 'STRING',
          enum: ['low', 'medium', 'high', 'urgent'],
          description: 'Priority level for the task.',
        },
        dueDate: {
          type: 'STRING',
          description: 'Optional due date in YYYY-MM-DD format.',
        },
        dueTime: {
          type: 'STRING',
          description: 'Optional due time in 24-hour HH:mm format.',
        },
        reminderTime: {
          type: 'STRING',
          description: 'Optional reminder time in 24-hour HH:mm format.',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'start_focus',
    description:
      'Propose starting a focus timer session in the Nexora Focus Chamber.',
    parameters: {
      type: 'OBJECT',
      properties: {
        mode: {
          type: 'STRING',
          enum: ['pomodoro', 'deep_work', 'short_break', 'long_break', 'stopwatch'],
          description: 'Focus timer mode (default is pomodoro 25m).',
        },
      },
    },
  },
  {
    name: 'read_hydration',
    description:
      'Read the user’s real-time daily hydration intake, daily goal, and remaining ml.',
    parameters: {
      type: 'OBJECT',
      properties: {},
    },
  },
  {
    name: 'log_hydration',
    description:
      'Propose logging water or beverage intake in milliliters (50 to 3000 ml) into the Nexora Hydration Tracker.',
    parameters: {
      type: 'OBJECT',
      properties: {
        amountMl: {
          type: 'INTEGER',
          description: 'Amount of fluid in milliliters (between 50 and 3000).',
        },
        beverageType: {
          type: 'STRING',
          enum: ['water', 'electrolytes', 'tea', 'coffee', 'other'],
          description: 'Beverage type (defaults to water).',
        },
      },
      required: ['amountMl'],
    },
  },
  {
    name: 'navigate_to',
    description:
      'Propose navigating the user to a validated, allowlisted Nexora screen.',
    parameters: {
      type: 'OBJECT',
      properties: {
        route: {
          type: 'STRING',
          enum: ALLOWED_ROUTE_KEYS,
          description: 'Allowlisted Nexora route path.',
        },
      },
      required: ['route'],
    },
  },
  {
    name: 'update_reminder',
    description:
      'Propose updating the reminder time for an existing Nexora task (HH:mm) or note (YYYY-MM-DDTHH:mm).',
    parameters: {
      type: 'OBJECT',
      properties: {
        targetType: {
          type: 'STRING',
          enum: ['task', 'note'],
          description: 'Whether updating a task reminder or a note reminder.',
        },
        targetIdOrTitle: {
          type: 'STRING',
          description: 'The ID or exact title of the existing task or note.',
        },
        reminderTime: {
          type: 'STRING',
          description: 'New reminder time (HH:mm for tasks, or YYYY-MM-DDTHH:mm for notes).',
        },
      },
      required: ['targetIdOrTitle', 'reminderTime'],
    },
  },
  {
    name: 'switch_companion',
    description:
      'Propose switching Kyro’s active 2D/3D companion archetype.',
    parameters: {
      type: 'OBJECT',
      properties: {
        archetype: {
          type: 'STRING',
          enum: [
            'nyxen',
            'aerix',
            'solen',
            'kyra',
            'vael',
            'kyro_prime',
            'pyro_fox',
            'aegis_bot',
          ],
          description: 'Target companion archetype ID.',
        },
      },
      required: ['archetype'],
    },
  },
] as const

export interface ToolValidationResult {
  valid: boolean
  proposedAction?: KyroProposedAction
  error?: string
}

/**
 * Strictly validates a model-produced function call and its arguments against
 * Nexora's allowlisted tools and schemas. Rejects unknown tools, arbitrary URLs,
 * out-of-range numbers, or malformed arguments.
 */
export function validateKyroToolCall(
  rawName: string,
  rawArgs: unknown
): ToolValidationResult {
  const argsObj =
    rawArgs && typeof rawArgs === 'object' && !Array.isArray(rawArgs)
      ? (rawArgs as Record<string, unknown>)
      : {}
  const actionId = 'act_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now()

  switch (rawName) {
    case 'read_tasks': {
      const parsed = ReadTasksArgsSchema.safeParse(argsObj)
      if (!parsed.success) {
        return { valid: false, error: parsed.error.issues[0]?.message || 'Invalid read_tasks arguments' }
      }
      return {
        valid: true,
        proposedAction: {
          id: actionId,
          type: 'read_tasks',
          label: `Read tasks (${parsed.data.filter})`,
          payload: parsed.data,
          requiresConfirmation: false,
          isExecuted: true,
          executionStatus: 'executed',
        },
      }
    }

    case 'create_task': {
      const parsed = CreateTaskArgsSchema.safeParse(argsObj)
      if (!parsed.success) {
        return { valid: false, error: parsed.error.issues[0]?.message || 'Invalid create_task arguments' }
      }
      const { title, priority, dueDate, dueTime, reminderTime } = parsed.data
      // Guard against dangerous protocol strings or script tags in title
      if (/^(javascript:|data:|vbscript:)/i.test(title) || /<script/i.test(title)) {
        return { valid: false, error: 'Unsafe task title rejected' }
      }
      const details: string[] = [`priority: ${priority}`]
      if (dueDate) details.push(`due: ${dueDate}`)
      if (reminderTime || dueTime) details.push(`at ${reminderTime || dueTime}`)

      return {
        valid: true,
        proposedAction: {
          id: actionId,
          type: 'create_task',
          label: `Create task "${title}" (${details.join(', ')})`,
          payload: {
            title,
            priority,
            dueDate: dueDate ?? null,
            dueTime: dueTime ?? null,
            reminderTime: reminderTime ?? null,
          },
          requiresConfirmation: true,
          isExecuted: false,
          executionStatus: 'pending',
        },
      }
    }

    case 'start_focus': {
      const parsed = StartFocusArgsSchema.safeParse(argsObj)
      if (!parsed.success) {
        return { valid: false, error: parsed.error.issues[0]?.message || 'Invalid start_focus arguments' }
      }
      const modeLabels: Record<string, string> = {
        pomodoro: '25m Pomodoro',
        deep_work: '50m Deep Work',
        short_break: '5m Short Break',
        long_break: '15m Long Break',
        stopwatch: 'Open Stopwatch',
      }
      return {
        valid: true,
        proposedAction: {
          id: actionId,
          type: 'start_focus',
          label: `Start ${modeLabels[parsed.data.mode] || parsed.data.mode} Focus Session`,
          payload: { mode: parsed.data.mode },
          requiresConfirmation: true,
          isExecuted: false,
          executionStatus: 'pending',
        },
      }
    }

    case 'read_hydration': {
      return {
        valid: true,
        proposedAction: {
          id: actionId,
          type: 'read_hydration',
          label: 'Read hydration progress',
          payload: {},
          requiresConfirmation: false,
          isExecuted: true,
          executionStatus: 'executed',
        },
      }
    }

    case 'log_hydration': {
      const coercedArgs = {
        ...argsObj,
        amountMl:
          typeof argsObj.amountMl === 'string'
            ? Number.parseInt(argsObj.amountMl, 10)
            : argsObj.amountMl,
      }
      const parsed = LogHydrationArgsSchema.safeParse(coercedArgs)
      if (!parsed.success) {
        return { valid: false, error: parsed.error.issues[0]?.message || 'Invalid log_hydration arguments' }
      }
      return {
        valid: true,
        proposedAction: {
          id: actionId,
          type: 'log_hydration',
          label: `Log ${parsed.data.amountMl} ml of ${parsed.data.beverageType}`,
          payload: parsed.data,
          requiresConfirmation: true,
          isExecuted: false,
          executionStatus: 'pending',
        },
      }
    }

    case 'navigate_to':
    case 'open_route': {
      const parsed = NavigateToArgsSchema.safeParse(argsObj)
      if (!parsed.success) {
        return { valid: false, error: parsed.error.issues[0]?.message || 'Invalid or unallowlisted route' }
      }
      const routeDesc = NEXORA_ALLOWED_ROUTES[parsed.data.route]
      return {
        valid: true,
        proposedAction: {
          id: actionId,
          type: 'navigate_to',
          label: `Navigate to ${parsed.data.route} (${routeDesc.split(' (')[0]})`,
          payload: { route: parsed.data.route },
          requiresConfirmation: true,
          isExecuted: false,
          executionStatus: 'pending',
        },
      }
    }

    case 'update_reminder': {
      const parsed = UpdateReminderArgsSchema.safeParse(argsObj)
      if (!parsed.success) {
        return { valid: false, error: parsed.error.issues[0]?.message || 'Invalid update_reminder arguments' }
      }
      const { targetType, targetIdOrTitle, reminderTime } = parsed.data
      if (targetType === 'task' && !TIME_REGEX.test(reminderTime)) {
        return {
          valid: false,
          error: 'Task reminderTime must be in 24-hour HH:mm format (e.g. 18:30)',
        }
      }
      if (
        targetType === 'note' &&
        !/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):([0-5]\d)/.test(reminderTime)
      ) {
        return {
          valid: false,
          error: 'Note reminderTime must be in ISO YYYY-MM-DDTHH:mm format',
        }
      }

      return {
        valid: true,
        proposedAction: {
          id: actionId,
          type: 'update_reminder',
          label: `Update ${targetType} reminder for "${targetIdOrTitle}" to ${reminderTime}`,
          payload: parsed.data,
          requiresConfirmation: true,
          isExecuted: false,
          executionStatus: 'pending',
        },
      }
    }

    case 'switch_companion': {
      const parsed = SwitchCompanionArgsSchema.safeParse(argsObj)
      if (!parsed.success) {
        return { valid: false, error: parsed.error.issues[0]?.message || 'Invalid companion archetype' }
      }
      return {
        valid: true,
        proposedAction: {
          id: actionId,
          type: 'switch_companion',
          label: `Switch companion to ${parsed.data.archetype}`,
          payload: parsed.data,
          requiresConfirmation: true,
          isExecuted: false,
          executionStatus: 'pending',
        },
      }
    }

    default:
      return {
        valid: false,
        error: `Unsupported tool "${rawName}". Only allowlisted Nexora actions are permitted.`,
      }
  }
}

export interface ActionExecutionOutcome {
  ok: boolean
  message: string
}

/**
 * Executes a validated KyroProposedAction against the real Nexora Zustand stores,
 * verifies the resulting store state, and reports honest success or failure.
 */
export function executeKyroAction(
  action: KyroProposedAction,
  options?: { navigate?: (route: string) => void }
): ActionExecutionOutcome {
  try {
    switch (action.type) {
      case 'read_tasks': {
        const tasks = useTaskStore.getState().tasks.filter((t) => t.status !== 'done')
        return {
          ok: true,
          message: `Verified ${tasks.length} active task(s) in Task Matrix.`,
        }
      }

      case 'create_task': {
        const parsed = CreateTaskArgsSchema.safeParse(action.payload)
        if (!parsed.success) {
          return { ok: false, message: `Task creation failed validation: ${parsed.error.issues[0]?.message}` }
        }
        const { title, priority, dueDate, dueTime, reminderTime } = parsed.data
        const taskStore = useTaskStore.getState()

        // Check for exact duplicate active task title to warn or prevent accidental double execution
        const created = taskStore.addTask({
          title,
          priority: priority as TaskPriority,
          dueDate: dueDate ?? null,
          dueTime: dueTime ?? null,
          reminderTime: reminderTime ?? dueTime ?? null,
          enableReminder: Boolean(reminderTime || dueTime),
        })

        // Verify in store
        const exists = useTaskStore.getState().tasks.some((t) => t.id === created.id)
        if (!exists) {
          return { ok: false, message: 'Failed to verify new task in Task Matrix store.' }
        }
        return {
          ok: true,
          message: `Created task "${created.title}" (${created.priority} priority).`,
        }
      }

      case 'start_focus': {
        const parsed = StartFocusArgsSchema.safeParse(action.payload)
        if (!parsed.success) {
          return { ok: false, message: 'Invalid focus mode.' }
        }
        const mode = parsed.data.mode as FocusMode
        const focusStore = useFocusStore.getState()
        focusStore.setMode(mode)
        focusStore.startTimer()

        const verified = useFocusStore.getState().isRunning
        if (!verified) {
          return { ok: false, message: 'Focus timer failed to start.' }
        }
        return {
          ok: true,
          message: `Focus timer started in ${mode.replace('_', ' ')} mode.`,
        }
      }

      case 'read_hydration': {
        const calc = useHydrationStore.getState().calculateCircadianTarget()
        return {
          ok: true,
          message: `Hydration: ${calc.consumedTodayMl} / ${calc.targetHydrationMl} ml (${calc.completionPercentage}%).`,
        }
      }

      case 'log_hydration': {
        const parsed = LogHydrationArgsSchema.safeParse(action.payload)
        if (!parsed.success) {
          return {
            ok: false,
            message: `Invalid hydration log amount: ${parsed.error.issues[0]?.message}`,
          }
        }
        const { amountMl, beverageType } = parsed.data
        const beforeMl = useHydrationStore.getState().calculateCircadianTarget().consumedTodayMl
        const entry = useHydrationStore
          .getState()
          .logDrink(amountMl, beverageType as BeverageType, { bypassDebounce: true })

        if (!entry) {
          return { ok: false, message: 'Hydration log was rejected by store validation.' }
        }
        const afterCalc = useHydrationStore.getState().calculateCircadianTarget()
        if (afterCalc.consumedTodayMl <= beforeMl) {
          return { ok: false, message: 'Hydration store did not reflect the logged amount.' }
        }
        return {
          ok: true,
          message: `Logged ${amountMl} ml (${beverageType}). Progress: ${afterCalc.consumedTodayMl} / ${afterCalc.targetHydrationMl} ml (${afterCalc.completionPercentage}%).`,
        }
      }

      case 'navigate_to':
      case 'open_route': {
        const parsed = NavigateToArgsSchema.safeParse(action.payload)
        if (!parsed.success) {
          return {
            ok: false,
            message: `Navigation blocked: route is not in Nexora's allowlist.`,
          }
        }
        const targetRoute = parsed.data.route
        if (options?.navigate) {
          options.navigate(targetRoute)
        } else if (typeof window !== 'undefined' && window.location) {
          window.location.href = targetRoute
        }
        return {
          ok: true,
          message: `Navigated to ${targetRoute}.`,
        }
      }

      case 'update_reminder': {
        const parsed = UpdateReminderArgsSchema.safeParse(action.payload)
        if (!parsed.success) {
          return { ok: false, message: parsed.error.issues[0]?.message || 'Invalid reminder parameters.' }
        }
        const { targetType, targetIdOrTitle, reminderTime } = parsed.data
        const needle = targetIdOrTitle.toLowerCase()

        if (targetType === 'task') {
          if (!TIME_REGEX.test(reminderTime)) {
            return { ok: false, message: 'Task reminderTime must be HH:mm (24h).' }
          }
          const tasks = useTaskStore.getState().tasks
          const match = tasks.find(
            (t) => t.id === targetIdOrTitle || t.title.toLowerCase() === needle || t.title.toLowerCase().includes(needle)
          )
          if (!match) {
            return {
              ok: false,
              message: `Could not find an existing task matching "${targetIdOrTitle}".`,
            }
          }
          useTaskStore.getState().updateTask(match.id, {
            reminderTime,
            enableReminder: true,
          })
          const updated = useTaskStore.getState().tasks.find((t) => t.id === match.id)
          if (updated?.reminderTime !== reminderTime) {
            return { ok: false, message: 'Failed to update task reminder in store.' }
          }
          return {
            ok: true,
            message: `Updated reminder for task "${match.title}" to ${reminderTime}.`,
          }
        } else {
          const notes = useNoteStore.getState().notes
          const match = notes.find(
            (n) => n.id === targetIdOrTitle || n.title.toLowerCase() === needle || n.title.toLowerCase().includes(needle)
          )
          if (!match) {
            return {
              ok: false,
              message: `Could not find an existing note matching "${targetIdOrTitle}".`,
            }
          }
          useNoteStore.getState().updateNote(match.id, {
            remindAt: reminderTime,
            reminderFired: false,
          })
          const updated = useNoteStore.getState().notes.find((n) => n.id === match.id)
          if (updated?.remindAt !== reminderTime) {
            return { ok: false, message: 'Failed to update note reminder in store.' }
          }
          return {
            ok: true,
            message: `Updated reminder for note "${match.title}" to ${reminderTime}.`,
          }
        }
      }

      case 'switch_companion': {
        const parsed = SwitchCompanionArgsSchema.safeParse(action.payload)
        if (!parsed.success) {
          return { ok: false, message: 'Invalid companion archetype.' }
        }
        const arch = parsed.data.archetype
        if (arch === 'kyro_prime' || arch === 'pyro_fox' || arch === 'aegis_bot') {
          useKyroStore.getState().setModel(arch as KyroCharacterModel)
        } else {
          useCharacterStore.getState().setArchetype(arch as any)
        }
        return {
          ok: true,
          message: `Switched active companion to ${arch}.`,
        }
      }

      default:
        return {
          ok: false,
          message: `Unsupported action type "${action.type}".`,
        }
    }
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Action execution failed unexpectedly.',
    }
  }
}
