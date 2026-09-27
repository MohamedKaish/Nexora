import { describe, it, expect } from 'vitest'
import { PermissionManager } from '../security/PermissionManager'
import { ToolActionDefinition } from '../types/plan'

describe('PermissionManager & 4-Tier Risk Model', () => {
  const manager = new PermissionManager()

  it('should classify read tools as LEVEL_0_READ without confirmation requirement', () => {
    const risk = manager.evaluateToolRisk('get_tasks')
    expect(risk).toBe('LEVEL_0_READ')
    expect(manager.requiresConfirmation(risk)).toBe(false)

    const riskReport = manager.evaluateToolRisk('get_productivity_report')
    expect(riskReport).toBe('LEVEL_0_READ')
    expect(manager.requiresConfirmation(riskReport)).toBe(false)
  })

  it('should classify single reversible mutations as LEVEL_1_REVERSIBLE requiring confirmation', () => {
    const risk = manager.evaluateToolRisk('create_task', { title: 'Test Task' })
    expect(risk).toBe('LEVEL_1_REVERSIBLE')
    expect(manager.requiresConfirmation(risk)).toBe(true)

    const riskGoal = manager.evaluateToolRisk('create_goal')
    expect(riskGoal).toBe('LEVEL_1_REVERSIBLE')
    expect(manager.requiresConfirmation(riskGoal)).toBe(true)
  })

  it('should classify deletions, schedule reflow, and bulk actions as LEVEL_2_HIGH_IMPACT', () => {
    const deleteRisk = manager.evaluateToolRisk('delete_task', { id: 't1' })
    expect(deleteRisk).toBe('LEVEL_2_HIGH_IMPACT')
    expect(manager.requiresConfirmation(deleteRisk)).toBe(true)

    const scheduleRisk = manager.evaluateToolRisk('schedule_tasks')
    expect(scheduleRisk).toBe('LEVEL_2_HIGH_IMPACT')
    expect(manager.requiresConfirmation(scheduleRisk)).toBe(true)

    const bulkRisk = manager.evaluateToolRisk('update_task', { isBulk: true })
    expect(bulkRisk).toBe('LEVEL_2_HIGH_IMPACT')
    expect(manager.requiresConfirmation(bulkRisk)).toBe(true)
  })

  it('should classify external actions as LEVEL_3_EXTERNAL', () => {
    const externalRisk = manager.evaluateToolRisk('external_calendar_sync')
    expect(externalRisk).toBe('LEVEL_3_EXTERNAL')
    expect(manager.requiresConfirmation(externalRisk)).toBe(true)
  })

  it('should aggregate plan risk to the highest risk action present in the sequence', () => {
    const mixedTools: ToolActionDefinition[] = [
      {
        id: '1',
        toolName: 'get_tasks',
        parameters: {},
        riskLevel: 'LEVEL_0_READ',
        description: 'Read tasks',
        expectedOutcome: 'Tasks array',
        isMutation: false
      },
      {
        id: '2',
        toolName: 'create_task',
        parameters: { title: 'New' },
        riskLevel: 'LEVEL_1_REVERSIBLE',
        description: 'Create task',
        expectedOutcome: 'Created task',
        isMutation: true
      },
      {
        id: '3',
        toolName: 'delete_task',
        parameters: { id: 'old' },
        riskLevel: 'LEVEL_2_HIGH_IMPACT',
        description: 'Delete task',
        expectedOutcome: 'Deleted task',
        isMutation: true
      }
    ]

    const planRisk = manager.calculatePlanRisk(mixedTools)
    expect(planRisk).toBe('LEVEL_2_HIGH_IMPACT')
    expect(manager.requiresConfirmation(planRisk)).toBe(true)
  })

  it('should generate truthful confirmation prompts for planned mutations', () => {
    const tools: ToolActionDefinition[] = [
      {
        id: '1',
        toolName: 'create_task',
        parameters: { title: 'Clean room' },
        riskLevel: 'LEVEL_1_REVERSIBLE',
        description: 'create task "Clean room"',
        expectedOutcome: 'Task persisted',
        isMutation: true
      }
    ]

    const prompt = manager.generateConfirmationPrompt(tools)
    expect(prompt).toContain('Please confirm: The agent wants to create task "Clean room"')
  })
})
