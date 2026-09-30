'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, FolderKanban, Archive, CheckCircle2, Trash2, Edit2 } from 'lucide-react'
import { useProjectStore } from '@/store/useProjectStore'
import { useTaskStore } from '@/store/useTaskStore'
import type { ProjectStatus } from '@/types/local'

const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#14B8A6']

export default function ProjectsPage() {
  const { projects, addProject, updateProject, removeProject } = useProjectStore()
  const { tasks } = useTaskStore()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newColor, setNewColor] = useState('#6366F1')
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')

  const activeProjects = projects.filter(p => p.status === 'active' && !p.deletedAt)
  const archivedProjects = projects.filter(p => p.status !== 'active' || p.deletedAt)

  const handleCreate = () => {
    if (!newName.trim()) return
    addProject({ name: newName.trim(), description: newDescription.trim() || null, color: newColor })
    setNewName(''); setNewDescription(''); setNewColor('#6366F1')
    setIsCreateOpen(false)
  }

  const startEdit = (id: string) => {
    const p = projects.find(x => x.id === id)
    if (!p) return
    setEditName(p.name); setEditDescription(p.description || '')
    setEditingId(id)
  }

  const handleUpdate = () => {
    if (!editingId || !editName.trim()) return
    updateProject(editingId, { name: editName.trim(), description: editDescription.trim() || null })
    setEditingId(null)
  }

  const getProjectTaskCount = (projectId: string) => {
    return tasks.filter(t => {
      const pid = t.projectId || (t as unknown as Record<string, unknown>).project_id as string
      return pid === projectId && !t.deletedAt
    }).length
  }

  const getProjectCompletedCount = (projectId: string) => {
    return tasks.filter(t => {
      const pid = t.projectId || (t as unknown as Record<string, unknown>).project_id as string
      return pid === projectId && t.status === 'done' && !t.deletedAt
    }).length
  }

  return (
    <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground font-medium mt-1">{activeProjects.length} active projects</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger render={<Button className="rounded-xl bg-accent text-white hover:bg-accent/90 font-medium gap-1.5 cursor-pointer" />}>
            <Plus className="w-4 h-4" /> New Project
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Create Project</DialogTitle>
              <DialogDescription>Add a new project to organize your tasks.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <Input placeholder="Project name" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} autoFocus className="rounded-xl" />
              <Input placeholder="Description (optional)" value={newDescription} onChange={e => setNewDescription(e.target.value)} className="rounded-xl" />
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Color</p>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setNewColor(c)} className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${newColor === c ? 'border-accent scale-110' : 'border-border/40 hover:scale-105'}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} className="rounded-xl bg-accent text-white hover:bg-accent/90 cursor-pointer">Create Project</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {activeProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderKanban className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold">No projects yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create your first project to get organized.</p>
          <Button onClick={() => setIsCreateOpen(true)} variant="outline" className="rounded-xl cursor-pointer">
            <Plus className="w-4 h-4 mr-1.5" /> Create Project
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeProjects.map(project => {
            const totalTasks = getProjectTaskCount(project.id)
            const completedTasks = getProjectCompletedCount(project.id)
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

            return (
              <Card key={project.id} className="border-border/40 bg-card/60 rounded-2xl hover:border-border/60 transition-all group cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${project.color}15` }}>
                        <FolderKanban className="w-5 h-5" style={{ color: project.color }} />
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold">{project.name}</CardTitle>
                        {project.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{project.description}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(project.id)} className="p-1.5 rounded-lg hover:bg-secondary/40 cursor-pointer" aria-label="Edit">
                        <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button onClick={() => updateProject(project.id, { status: 'archived' as ProjectStatus })} className="p-1.5 rounded-lg hover:bg-secondary/40 cursor-pointer" aria-label="Archive">
                        <Archive className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button onClick={() => removeProject(project.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 cursor-pointer" aria-label="Delete">
                        <Trash2 className="w-3.5 h-3.5 text-destructive/70" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-muted-foreground">{completedTasks}/{totalTasks} tasks</span>
                    <span className="font-semibold" style={{ color: project.color }}>{progress}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-secondary/40 mt-2 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: project.color }} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle className="font-serif text-xl">Edit Project</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <Input value={editName} onChange={e => setEditName(e.target.value)} className="rounded-xl" autoFocus />
            <Input value={editDescription} onChange={e => setEditDescription(e.target.value)} placeholder="Description" className="rounded-xl" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingId(null)} className="rounded-xl cursor-pointer">Cancel</Button>
            <Button onClick={handleUpdate} className="rounded-xl bg-accent text-white hover:bg-accent/90 cursor-pointer">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
