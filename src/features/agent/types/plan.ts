import { z } from 'zod'

/**
 * 4-Tier Permission & Risk Model
 * - LEVEL_0_READ: Read-only inspection; auto-executable, no confirmation needed.
 * - LEVEL_1_REVERSIBLE: Single reversible mutations (e.g. create task, change priority).
 * - LEVEL_2_HIGH_IMPACT: Bulk mutations, deletes, major schedule replacement; always requires explicit user confirmation.
 * - LEVEL_3_EXTERNAL: External communications, external calendar sync, browser actions; always requires explicit user confirmation.
 */
export const RiskLevelSchema = z.enum([
  'LEVEL_0_READ',
  'LEVEL_1_REVERSIBLE',
  'LEVEL_2_HIGH_IMPACT',
  'LEVEL_3_EXTERNAL'
])

export type RiskLevel = z.infer<typeof RiskLevelSchema>

/**
 * Calibrated Confidence States (no arbitrary or fabricated percentages)
 */
export const ConfidenceStateSchema = z.enum([
  'Certain',
  'Likely',
  'Needs clarification',
  'Conflict detected',
  'Cannot complete'
])

export type ConfidenceState = z.infer<typeof ConfidenceStateSchema>

/**
 * High-level Conversational Response Mode
 */
export const ResponseModeSchema = z.enum([
  'informational',
  'needs_clarification',
  'proposed_plan',
  'confirmed_action',
  'completed_action',
  'failed_action'
])

export type ResponseMode = z.infer<typeof ResponseModeSchema>

export const ToolActionDefinitionSchema = z.object({
  id: z.string(),
  toolName: z.string(),
  parameters: z.record(z.string(), z.any()),
  riskLevel: RiskLevelSchema,
  description: z.string(),
  expectedOutcome: z.string(),
  isMutation: z.boolean()
})

export type ToolActionDefinition = z.infer<typeof ToolActionDefinitionSchema>

export const AgentPlanSchema = z.object({
  id: z.string(),
  intent: z.string(),
  rawQuery: z.string(),
  reasoning_summary: z.string(),
  decision_explanation: z.string().optional(),
  confidence_state: ConfidenceStateSchema.optional(),
  response_mode: ResponseModeSchema.optional(),
  clarification_question: z.string().optional(),
  requested_actions: z.array(z.string()),
  required_context: z.array(z.string()),
  risk_level: RiskLevelSchema,
  requires_confirmation: z.boolean(),
  confirmation_prompt: z.string().nullable(),
  tools: z.array(ToolActionDefinitionSchema),
  expected_results: z.array(z.string()),
  createdAt: z.string()
})

export type AgentPlan = z.infer<typeof AgentPlanSchema>

export const StepExecutionStatusSchema = z.enum([
  'pending',
  'running',
  'success',
  'failed',
  'skipped'
])

export type StepExecutionStatus = z.infer<typeof StepExecutionStatusSchema>

export const StepExecutionResultSchema = z.object({
  stepIndex: z.number(),
  actionId: z.string(),
  toolName: z.string(),
  status: StepExecutionStatusSchema,
  inputParams: z.record(z.string(), z.any()),
  outputData: z.any().optional(),
  verified: z.boolean(),
  verificationDetails: z.string().optional(),
  error: z.string().optional(),
  retryCount: z.number(),
  durationMs: z.number()
})

export type StepExecutionResult = z.infer<typeof StepExecutionResultSchema>

export const ConversationTurnSchema = z.object({
  role: z.enum(['user', 'agent']),
  content: z.string(),
  planId: z.string().optional(),
  timestamp: z.string().optional()
})

export type ConversationTurn = z.infer<typeof ConversationTurnSchema>

export const AgentExecutionReportSchema = z.object({
  planId: z.string(),
  overallStatus: z.enum(['success', 'partial', 'failed', 'blocked', 'needs_clarification']),
  completedSteps: z.number(),
  totalSteps: z.number(),
  stepResults: z.array(StepExecutionResultSchema),
  finalSummary: z.string(),
  decisionExplanation: z.string().optional(),
  confidenceState: ConfidenceStateSchema.optional(),
  responseMode: ResponseModeSchema.optional(),
  clarificationQuestion: z.string().optional(),
  requiresUserConfirmation: z.boolean(),
  pendingPlan: AgentPlanSchema.optional(),
  timestamp: z.string()
})

export type AgentExecutionReport = z.infer<typeof AgentExecutionReportSchema>
