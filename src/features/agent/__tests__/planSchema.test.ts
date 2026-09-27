import { describe, it, expect } from 'vitest'
import {
  AgentPlanSchema,
  RiskLevelSchema,
  ToolActionDefinitionSchema,
  AgentExecutionReportSchema
} from '../types/plan'

describe('Structured Agent Plan & Schema Validation', () => {
  it('should validate RiskLevelSchema tiers', () => {
    expect(RiskLevelSchema.safeParse('LEVEL_0_READ').success).toBe(true)
    expect(RiskLevelSchema.safeParse('LEVEL_1_REVERSIBLE').success).toBe(true)
    expect(RiskLevelSchema.safeParse('LEVEL_2_HIGH_IMPACT').success).toBe(true)
    expect(RiskLevelSchema.safeParse('LEVEL_3_EXTERNAL').success).toBe(true)
    expect(RiskLevelSchema.safeParse('INVALID').success).toBe(false)
  })

  it('should validate a correctly formed AgentPlan', () => {
    const validPlan = {
      id: 'plan_123',
      intent: 'PLAN_DAY',
      rawQuery: 'Plan my day',
      reasoning_summary: 'Optimizing schedule based on priorities.',
      requested_actions: ['Calculate Kyro schedule reflow', 'Save timeline blocks'],
      required_context: ['tasks', 'timetable'],
      risk_level: 'LEVEL_2_HIGH_IMPACT',
      requires_confirmation: true,
      confirmation_prompt: 'Confirm applying calculated schedule blocks to your timeline.',
      tools: [
        {
          id: 'act_1',
          toolName: 'get_productivity_report',
          parameters: {},
          riskLevel: 'LEVEL_0_READ',
          description: 'Analyze capacity and active task priorities',
          expectedOutcome: 'Deterministic productivity report',
          isMutation: false
        },
        {
          id: 'act_2',
          toolName: 'schedule_tasks',
          parameters: { isBulk: true },
          riskLevel: 'LEVEL_2_HIGH_IMPACT',
          description: 'Apply calculated schedule blocks to your timeline',
          expectedOutcome: 'Timeline populated with scheduled task blocks',
          isMutation: true
        }
      ],
      expected_results: ['Updated timeline reflecting prioritized task blocks'],
      createdAt: new Date().toISOString()
    }

    const parsed = AgentPlanSchema.parse(validPlan)
    expect(parsed.id).toBe('plan_123')
    expect(parsed.tools).toHaveLength(2)
    expect(parsed.risk_level).toBe('LEVEL_2_HIGH_IMPACT')
  })

  it('should reject a plan with an invalid risk level', () => {
    const invalidPlan = {
      id: 'plan_bad',
      intent: 'UNKNOWN',
      rawQuery: 'test',
      reasoning_summary: 'test',
      requested_actions: [],
      required_context: [],
      risk_level: 'LEVEL_99_ULTRA_RISK', // Invalid!
      requires_confirmation: false,
      confirmation_prompt: null,
      tools: [],
      expected_results: [],
      createdAt: new Date().toISOString()
    }

    expect(() => AgentPlanSchema.parse(invalidPlan)).toThrow()
  })

  it('should reject a tool action missing required properties', () => {
    const brokenTool = {
      id: 'act_broken',
      toolName: 'create_task'
      // missing parameters, riskLevel, description, expectedOutcome, isMutation
    }

    expect(() => ToolActionDefinitionSchema.parse(brokenTool)).toThrow()
  })

  it('should validate complete AgentExecutionReport schema', () => {
    const report = {
      planId: 'plan_123',
      overallStatus: 'success',
      completedSteps: 1,
      totalSteps: 1,
      stepResults: [
        {
          stepIndex: 1,
          actionId: 'act_1',
          toolName: 'get_tasks',
          status: 'success',
          inputParams: {},
          outputData: [{ id: 't1', title: 'Task 1' }],
          verified: true,
          verificationDetails: 'Read-only inspection complete',
          retryCount: 0,
          durationMs: 45
        }
      ],
      finalSummary: 'Plan completed successfully.',
      requiresUserConfirmation: false,
      timestamp: new Date().toISOString()
    }

    const parsed = AgentExecutionReportSchema.parse(report)
    expect(parsed.overallStatus).toBe('success')
    expect(parsed.stepResults[0].verified).toBe(true)
  })
})
