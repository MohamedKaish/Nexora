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

type Project = Database['public']['Tables']['projects']['Row']

export function CreateTaskDialog({ projects = [] }: { projects?: Project[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isScheduledForToday, setIsScheduledForToday] = useState(false)
  const [isUrgent, setIsUrgent] = useState(false)
  const [isImportant, setIsImportant] = useState(false)
  const addTask = useTaskStore(state => state.addTask)
  
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    
    const projectId = formData.get('project_id') as string
    
    try {
      const result = await createTask({
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        priority: (formData.get('priority') as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
        status: 'todo',
        project_id: projectId === 'none' ? null : projectId,
        is_schedule_for_today: isScheduledForToday,
        is_urgent: isUrgent,
        is_important: isImportant,
        estimated_time_minutes: formData.get('estimated_time') ? parseInt(formData.get('estimated_time') as string) : null,
      })
      
      addTask(result)
      setOpen(false)
      setIsScheduledForToday(false)
      setIsUrgent(false)
      setIsImportant(false)
    } catch (error) {
      console.error(error)
      alert('Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Add Task</Button>
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input id="title" name="title" required placeholder="What needs to be done?" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" placeholder="Optional details..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimated_time">Estimated Time (mins)</Label>
              <Input id="estimated_time" name="estimated_time" type="number" placeholder="e.g. 30" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select name="priority" defaultValue="medium">
                <SelectTrigger>
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
              <Label htmlFor="project_id">Project</Label>
              <Select name="project_id" defaultValue="none">
                <SelectTrigger>
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Inbox (No Project)</SelectItem>
                  {projects.map(p => (
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
              <Label htmlFor="schedule_today" className="font-normal cursor-pointer">
                Schedule for Today (Kyro Focus)
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="is_urgent" 
                checked={isUrgent} 
                onCheckedChange={(checked) => setIsUrgent(checked as boolean)} 
              />
              <Label htmlFor="is_urgent" className="font-normal cursor-pointer text-orange-500">
                Urgent (Deadline approaching)
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="is_important" 
                checked={isImportant} 
                onCheckedChange={(checked) => setIsImportant(checked as boolean)} 
              />
              <Label htmlFor="is_important" className="font-normal cursor-pointer text-blue-500">
                Important (High impact)
              </Label>
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  )
}
