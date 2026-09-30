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
import { Plus } from 'lucide-react'

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [color, setColor] = useState('#3B82F6')
  const { createProject } = useWorkspace()

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)

    const name = (formData.get('name') as string)?.trim()
    if (!name) {
      toast.error('Project name is required')
      setLoading(false)
      return
    }

    const dueDateRaw = formData.get('due_date') as string
    let dueDateIso: string | null = null
    if (dueDateRaw) {
      try {
        dueDateIso = new Date(`${dueDateRaw}T00:00:00Z`).toISOString()
      } catch {
        dueDateIso = null
      }
    }

    try {
      await createProject({
        name,
        description: (formData.get('description') as string) || null,
        color: color || '#3B82F6',
        status: (formData.get('status') as 'active' | 'archived' | 'completed') || 'active',
        due_date: dueDateIso,
      })

      toast.success('Project created successfully')
      setOpen(false)
    } catch (error: unknown) {
      console.error(error)
      const msg = error instanceof Error ? error.message : 'Failed to create project'
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
        <Plus className="mr-2 h-4 w-4" /> New Project
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[480px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground text-xl font-bold">Create Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="proj-name" className="text-foreground font-semibold">Project Name</Label>
              <Input
                id="proj-name"
                name="name"
                required
                placeholder="e.g. Launch Nexora MVP"
                className="h-11 bg-secondary/30 border-white/10 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proj-desc" className="text-foreground font-semibold">Description</Label>
              <Textarea
                id="proj-desc"
                name="description"
                placeholder="Optional details..."
                className="bg-secondary/30 border-white/10 rounded-xl min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="proj-status" className="text-foreground font-semibold">Status</Label>
                <Select name="status" defaultValue="active">
                  <SelectTrigger id="proj-status" className="h-11 bg-secondary/30 border-white/10 rounded-xl">
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
                <Label htmlFor="proj-due" className="text-foreground font-semibold">Target Due Date</Label>
                <Input
                  id="proj-due"
                  name="due_date"
                  type="date"
                  className="h-11 bg-secondary/30 border-white/10 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proj-color" className="text-foreground font-semibold">Theme Color</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="proj-color"
                  name="color"
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
                onClick={() => setOpen(false)}
                className="rounded-xl border-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              >
                {loading ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
