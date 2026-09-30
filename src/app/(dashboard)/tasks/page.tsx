'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Plus, Search, CheckCircle2, Circle, Trash2, Edit2,
  Calendar, Flag, ListTodo, LayoutGrid
} from 'lucide-react'
import { useTaskStore } from '@/store/useTaskStore'
import { useProjectStore } from '@/store/useProjectStore'
import type { TaskPriority, TaskStatus } from '@/types/local'
import { format, parseISO, isToday, isPast } from 'date-fns'


const PRIORITY_COLORS: Record<TaskPriority, string> = {
  urgent: '#EF4444',
  high: '#F59E0B',
  medium: '#3B82F6',
  low: '#6B7280',
}

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export default function TasksPage() {
  const { tasks, addTask, updateTask, removeTask, toggleStatus } = useTaskStore()
  const { projects } = useProjectStore()
  const [search, setSearch] = useState('')
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'priority' | 'dueDate'>('newest')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<string | null>(null)

  // Create form state
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium')
  const [newDueDate, setNewDueDate] = useState('')
  const [newProjectId, setNewProjectId] = useState<string>('')

  // Edit form state
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPriority, setEditPriority] = useState<TaskPriority>('medium')
  const [editDueDate, setEditDueDate] = useState('')

  const activeTasks = tasks.filter(t => !t.deletedAt)

  const filteredTasks = useMemo(() => {
    let result = activeTasks

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(t => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q))
    }
    if (filterPriority !== 'all') result = result.filter(t => t.priority === filterPriority)
    if (filterStatus !== 'all') result = result.filter(t => t.status === filterStatus)

    result.sort((a, b) => {
      if (sortBy === 'priority') {
        const order: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
        return (order[a.priority] ?? 2) - (order[b.priority] ?? 2)
      }
      if (sortBy === 'dueDate') {
        const ad = a.dueDate || (a as unknown as Record<string, unknown>).due_date as string || '9999'
        const bd = b.dueDate || (b as unknown as Record<string, unknown>).due_date as string || '9999'
        return ad.localeCompare(bd)
      }
      return (b.createdAt || (b as unknown as Record<string, unknown>).created_at as string || '').localeCompare(a.createdAt || (a as unknown as Record<string, unknown>).created_at as string || '')
    })

    return result
  }, [activeTasks, search, filterPriority, filterStatus, sortBy])

  const handleCreate = () => {
    if (!newTitle.trim()) return
    addTask({
      title: newTitle.trim(),
      description: newDescription.trim() || null,
      priority: newPriority,
      dueDate: newDueDate || null,
      projectId: newProjectId || null,
    })
    setNewTitle('')
    setNewDescription('')
    setNewPriority('medium')
    setNewDueDate('')
    setNewProjectId('')
    setIsCreateOpen(false)
  }

  const startEdit = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    setEditTitle(task.title)
    setEditDescription(task.description || '')
    setEditPriority(task.priority)
    setEditDueDate(task.dueDate || (task as unknown as Record<string, unknown>).due_date as string || '')
    setEditingTask(taskId)
  }

  const handleUpdate = () => {
    if (!editingTask || !editTitle.trim()) return
    updateTask(editingTask, {
      title: editTitle.trim(),
      description: editDescription.trim() || null,
      priority: editPriority,
      dueDate: editDueDate || null,
    })
    setEditingTask(null)
  }

  const todoCount = activeTasks.filter(t => t.status === 'todo').length
  const doneCount = activeTasks.filter(t => t.status === 'done').length

  return (
    <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground font-medium mt-1">
            {todoCount} to do · {doneCount} completed
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger render={<Button className="rounded-xl bg-accent text-white hover:bg-accent/90 font-medium gap-1.5 cursor-pointer transition-all" />}>
            <Plus className="w-4 h-4" />
            New Task
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Create Task</DialogTitle>
              <DialogDescription>Add a new task to your workspace.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <Input placeholder="Task title" value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} autoFocus className="rounded-xl" />
              <Input placeholder="Description (optional)" value={newDescription} onChange={e => setNewDescription(e.target.value)} className="rounded-xl" />
              <div className="grid grid-cols-2 gap-3">
                <Select value={newPriority} onValueChange={v => setNewPriority(v as TaskPriority)}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Priority" /></SelectTrigger>
                  <SelectContent>
                    {(['low','medium','high','urgent'] as TaskPriority[]).map(p => (
                      <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} className="rounded-xl" />
              </div>
              {projects.length > 0 && (
                <Select value={newProjectId} onValueChange={(v) => setNewProjectId(v || '')}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Project (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No project</SelectItem>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} className="rounded-xl bg-accent text-white hover:bg-accent/90 cursor-pointer">Create Task</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl border-border/50 bg-card/60" />
        </div>
        <Select value={filterPriority} onValueChange={v => setFilterPriority(v as TaskPriority | 'all')}>
          <SelectTrigger className="w-[130px] rounded-xl border-border/50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            {(['urgent','high','medium','low'] as TaskPriority[]).map(p => (
              <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={v => setFilterStatus(v as TaskStatus | 'all')}>
          <SelectTrigger className="w-[130px] rounded-xl border-border/50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={v => setSortBy(v as 'newest' | 'priority' | 'dueDate')}>
          <SelectTrigger className="w-[130px] rounded-xl border-border/50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="dueDate">Due Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ListTodo className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-1">No tasks yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create your first task to get started.</p>
          <Button onClick={() => setIsCreateOpen(true)} variant="outline" className="rounded-xl cursor-pointer">
            <Plus className="w-4 h-4 mr-1.5" />
            Create Task
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => {
            const dueDate = task.dueDate || (task as unknown as Record<string, unknown>).due_date as string
            const isOverdue = dueDate && task.status !== 'done' && isPast(parseISO(dueDate)) && !isToday(parseISO(dueDate))

            return (
              <div
                key={task.id}
                className={`group flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                  task.status === 'done'
                    ? 'bg-card/30 border-border/30 opacity-60'
                    : 'bg-card/60 border-border/40 hover:border-border/60 hover:bg-card/80'
                }`}
              >
                {/* Toggle */}
                <button onClick={() => toggleStatus(task.id)} className="shrink-0 cursor-pointer" aria-label={task.status === 'done' ? 'Mark incomplete' : 'Mark complete'}>
                  {task.status === 'done' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${task.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{task.description}</p>
                  )}
                </div>

                {/* Meta */}
                <div className="flex items-center gap-2 shrink-0">
                  {dueDate && (
                    <span className={`text-xs font-medium flex items-center gap-1 ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                      <Calendar className="w-3 h-3" />
                      {format(parseISO(dueDate), 'MMM d')}
                    </span>
                  )}
                  <div className="flex items-center gap-1" title={PRIORITY_LABELS[task.priority]}>
                    <Flag className="w-3 h-3" style={{ color: PRIORITY_COLORS[task.priority] }} />
                  </div>
                  <button onClick={() => startEdit(task.id)} className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1 rounded hover:bg-secondary/40" aria-label="Edit task">
                    <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button onClick={() => removeTask(task.id)} className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1 rounded hover:bg-destructive/10" aria-label="Delete task">
                    <Trash2 className="w-3.5 h-3.5 text-destructive/70" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="rounded-xl" autoFocus />
            <Input value={editDescription} onChange={e => setEditDescription(e.target.value)} placeholder="Description" className="rounded-xl" />
            <div className="grid grid-cols-2 gap-3">
              <Select value={editPriority} onValueChange={v => setEditPriority(v as TaskPriority)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['low','medium','high','urgent'] as TaskPriority[]).map(p => (
                    <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} className="rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTask(null)} className="rounded-xl cursor-pointer">Cancel</Button>
            <Button onClick={handleUpdate} className="rounded-xl bg-accent text-white hover:bg-accent/90 cursor-pointer">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
