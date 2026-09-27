'use server'

import { AgentOrchestrator } from './core/AgentOrchestrator'
import { AgentPlan, AgentExecutionReport, ConversationTurn } from './types/plan'
import { AgentMemoryManager, UserPlanningMemory } from './memory/AgentMemory'
import { AgentLogger, AgentLogEvent } from './observability/AgentLogger'
import { revalidatePath } from 'next/cache'

const orchestrator = new AgentOrchestrator()
const memoryManager = new AgentMemoryManager()

/**
 * Server action to process an incoming user natural language request with session history.
 */
export async function submitAgentQuery(
  query: string,
  history?: ConversationTurn[]
): Promise<AgentExecutionReport> {
  const report = await orchestrator.handleUserQuery(query, history)
  if (!report.requiresUserConfirmation) {
    revalidatePath('/', 'layout')
  }
  return report
}

/**
 * Server action to execute a confirmed agent plan.
 * Strict safety boundary: ONLY invoked after explicit user approval.
 */
export async function confirmAndExecuteAgentPlan(plan: AgentPlan): Promise<AgentExecutionReport> {
  const report = await orchestrator.executePlan(plan)
  revalidatePath('/', 'layout')
  return report
}

/**
 * Server action to inspect recent agent observability audit logs.
 */
export async function getAgentRecentLogs(): Promise<AgentLogEvent[]> {
  return AgentLogger.getRecentLogs(30)
}

/**
 * Server action to retrieve user planning memory constraints.
 */
export async function getAgentMemoryPreferences(): Promise<UserPlanningMemory> {
  return memoryManager.getMemory()
}
