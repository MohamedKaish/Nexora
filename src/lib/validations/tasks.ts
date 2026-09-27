import { z } from 'zod'

export const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200),
  description: z.string().max(2000).optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['todo', 'in_progress', 'done']).default('todo'),
  due_date: z.string().datetime().optional().nullable(),
  is_schedule_for_today: z.boolean().default(false),
  is_urgent: z.boolean().default(false),
  is_important: z.boolean().default(false),
  estimated_time_minutes: z.number().optional().nullable(),
  recurrence_rule: z.string().optional().nullable(),
})

export type TaskInput = z.infer<typeof taskSchema>

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  due_date: z.string().datetime().optional().nullable(),
  is_schedule_for_today: z.boolean().optional(),
  is_urgent: z.boolean().optional(),
  is_important: z.boolean().optional(),
  estimated_time_minutes: z.number().optional().nullable(),
  recurrence_rule: z.string().optional().nullable(),
})

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>

export const subtaskSchema = z.object({
  task_id: z.string().uuid(),
  title: z.string().min(1, 'Subtask title is required').max(200),
  is_completed: z.boolean().default(false),
})

export type SubtaskInput = z.infer<typeof subtaskSchema>
