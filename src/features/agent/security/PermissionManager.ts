import { RiskLevel, ToolActionDefinition } from '../types/plan'

export class PermissionManager {
  private static readonly RISK_HIERARCHY: Record<RiskLevel, number> = {
    LEVEL_0_READ: 0,
    LEVEL_1_REVERSIBLE: 1,
    LEVEL_2_HIGH_IMPACT: 2,
    LEVEL_3_EXTERNAL: 3
  }

  /**
   * Evaluates the risk level for an individual tool based on its name and arguments.
   */
  public evaluateToolRisk(toolName: string, parameters: Record<string, unknown> = {}): RiskLevel {
    // 1. External actions
    if (
      toolName.startsWith('external_') ||
      toolName.includes('calendar_remote') ||
      toolName.includes('browser_')
    ) {
      return 'LEVEL_3_EXTERNAL'
    }

    // 2. High-impact operations: Deletions, bulk rescheduling, multiple modifications
    if (
      toolName === 'schedule_tasks' ||
      toolName === 'delete_task' ||
      toolName === 'delete_project' ||
      toolName === 'delete_goal' ||
      toolName === 'move_deadline' ||
      Boolean(parameters.isBulk) ||
      (Array.isArray(parameters.taskIds) && parameters.taskIds.length > 1) ||
      (Array.isArray(parameters.blocks) && parameters.blocks.length > 1)
    ) {
      return 'LEVEL_2_HIGH_IMPACT'
    }

    // 3. Read tools
    if (
      toolName.startsWith('get_') ||
      toolName.startsWith('list_') ||
      toolName.startsWith('inspect_') ||
      toolName.startsWith('explain_')
    ) {
      return 'LEVEL_0_READ'
    }

    // 4. Default mutations (create, update single records)
    return 'LEVEL_1_REVERSIBLE'
  }

  /**
   * Computes the aggregated risk level across all proposed actions.
   * Plan risk is determined by the highest risk tool action in the sequence.
   */
  public calculatePlanRisk(tools: ToolActionDefinition[]): RiskLevel {
    if (tools.length === 0) return 'LEVEL_0_READ'

    let highestRisk: RiskLevel = 'LEVEL_0_READ'
    for (const tool of tools) {
      if (
        PermissionManager.RISK_HIERARCHY[tool.riskLevel] >
        PermissionManager.RISK_HIERARCHY[highestRisk]
      ) {
        highestRisk = tool.riskLevel
      }
    }
    return highestRisk
  }

  /**
   * Determines whether user confirmation is strictly mandatory.
   * - Level 0: Never requires confirmation.
   * - Level 1: Requires confirmation unless explicitly pre-approved by user policy.
   * - Level 2 & Level 3: MUST always require explicit confirmation.
   */
  public requiresConfirmation(riskLevel: RiskLevel): boolean {
    switch (riskLevel) {
      case 'LEVEL_0_READ':
        return false
      case 'LEVEL_1_REVERSIBLE':
      case 'LEVEL_2_HIGH_IMPACT':
      case 'LEVEL_3_EXTERNAL':
        return true
      default:
        return true
    }
  }

  /**
   * Generates a descriptive, truthful confirmation prompt detailing
   * what the agent is requesting permission to mutate.
   */
  public generateConfirmationPrompt(tools: ToolActionDefinition[]): string {
    const mutations = tools.filter(t => t.isMutation)
    if (mutations.length === 0) return ''

    if (mutations.length === 1) {
      const tool = mutations[0]
      return `Please confirm: The agent wants to ${tool.description}.`
    }

    const descriptions = mutations.map((m, i) => `${i + 1}. ${m.description}`).join('; ')
    return `Please confirm the following ${mutations.length} actions: ${descriptions}`
  }
}
