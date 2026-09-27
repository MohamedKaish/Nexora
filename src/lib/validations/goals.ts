import { z } from 'zod'

export const goalSchema = z.object({
  title: z.string().min(1, 'Goal title is required').max(200),
  type: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  status: z.enum(['active', 'completed', 'failed']).default('active'),
  period_start: z.string(),
  period_end: z.string(),
})

export type GoalInput = z.infer<typeof goalSchema>
