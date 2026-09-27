import { describe, it, expect } from 'vitest'
import { IntentParser } from '../intent/intentParser'

describe('Natural Language Intent Parser & Safety Boundaries', () => {
  const parser = new IntentParser()

  it('should parse "Plan my day" with mutation flag and confirmation requirement', () => {
    const result = parser.parse('Plan my day')
    expect(result.intent).toBe('PLAN_DAY')
    expect(result.requiresConfirmation).toBe(true)
    expect(result.proposedAction.isMutation).toBe(true)
    expect(result.confirmationPrompt).toContain('Would you like Kyro to compute and schedule today')
  })

  it('should parse "I have two hours free. What should I work on?" extracting duration and read-only mode', () => {
    const result = parser.parse('I have two hours free. What should I work on?')
    expect(result.intent).toBe('FOCUS_NOW')
    expect(result.requiresConfirmation).toBe(false)
    expect(result.proposedAction.isMutation).toBe(false)
    expect(result.parameters.freeMinutes).toBe(120)
  })

  it('should parse "Why is my schedule overloaded?" as EXPLAIN_OVERLOAD read-only analysis', () => {
    const result = parser.parse('Why is my schedule overloaded?')
    expect(result.intent).toBe('EXPLAIN_OVERLOAD')
    expect(result.requiresConfirmation).toBe(false)
    expect(result.proposedAction.isMutation).toBe(false)
  })

  it('should parse "What is overdue?" as SHOW_OVERDUE read-only inspection', () => {
    const result = parser.parse('What is overdue?')
    expect(result.intent).toBe('SHOW_OVERDUE')
    expect(result.requiresConfirmation).toBe(false)
    expect(result.proposedAction.isMutation).toBe(false)
  })

  it('should parse "Schedule my most important tasks" requiring confirmation before execution', () => {
    const result = parser.parse('Schedule my most important tasks')
    expect(result.intent).toBe('SCHEDULE_IMPORTANT')
    expect(result.requiresConfirmation).toBe(true)
    expect(result.proposedAction.isMutation).toBe(true)
  })

  it('should handle unrecognized queries safely as UNKNOWN without mutation', () => {
    const result = parser.parse('Hello tell me a joke')
    expect(result.intent).toBe('UNKNOWN')
    expect(result.requiresConfirmation).toBe(false)
    expect(result.proposedAction.isMutation).toBe(false)
  })
})
