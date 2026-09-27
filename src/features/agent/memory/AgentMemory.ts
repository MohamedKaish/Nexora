import { z } from 'zod'
import { createClient, getUser } from '../../../lib/supabase/server'

export const UserPlanningMemorySchema = z.object({
  workDayStartHour: z.number().min(0).max(23).default(9),
  workDayEndHour: z.number().min(1).max(24).default(18),
  maxFocusBlockMinutes: z.number().min(15).max(240).default(60),
  preferredBreakMinutes: z.number().min(5).max(60).default(15),
  strictMode: z.boolean().default(false),
  aiInsightsEnabled: z.boolean().default(true),
  timezone: z.string().default('UTC'),
  preferredFocusPeriod: z.enum(['morning', 'afternoon', 'evening']).default('morning'),
  planningPersona: z.enum(['balanced', 'deep_work', 'fast_paced']).default('balanced')
})

export type UserPlanningMemory = z.infer<typeof UserPlanningMemorySchema>

export class AgentMemoryManager {
  /**
   * Retrieves user planning memory, combining database user_preferences
   * with privacy-conscious default planning constraints.
   */
  public async getMemory(): Promise<UserPlanningMemory> {
    const supabase = await createClient()
    const { data: { user } } = await getUser()

    if (!user) {
      return UserPlanningMemorySchema.parse({})
    }

    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('strict_mode, ai_insights, timezone')
      .eq('id', user.id)
      .single()

    return UserPlanningMemorySchema.parse({
      strictMode: prefs?.strict_mode ?? false,
      aiInsightsEnabled: prefs?.ai_insights ?? true,
      timezone: prefs?.timezone ?? 'UTC',
      workDayStartHour: 9,
      workDayEndHour: 18,
      maxFocusBlockMinutes: 60,
      preferredBreakMinutes: 15,
      preferredFocusPeriod: 'morning',
      planningPersona: 'balanced'
    })
  }

  /**
   * Resolves effective planning constraints, guaranteeing that explicit user
   * instructions strictly override stored memory preferences.
   */
  public resolveEffectiveConstraints(
    memory: UserPlanningMemory,
    overrides?: Partial<UserPlanningMemory>
  ): UserPlanningMemory {
    if (!overrides) return memory
    return UserPlanningMemorySchema.parse({
      ...memory,
      ...overrides
    })
  }

  /**
   * Returns a sanitized, minimal summary of user constraints
   * safe to include in agent planning context.
   */
  public getPlanningConstraintsSummary(memory: UserPlanningMemory): string {
    return [
      `Working hours: ${memory.workDayStartHour}:00 - ${memory.workDayEndHour}:00`,
      `Focus block limit: ${memory.maxFocusBlockMinutes}m`,
      `Break buffer: ${memory.preferredBreakMinutes}m`,
      `Preferred focus period: ${memory.preferredFocusPeriod}`,
      `Planning style: ${memory.planningPersona}`,
      `Strict schedule enforcement: ${memory.strictMode ? 'Enabled' : 'Disabled'}`
    ].join('; ')
  }
}
