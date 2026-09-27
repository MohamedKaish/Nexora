export type AgentEventType =
  | 'REQUEST_RECEIVED'
  | 'INTENT_CLASSIFIED'
  | 'PLAN_GENERATED'
  | 'CONFIRMATION_REQUESTED'
  | 'TOOL_STARTED'
  | 'TOOL_COMPLETED'
  | 'VERIFICATION_RESULT'
  | 'RETRY_ATTEMPT'
  | 'FAILURE'
  | 'REPORT_FINALIZED'

export interface AgentLogEvent {
  timestamp: string
  eventType: AgentEventType
  planId?: string
  toolName?: string
  details: Record<string, unknown>
}

export class AgentLogger {
  private static logs: AgentLogEvent[] = []

  private static scrubSensitiveData(obj: unknown): unknown {
    if (!obj || typeof obj !== 'object') return obj

    if (Array.isArray(obj)) {
      return obj.map(item => this.scrubSensitiveData(item))
    }

    const scrubbed: Record<string, unknown> = {}
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'authorization', 'cookie']

    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase()
      if (sensitiveKeys.some(s => lowerKey.includes(s))) {
        scrubbed[key] = '[REDACTED]'
      } else if (typeof value === 'object' && value !== null) {
        scrubbed[key] = this.scrubSensitiveData(value)
      } else {
        scrubbed[key] = value
      }
    }
    return scrubbed
  }

  public static log(eventType: AgentEventType, details: Record<string, unknown>, context?: { planId?: string; toolName?: string }): void {
    const event: AgentLogEvent = {
      timestamp: new Date().toISOString(),
      eventType,
      planId: context?.planId,
      toolName: context?.toolName,
      details: (this.scrubSensitiveData(details) as Record<string, unknown>) || {}
    }

    AgentLogger.logs.push(event)

    // Keep memory bounded to latest 1000 events
    if (AgentLogger.logs.length > 1000) {
      AgentLogger.logs.shift()
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[NexoraAgent] [${event.eventType}]`, event.toolName ? `(${event.toolName})` : '', event.details)
    }
  }

  public static getLogsForPlan(planId: string): AgentLogEvent[] {
    return AgentLogger.logs.filter(l => l.planId === planId)
  }

  public static getRecentLogs(limit = 50): AgentLogEvent[] {
    return AgentLogger.logs.slice(-limit)
  }

  public static clear(): void {
    AgentLogger.logs = []
  }
}
