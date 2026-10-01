'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Check, Trash2, CheckSquare, Search, Filter, SortAsc } from 'lucide-react'
import { useTaskStore } from '@/store/useTaskStore'
import { useProjectStore } from '@/store/useProjectStore'
import type { TaskPriority, TaskStatus } from '@/types/local'

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  urgent: { label: 'Urgent', color: '#FB7185', bg: 'rgba(251,113,133,0.08)' },
  high: { label: 'High', color: '#FBBF24', bg: 'rgba(251,191,36,0.08)' },
  medium: { label: 'Medium', color: '#60A5FA', bg: 'rgba(96,165,250,0.08)' },
  low: { label: 'Low', color: '#A8A29E', bg: 'rgba(168,162,158,0.08)' },
  none: { label: 'None', color: '#78716C', bg: 'rgba(120,113,108,0.04)' },
}

type FilterType = 'all' | 'active' | 'done'

export default function TasksPage() {
  const { tasks, addTask, removeTask, toggleStatus } = useTaskStore()
  const { projects } = useProjectStore()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium')
  const [newProjectId, setNewProjectId] = useState<string>('none')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterType>('active')

  const handleCreate = () => {
    if (!newTitle.trim()) return
    addTask({
      title: newTitle.trim(),
      priority: newPriority,
      projectId: newProjectId === 'none' ? undefined : newProjectId,
    })
    setNewTitle('')
    setNewPriority('medium')
    setNewProjectId('none')
    setIsCreateOpen(false)
  }

  const filteredTasks = tasks
    .filter(t => !t.deletedAt)
    .filter(t => {
      if (filterStatus === 'active') return t.status !== 'done'
      if (filterStatus === 'done') return t.status === 'done'
      return true
    })
    .filter(t => !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 }
      if (a.status !== b.status) return a.status === 'done' ? 1 : -1
      const pa = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 4
      const pb = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 4
      return pa - pb
    })

  const activeCount = tasks.filter(t => !t.deletedAt && t.status !== 'done').length
  const doneCount = tasks.filter(t => !t.deletedAt && t.status === 'done').length

  return (
    <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-gradient">Tasks</h1>
          <p className="text-muted-foreground font-medium mt-1 text-sm">
            {activeCount} active · {doneCount} completed
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger render={<Button className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 font-semibold gap-1.5 cursor-pointer shadow-sm" />}>
            <Plus className="w-4 h-4" /> New Task
          </DialogTrigger>
          <DialogContent className="rounded-2xl world-glass border-border/20">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Add Task</DialogTitle>
              <DialogDescription className="text-muted-foreground">What needs to get done?</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <Input
                placeholder="Task title..."
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                autoFocus
                className="rounded-xl bg-background/60 border-border/30"
              />
              <div className="grid grid-cols-2 gap-3">
                <Select value={newPriority} onValueChange={v => setNewPriority(v as TaskPriority)}>
                  <SelectTrigger className="rounded-xl bg-background/60 border-border/30"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                          {cfg.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={newProjectId} onValueChange={(v) => setNewProjectId(v as string)}>
                  <SelectTrigger className="rounded-xl bg-background/60 border-border/30"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No project</SelectItem>
                    {projects.filter(p => !p.deletedAt && p.status === 'active').map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 cursor-pointer font-semibold">
                Create Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 rounded-xl bg-foreground/[0.02] border-border/20 h-10"
          />
        </div>
        <div className="flex gap-1.5 p-1 rounded-xl bg-foreground/[0.02] border border-border/20">
          {(['all', 'active', 'done'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer capitalize ${
                filterStatus === f
                  ? 'bg-accent/10 text-accent'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="empty-world rounded-3xl py-16 text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-blue/5 flex items-center justify-center mb-4">
            <CheckSquare className="w-6 h-6 text-brand-blue/30" />
          </div>
          <h3 className="text-base font-bold text-foreground">
            {searchQuery ? 'No matching tasks' : filterStatus === 'done' ? 'No completed tasks' : 'Your task list is clear'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            {searchQuery ? 'Try a different search' : 'Start adding tasks to stay organized'}
          </p>
          {!searchQuery && (
            <Button onClick={() => setIsCreateOpen(true)} variant="outline" className="rounded-xl cursor-pointer font-semibold gap-1.5">
              <Plus className="w-4 h-4" /> Add Task
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          {filteredTasks.map(task => {
            const isDone = task.status === 'done'
            const pc = PRIORITY_CONFIG[task.priority || 'none'] || PRIORITY_CONFIG.none
            const project = projects.find(p => p.id === (task.projectId || (task as unknown as Record<string, unknown>).project_id as string))

            return (
              <div
                key={task.id}
                className={`group flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200 ${
                  isDone
                    ? 'bg-brand-emerald/[0.03] border border-brand-emerald/10'
                    : 'world-card hover:border-accent/15'
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleStatus(task.id)}
                  className={`w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                    isDone
                      ? 'bg-brand-emerald text-white'
                      : 'border-[1.5px] hover:border-accent/50'
                  }`}
                  style={{ borderColor: isDone ? undefined : `${pc.color}40` }}
                  aria-label={isDone ? 'Unmark task' : 'Complete task'}
                >
                  {isDone && <Check className="w-3 h-3" />}
                </button>

                {/* Priority indicator */}
                <div className="w-1 h-5 rounded-full shrink-0" style={{ backgroundColor: pc.color, opacity: isDone ? 0.3 : 0.7 }} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {task.title}
                  </p>
                  {project && (
                    <span className="text-[10px] font-medium text-muted-foreground/60 flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: project.color }} />
                      {project.name}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <button
                  onClick={() => removeTask(task.id)}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  aria-label="Delete task"
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive/60" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
