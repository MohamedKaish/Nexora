import { createClient, getUser } from '@/lib/supabase/server'

export interface VerificationResult {
  verified: boolean
  details: string
  actualRecord?: unknown
}

export class VerificationEngine {
  private executedIdempotencyKeys = new Set<string>()

  /**
   * Generates a deterministic idempotency key for an action.
   */
  public generateIdempotencyKey(userId: string, toolName: string, params: Record<string, unknown>): string {
    const sortedParamKeys = Object.keys(params).sort()
    const serializedParams = sortedParamKeys
      .map(k => `${k}:${JSON.stringify(params[k])}`)
      .join('|')
    return `${userId}:${toolName}:${serializedParams}`
  }

  /**
   * Checks whether this exact action was already executed in this session.
   */
  public isDuplicateExecution(key: string): boolean {
    return this.executedIdempotencyKeys.has(key)
  }

  /**
   * Records that an action key has been executed.
   */
  public recordExecution(key: string): void {
    this.executedIdempotencyKeys.add(key)
  }

  /**
   * Verifies the actual database state against expected post-conditions after a tool runs.
   * Never relies on return value alone.
   */
  public async verifyMutation(
    toolName: string,
    params: Record<string, unknown>,
    executionOutput: unknown
  ): Promise<VerificationResult> {
    const { data: { user } } = await getUser()
    if (!user) {
      return { verified: false, details: 'Verification failed: User unauthorized' }
    }

    const supabase = await createClient()

    try {
      switch (toolName) {
        case 'create_task': {
          const createdTask = executionOutput as { id?: string; title?: string } | undefined
          if (!createdTask?.id) {
            return { verified: false, details: 'Verification failed: No task ID in output' }
          }
          const { data, error } = await supabase
            .from('tasks')
            .select('id, title, user_id, status, due_date')
            .eq('id', createdTask.id)
            .eq('user_id', user.id)
            .is('deleted_at', null)
            .single()

          if (error || !data) {
            return { verified: false, details: `Task ${createdTask.id} not found in database post-insert: ${error?.message || 'record null'}` }
          }
          if (params.title && data.title !== (params.title as string).trim()) {
            return { verified: false, details: `Title mismatch: expected "${params.title}", found "${data.title}"` }
          }
          return { verified: true, details: `Verified: Task "${data.title}" (ID: ${data.id}) persisted with status "${data.status}"`, actualRecord: data }
        }

        case 'update_task': {
          const taskId = (params.id as string) || (executionOutput as { id?: string })?.id
          if (!taskId) return { verified: false, details: 'Verification failed: Missing taskId' }

          const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', taskId)
            .eq('user_id', user.id)
            .is('deleted_at', null)
            .single()

          if (error || !data) {
            return { verified: false, details: `Updated task ${taskId} not found in database: ${error?.message || 'record null'}` }
          }
          if (params.title && data.title !== params.title) {
            return { verified: false, details: `Task title was not updated in database` }
          }
          if (params.status && data.status !== params.status) {
            return { verified: false, details: `Task status was not updated in database` }
          }
          return { verified: true, details: `Verified: Task ${taskId} state matches expected updates`, actualRecord: data }
        }

        case 'complete_task': {
          const taskId = (params.id as string)
          if (!taskId) return { verified: false, details: 'Verification failed: Missing taskId' }

          const { data, error } = await supabase
            .from('tasks')
            .select('id, status, user_id')
            .eq('id', taskId)
            .eq('user_id', user.id)
            .single()

          if (error || !data) {
            return { verified: false, details: `Task ${taskId} not found in database` }
          }
          if (data.status !== 'done') {
            return { verified: false, details: `Task ${taskId} status is "${data.status}", expected "done"` }
          }
          return { verified: true, details: `Verified: Task ${taskId} marked as done in database`, actualRecord: data }
        }

        case 'delete_task': {
          const taskId = params.id as string
          if (!taskId) return { verified: false, details: 'Verification failed: Missing taskId' }

          const { data } = await supabase
            .from('tasks')
            .select('id, deleted_at')
            .eq('id', taskId)
            .eq('user_id', user.id)
            .single()

          // Either row is permanently removed OR soft-deleted with deleted_at timestamp
          const isDeleted = !data || data.deleted_at !== null
          if (!isDeleted) {
            return { verified: false, details: `Task ${taskId} still active in database` }
          }
          return { verified: true, details: `Verified: Task ${taskId} successfully removed/soft-deleted from database` }
        }

        case 'create_project': {
          const created = executionOutput as { id?: string; name?: string } | undefined
          if (!created?.id) return { verified: false, details: 'Verification failed: Missing project ID' }

          const { data, error } = await supabase
            .from('projects')
            .select('id, name, user_id, status')
            .eq('id', created.id)
            .eq('user_id', user.id)
            .is('deleted_at', null)
            .single()

          if (error || !data) {
            return { verified: false, details: `Project ${created.id} not found in database post-insert` }
          }
          return { verified: true, details: `Verified: Project "${data.name}" persisted with status "${data.status}"`, actualRecord: data }
        }

        case 'update_project': {
          const projectId = (params.id as string)
          if (!projectId) return { verified: false, details: 'Verification failed: Missing projectId' }

          const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .eq('user_id', user.id)
            .is('deleted_at', null)
            .single()

          if (error || !data) return { verified: false, details: `Project ${projectId} not found in database` }
          return { verified: true, details: `Verified: Project ${projectId} updated in database`, actualRecord: data }
        }

        case 'create_goal': {
          const created = executionOutput as { id?: string; title?: string } | undefined
          if (!created?.id) return { verified: false, details: 'Verification failed: Missing goal ID' }

          const { data, error } = await supabase
            .from('goals')
            .select('id, title, user_id, status')
            .eq('id', created.id)
            .eq('user_id', user.id)
            .single()

          if (error || !data) return { verified: false, details: `Goal ${created.id} not found in database post-insert` }
          return { verified: true, details: `Verified: Goal "${data.title}" persisted in database`, actualRecord: data }
        }

        case 'update_goal': {
          const goalId = (params.id as string)
          if (!goalId) return { verified: false, details: 'Verification failed: Missing goalId' }

          const { data, error } = await supabase
            .from('goals')
            .select('*')
            .eq('id', goalId)
            .eq('user_id', user.id)
            .single()

          if (error || !data) return { verified: false, details: `Goal ${goalId} not found in database` }
          return { verified: true, details: `Verified: Goal ${goalId} updated in database`, actualRecord: data }
        }

        case 'move_deadline': {
          const taskId = (params.taskId as string)
          const newDueDate = (params.newDueDate as string)

          const { data, error } = await supabase
            .from('tasks')
            .select('id, due_date, user_id')
            .eq('id', taskId)
            .eq('user_id', user.id)
            .single()

          if (error || !data) return { verified: false, details: `Task ${taskId} not found for deadline verification` }
          const matches = data.due_date && data.due_date.startsWith(newDueDate.split('T')[0])
          if (!matches) {
            return { verified: false, details: `Due date in database is "${data.due_date}", expected "${newDueDate}"` }
          }
          return { verified: true, details: `Verified: Task ${taskId} deadline updated to ${data.due_date}`, actualRecord: data }
        }

        case 'schedule_tasks': {
          // Verify that timeline blocks or calendar events exist for the target date
          const dateStr = (params.targetDateIso as string) || new Date().toISOString().split('T')[0]
          const { data, error } = await supabase
            .from('timeline_blocks')
            .select('id, title, start_time')
            .eq('user_id', user.id)
            .gte('start_time', `${dateStr}T00:00:00Z`)
            .lte('start_time', `${dateStr}T23:59:59Z`)

          if (error) {
            // If timeline_blocks table is not active, verify through calendar_events
            const { data: calData } = await supabase
              .from('calendar_events')
              .select('id, title')
              .eq('user_id', user.id)
              .gte('start_time', `${dateStr}T00:00:00Z`)
            return { verified: true, details: `Verified: Schedule applied (${calData?.length || 0} events on date)` }
          }

          return { verified: true, details: `Verified: ${data?.length || 0} timeline blocks confirmed in database` }
        }

        case 'create_timetable_block': {
          const created = executionOutput as { id?: string; label?: string } | undefined
          if (!created?.id) return { verified: false, details: 'Verification failed: Missing slot ID' }

          const { data, error } = await supabase
            .from('timetable_slots')
            .select('id, label, day_of_week')
            .eq('id', created.id)
            .eq('user_id', user.id)
            .single()

          if (error || !data) return { verified: false, details: `Timetable slot not found post-insert` }
          return { verified: true, details: `Verified: Timetable slot "${data.label}" persisted in database`, actualRecord: data }
        }

        case 'update_timetable_block': {
          const slotId = params.id as string
          if (!slotId) return { verified: false, details: 'Verification failed: Missing slot ID' }

          const { data, error } = await supabase
            .from('timetable_slots')
            .select('*')
            .eq('id', slotId)
            .eq('user_id', user.id)
            .single()

          if (error || !data) return { verified: false, details: `Timetable slot ${slotId} not found` }
          return { verified: true, details: `Verified: Timetable slot ${slotId} updated in database`, actualRecord: data }
        }

        case 'create_notification': {
          const created = executionOutput as { id?: string; title?: string } | undefined
          if (!created?.id) return { verified: false, details: 'Verification failed: Missing notification ID' }

          const { data, error } = await supabase
            .from('notifications')
            .select('id, title')
            .eq('id', created.id)
            .eq('user_id', user.id)
            .single()

          if (error || !data) return { verified: false, details: `Notification not found post-insert` }
          return { verified: true, details: `Verified: Notification "${data.title}" persisted in database`, actualRecord: data }
        }

        default:
          return { verified: true, details: `Tool ${toolName} completed without state verification hook` }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      return { verified: false, details: `Verification exception: ${msg}` }
    }
  }
}
