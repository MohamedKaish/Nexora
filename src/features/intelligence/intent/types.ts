import { z } from 'zod'

export const IntentTypeSchema = z.enum([
  'PLAN_DAY',
  'FOCUS_NOW',
  'EXPLAIN_OVERLOAD',
  'SHOW_OVERDUE',
  'SCHEDULE_IMPORTANT',
  'MOVE_DEADLINE',
  'UNKNOWN'
])

export type IntentType = z.infer<typeof IntentTypeSchema>

export const IntentParametersSchema = z.object({
  freeMinutes: z.number().optional(),
  targetDate: z.string().optional(),
  entityType: z.enum(['task', 'project']).optional(),
  entityId: z.string().optional(),
  entityTitleQuery: z.string().optional(),
  newDueDate: z.string().optional()
})

export type IntentParameters = z.infer<typeof IntentParametersSchema>

export const ProposedActionSchema = z.object({
  actionType: z.enum(['read_advice', 'schedule_reflow', 'update_deadline', 'info']),
  description: z.string(),
  isMutation: z.boolean(),
  payload: z.record(z.string(), z.any()).optional()
})

export type ProposedAction = z.infer<typeof ProposedActionSchema>

export const ParsedIntentSchema = z.object({
  intent: IntentTypeSchema,
  rawQuery: z.string(),
  confidence: z.number().min(0).max(1),
  parameters: IntentParametersSchema,
  requiresConfirmation: z.boolean(),
  confirmationPrompt: z.string().nullable(),
  proposedAction: ProposedActionSchema
})

export type ParsedIntent = z.infer<typeof ParsedIntentSchema>

export interface IntentExecutionResult {
  success: boolean
  intent: IntentType
  message: string
  data?: unknown
  requiresUserConfirmation?: boolean
  pendingActionId?: string
}
