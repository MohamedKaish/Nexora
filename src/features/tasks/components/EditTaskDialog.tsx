'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { updateTask } from '../actions'
import { useTaskStore } from '@/store/useTaskStore'
import { Database } from '@/types/database.types'
import { toast } from 'sonner'

type Project = Database['public']['Tables']['projects']['Row']
type TaskWithSubtasks = Database['public']['Tables']['tasks']['Row'] & {
  subtasks?: Database['public']['Tables']['subtasks']['Row'][]
}

interface EditTaskDialogProps {
  task: TaskWithSubtasks | null
  projects?: Project[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskUpdated?: (updated: TaskWithSubtasks) => void
}

function EditTaskForm({
  task,
  projects = [],
  onOpenChange,
  onTaskUpdated,
}: {
  task: TaskWithSubtasks
  projects?: Project[]
  onOpenChange: (open: boolean) => void
  onTaskUpdated?: (updated: TaskWithSubtasks) => void
}) {
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState(task.title || '')
  const [description, setDescription] = useState(task.description || '')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>(task.priority || 'medium')
  const [status, setStatus] = useState<'todo' | 'in_progress' | 'done'>(task.status || 'todo')
  const [dueDate, setDueDate] = useState(task.due_date ? task.due_date.split('T')[0] : '')
  const [estimatedTime, setEstimatedTime] = useState<string>(task.estimated_time_minutes ? String(task.estimated_time_minutes) : '')
  const [projectId, setProjectId] = useState<string>(task.project_id || 'none')
  const [isScheduledForToday, setIsScheduledForToday] = useState(Boolean(task.is_schedule_for_today))
  const [isUrgent, setIsUrgent] = useState(Boolean(task.is_urgent))
  const [isImportant, setIsImportant] = useState(Boolean(task.is_important))

  const updateStoreTask = useTaskStore((state) => state.updateTask)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Task title is required')
      return
    }

    setLoading(true)
    let dueDateIso: string | null = null
    if (dueDate) {
      try {
        dueDateIso = new Date(`${dueDate}T00:00:00Z`).toISOString()
      } catch {
        dueDateIso = null
      }
    }

    const estMins = estimatedTime ? parseInt(estimatedTime, 10) : null

    try {
      const updated = await updateTask(task.id, {
        title: title.trim(),
        description: description || null,
        priority,
        status,
        project_id: projectId === 'none' ? null : projectId,
        due_date: dueDateIso,
        is_schedule_for_today: isScheduledForToday,
        is_urgent: isUrgent,
        is_important: isImportant,
        estimated_time_minutes: Number.isFinite(estMins) ? estMins : null,
      })

      updateStoreTask(task.id, updated)
      if (onTaskUpdated) {
        onTaskUpdated(updated as TaskWithSubtasks)
      }
      toast.success('Task updated successfully')
      onOpenChange(false)
    } catch (error: unknown) {
      console.error(error)
      const msg = error instanceof Error ? error.message : 'Failed to update task'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="edit-task-title" className="text-foreground font-semibold">Task Title</Label>
        <Input
          id="edit-task-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Task title"
          className="h-11 bg-secondary/30 border-white/10 rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-task-desc" className="text-foreground font-semibold">Description</Label>
        <Textarea
          id="edit-task-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional details..."
          className="bg-secondary/30 border-white/10 rounded-xl min-h-[80px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-task-priority" className="text-foreground font-semibold">Priority</Label>
          <Select value={priority} onValueChange={(v) => v && setPriority(v as typeof priority)}>
            <SelectTrigger id="edit-task-priority" className="h-11 bg-secondary/30 border-white/10 rounded-xl">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-task-status" className="text-foreground font-semibold">Status</Label>
          <Select value={status} onValueChange={(v) => v && setStatus(v as typeof status)}>
            <SelectTrigger id="edit-task-status" className="h-11 bg-secondary/30 border-white/10 rounded-xl">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-task-due" className="text-foreground font-semibold">Due Date</Label>
          <Input
            id="edit-task-due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="h-11 bg-secondary/30 border-white/10 rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-task-est" className="text-foreground font-semibold">Estimated Time (mins)</Label>
          <Input
            id="edit-task-est"
            type="number"
            min="1"
            value={estimatedTime}
            onChange={(e) => setEstimatedTime(e.target.value)}
            placeholder="e.g. 30"
            className="h-11 bg-secondary/30 border-white/10 rounded-xl"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-task-project" className="text-foreground font-semibold">Project</Label>
        <Select value={projectId} onValueChange={(v) => v && setProjectId(v)}>
          <SelectTrigger id="edit-task-project" className="h-11 bg-secondary/30 border-white/10 rounded-xl">
            <SelectValue placeholder="Select Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Inbox (No Project)</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col space-y-3 pt-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="edit_schedule_today"
            checked={isScheduledForToday}
            onCheckedChange={(checked) => setIsScheduledForToday(checked as boolean)}
          />
          <Label htmlFor="edit_schedule_today" className="font-normal cursor-pointer text-sm">
            Schedule for Today (Kyro Focus)
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="edit_is_urgent"
            checked={isUrgent}
            onCheckedChange={(checked) => setIsUrgent(checked as boolean)}
          />
          <Label htmlFor="edit_is_urgent" className="font-normal cursor-pointer text-orange-500 text-sm">
            Urgent (Deadline approaching)
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="edit_is_important"
            checked={isImportant}
            onCheckedChange={(checked) => setIsImportant(checked as boolean)}
          />
          <Label htmlFor="edit_is_important" className="font-normal cursor-pointer text-blue-500 text-sm">
            Important (High impact)
          </Label>
        </div>
      </div>

      <div className="pt-4 flex justify-end space-x-2">
        <Button
          variant="outline"
          type="button"
          onClick={() => onOpenChange(false)}
          className="rounded-xl border-white/10"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || !title.trim()}
          className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}

export function EditTaskDialog({
  task,
  projects = [],
  open,
  onOpenChange,
  onTaskUpdated,
}: EditTaskDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground text-xl font-bold">Edit Task</DialogTitle>
        </DialogHeader>
        {task && (
          <EditTaskForm
            key={task.id}
            task={task}
            projects={projects}
            onOpenChange={onOpenChange}
            onTaskUpdated={onTaskUpdated}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
