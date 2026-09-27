import { z } from 'zod'

export const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().max(2000).optional().nullable(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format').default('#3B82F6'),
  status: z.enum(['active', 'archived', 'completed']).default('active'),
  due_date: z.string().datetime().optional().nullable(),
})

export type ProjectInput = z.infer<typeof projectSchema>

export const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100).optional(),
  description: z.string().max(2000).optional().nullable(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format').optional(),
  status: z.enum(['active', 'archived', 'completed']).optional(),
  due_date: z.string().datetime().optional().nullable(),
})

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
