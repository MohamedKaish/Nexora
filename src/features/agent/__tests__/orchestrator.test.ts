import { describe, it, expect } from 'vitest'
import { DeterministicAgentModel, AgentContextSnapshot } from '../llm/AgentModelProvider'

describe('DeterministicAgentModel & Plan Synthesis', () => {
  const model = new DeterministicAgentModel()

  const defaultSnapshot: AgentContextSnapshot = {
    userQuery: '',
    activeTaskCount: 5,
    overdueTaskCount: 2,
    capacityDeficitMinutes: 45,
    isScheduleBankrupt: true,
    topPriorityTaskTitle: 'Fix Production Auth Bug',
    constraintsSummary: 'Working hours: 9:00 - 18:00'
  }

  it('should generate a multi-step plan for "Plan my day" requiring confirmation', async () => {
    const plan = await model.generateStructuredPlan('Plan my day', defaultSnapshot)

    expect(plan.intent).toBe('PLAN_DAY')
    expect(plan.requires_confirmation).toBe(true)
    expect(plan.risk_level).toBe('LEVEL_2_HIGH_IMPACT')
    expect(plan.tools.length).toBeGreaterThanOrEqual(2)
    expect(plan.tools[0].toolName).toBe('get_productivity_report')
    const scheduleTool = plan.tools.find(t => t.toolName === 'schedule_tasks')
    expect(scheduleTool).toBeDefined()
    expect(scheduleTool?.isMutation).toBe(true)
  })

  it('should generate a read-only plan for "What should I work on?" without confirmation requirement', async () => {
    const plan = await model.generateStructuredPlan('What should I work on?', defaultSnapshot)

    expect(plan.intent).toBe('FOCUS_NOW')
    expect(plan.requires_confirmation).toBe(false)
    expect(plan.risk_level).toBe('LEVEL_0_READ')
    expect(plan.tools.length).toBe(1)
    expect(plan.tools[0].toolName).toBe('get_productivity_report')
    expect(plan.tools[0].isMutation).toBe(false)
  })

  it('should extract duration for "I have two hours free. What should I work on?"', async () => {
    const plan = await model.generateStructuredPlan('I have two hours free. What should I work on?', defaultSnapshot)

    expect(plan.intent).toBe('FOCUS_NOW')
    expect(plan.reasoning_summary).toContain('120m window')
    expect(plan.requires_confirmation).toBe(false)
  })

  it('should generate plan for "Why is my schedule overloaded?" diagnosing capacity', async () => {
    const plan = await model.generateStructuredPlan('Why is my schedule overloaded?', defaultSnapshot)

    expect(plan.intent).toBe('EXPLAIN_OVERLOAD')
    expect(plan.requires_confirmation).toBe(false)
    expect(plan.risk_level).toBe('LEVEL_0_READ')
  })

  it('should generate plan for "What is overdue?" inspecting late tasks', async () => {
    const plan = await model.generateStructuredPlan('What is overdue?', defaultSnapshot)

    expect(plan.intent).toBe('SHOW_OVERDUE')
    expect(plan.requires_confirmation).toBe(false)
    expect(plan.tools[0].toolName).toBe('get_overdue_tasks')
  })

  it('should generate plan for "Create task Write documentation" with LEVEL_1_REVERSIBLE risk', async () => {
    const plan = await model.generateStructuredPlan('Create task Write documentation', defaultSnapshot)

    expect(plan.intent).toBe('CREATE_TASK')
    expect(plan.requires_confirmation).toBe(true)
    expect(plan.risk_level).toBe('LEVEL_1_REVERSIBLE')
    expect(plan.tools[0].toolName).toBe('create_task')
    expect(plan.tools[0].parameters.title).toBe('Write documentation')
  })
})
