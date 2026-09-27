'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { createTask } from '../actions'
import { useTaskStore } from '@/store/useTaskStore'
import { Database } from '@/types/database.types'
import { toast } from 'sonner'

type Project = Database['public']['Tables']['projects']['Row']

export function CreateTaskDialog({ projects = [] }: { projects?: Project[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isScheduledForToday, setIsScheduledForToday] = useState(false)
  const [isUrgent, setIsUrgent] = useState(false)
  const [isImportant, setIsImportant] = useState(false)
  const addTask = useTaskStore((state) => state.addTask)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)

    const title = (formData.get('title') as string)?.trim()
    if (!title) {
      toast.error('Task title is required')
      setLoading(false)
      return
    }

    const projectId = formData.get('project_id') as string
    const dueDateRaw = formData.get('due_date') as string
    let dueDateIso: string | null = null
    if (dueDateRaw) {
      try {
        dueDateIso = new Date(`${dueDateRaw}T00:00:00Z`).toISOString()
      } catch {
        dueDateIso = null
      }
    }

    const estTimeRaw = formData.get('estimated_time') as string
    const estTime = estTimeRaw ? parseInt(estTimeRaw, 10) : null

    try {
      const result = await createTask({
        title,
        description: (formData.get('description') as string) || null,
        priority: (formData.get('priority') as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
        status: 'todo',
        project_id: projectId === 'none' ? null : projectId,
        due_date: dueDateIso,
        is_schedule_for_today: isScheduledForToday,
        is_urgent: isUrgent,
        is_important: isImportant,
        estimated_time_minutes: Number.isFinite(estTime) ? estTime : null,
      })

      addTask(result)
      toast.success('Task created successfully')
      setOpen(false)
      setIsScheduledForToday(false)
      setIsUrgent(false)
      setIsImportant(false)
    } catch (error: unknown) {
      console.error(error)
      const msg = error instanceof Error ? error.message : 'Failed to create task'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] transition-all smooth-ring h-10 px-5 rounded-[12px] font-semibold text-[14px]"
      >
        Add Task
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground text-xl font-bold">New Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-foreground font-semibold">Task Title</Label>
              <Input id="title" name="title" required placeholder="What needs to be done?" className="h-11 bg-secondary/30 border-white/10 rounded-xl" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground font-semibold">Description</Label>
              <Textarea id="description" name="description" placeholder="Optional details..." className="bg-secondary/30 border-white/10 rounded-xl min-h-[80px]" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimated_time" className="text-foreground font-semibold">Estimated Time (mins)</Label>
                <Input id="estimated_time" name="estimated_time" type="number" min="1" placeholder="e.g. 30" className="h-11 bg-secondary/30 border-white/10 rounded-xl" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date" className="text-foreground font-semibold">Due Date</Label>
                <Input id="due_date" name="due_date" type="date" className="h-11 bg-secondary/30 border-white/10 rounded-xl" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority" className="text-foreground font-semibold">Priority</Label>
                <Select name="priority" defaultValue="medium">
                  <SelectTrigger className="h-11 bg-secondary/30 border-white/10 rounded-xl">
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
                <Label htmlFor="project_id" className="text-foreground font-semibold">Project</Label>
                <Select name="project_id" defaultValue="none">
                  <SelectTrigger className="h-11 bg-secondary/30 border-white/10 rounded-xl">
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
            </div>

            <div className="flex flex-col space-y-3 pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="schedule_today"
                  checked={isScheduledForToday}
                  onCheckedChange={(checked) => setIsScheduledForToday(checked as boolean)}
                />
                <Label htmlFor="schedule_today" className="font-normal cursor-pointer text-sm">
                  Schedule for Today (Kyro Focus)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_urgent"
                  checked={isUrgent}
                  onCheckedChange={(checked) => setIsUrgent(checked as boolean)}
                />
                <Label htmlFor="is_urgent" className="font-normal cursor-pointer text-orange-500 text-sm">
                  Urgent (Deadline approaching)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_important"
                  checked={isImportant}
                  onCheckedChange={(checked) => setIsImportant(checked as boolean)}
                />
                <Label htmlFor="is_important" className="font-normal cursor-pointer text-blue-500 text-sm">
                  Important (High impact)
                </Label>
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-2">
              <Button variant="outline" type="button" onClick={() => setOpen(false)} className="rounded-xl border-white/10">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
                {loading ? 'Adding...' : 'Add Task'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
