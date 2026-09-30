// @ts-nocheck
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useWorkspace } from '@/hooks/useWorkspace'
import { Project } from '@/store/useProjectStore'
import { toast } from 'sonner'

interface EditProjectDialogProps {
  project: Project | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onProjectUpdated?: (updated: Project) => void
}

function EditProjectForm({
  project,
  onOpenChange,
  onProjectUpdated,
}: {
  project: Project
  onOpenChange: (open: boolean) => void
  onProjectUpdated?: (updated: Project) => void
}) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(project.name || '')
  const [description, setDescription] = useState(project.description || '')
  const [color, setColor] = useState(project.color || '#3B82F6')
  const [status, setStatus] = useState<'active' | 'archived' | 'completed'>(project.status || 'active')
  const [dueDate, setDueDate] = useState(project.due_date ? project.due_date.split('T')[0] : '')

  const { editProject } = useWorkspace()

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Project name is required')
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

    try {
      await editProject(project.id, {
        name: name.trim(),
        description: description || null,
        color,
        status,
        due_date: dueDateIso,
      })

      if (onProjectUpdated) {
        onProjectUpdated({ ...project, name: name.trim(), description: description || null, color, status, due_date: dueDateIso })
      }
      
      toast.success('Project updated successfully')
      onOpenChange(false)
    } catch (error: unknown) {
      console.error(error)
      const msg = error instanceof Error ? error.message : 'Failed to update project'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="edit-proj-name" className="text-foreground font-semibold">Project Name</Label>
        <Input
          id="edit-proj-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Project name"
          className="h-11 bg-secondary/30 border-white/10 rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-proj-desc" className="text-foreground font-semibold">Description</Label>
        <Textarea
          id="edit-proj-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional details..."
          className="bg-secondary/30 border-white/10 rounded-xl min-h-[80px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-proj-status" className="text-foreground font-semibold">Status</Label>
          <Select value={status} onValueChange={(v) => v && setStatus(v as typeof status)}>
            <SelectTrigger id="edit-proj-status" className="h-11 bg-secondary/30 border-white/10 rounded-xl">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-proj-due" className="text-foreground font-semibold">Target Due Date</Label>
          <Input
            id="edit-proj-due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="h-11 bg-secondary/30 border-white/10 rounded-xl"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-proj-color" className="text-foreground font-semibold">Theme Color</Label>
        <div className="flex items-center gap-3">
          <Input
            id="edit-proj-color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-16 p-1 bg-secondary/30 border-white/10 rounded-xl cursor-pointer"
          />
          <span className="text-xs font-mono text-muted-foreground uppercase">{color}</span>
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
          disabled={loading}
          className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}

export function EditProjectDialog({
  project,
  open,
  onOpenChange,
  onProjectUpdated,
}: EditProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground text-xl font-bold">Edit Project</DialogTitle>
        </DialogHeader>
        {project && (
          <EditProjectForm
            key={project.id}
            project={project}
            onOpenChange={onOpenChange}
            onProjectUpdated={onProjectUpdated}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
