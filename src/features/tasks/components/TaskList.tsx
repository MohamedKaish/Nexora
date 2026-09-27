'use client'

import { useEffect, useState } from 'react'
import { useTaskStore } from '@/store/useTaskStore'
import { toggleTaskStatus, deleteTask } from '../actions'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Database } from '@/types/database.types'
import { SubtaskList } from './SubtaskList'
import { EditTaskDialog } from './EditTaskDialog'
import { ChevronDown, ChevronRight, Trash2, Search, Sparkles, CheckSquare, Edit2, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { format, parseISO, isPast, isToday } from 'date-fns'

type TaskWithSubtasks = Database['public']['Tables']['tasks']['Row'] & {
  subtasks?: Database['public']['Tables']['subtasks']['Row'][]
}

type Project = Database['public']['Tables']['projects']['Row']

interface TaskListProps {
  initialTasks: TaskWithSubtasks[]
  projects?: Project[]
}

export function TaskList({ initialTasks, projects = [] }: TaskListProps) {
  const { tasks, setTasks, toggleStatus, removeTask } = useTaskStore()
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'default' | 'smart' | 'dueDate'>('default')
  const [editingTask, setEditingTask] = useState<TaskWithSubtasks | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks, setTasks])

  const handleToggle = async (id: string, currentStatus: 'todo' | 'in_progress' | 'done') => {
    // Optimistic update
    toggleStatus(id)
    try {
      await toggleTaskStatus(id, currentStatus)
    } catch (err) {
      console.error(err)
      toggleStatus(id)
      toast.error('Failed to update task status')
    }
  }

  const handleDelete = async (id: string) => {
    const previousTasks = [...tasks]
    removeTask(id)
    try {
      await deleteTask(id)
      toast.success('Task deleted')
    } catch (err) {
      console.error(err)
      setTasks(previousTasks as TaskWithSubtasks[])
      toast.error('Failed to delete task')
    }
  }

  const handleEdit = (task: TaskWithSubtasks) => {
    setEditingTask(task)
    setIsEditDialogOpen(true)
  }

  const calculateSmartScore = (t: TaskWithSubtasks) => {
    let score = 0
    if (t.is_urgent) score += 50
    if (t.is_important) score += 40
    if (t.priority === 'urgent') score += 30
    if (t.priority === 'high') score += 20
    if (t.priority === 'medium') score += 10
    if (t.due_date) {
      // eslint-disable-next-line react-hooks/purity
      const daysUntilDue = (new Date(t.due_date).getTime() - Date.now()) / (1000 * 3600 * 24)
      if (daysUntilDue < 0) score += 100 // Overdue
      else if (daysUntilDue <= 1) score += 60 // Due today
      else if (daysUntilDue <= 3) score += 30
    }
    return score
  }

  let filteredTasks = (tasks as TaskWithSubtasks[]).filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  )

  if (sortBy === 'smart') {
    filteredTasks = [...filteredTasks].sort((a, b) => calculateSmartScore(b) - calculateSmartScore(a))
  } else if (sortBy === 'dueDate') {
    filteredTasks = [...filteredTasks].sort((a, b) => {
      if (!a.due_date) return 1
      if (!b.due_date) return -1
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    })
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border border-white/5 rounded-[24px] bg-secondary/20 shadow-inner">
        <div className="h-16 w-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4 border border-white/5 shadow-sm">
          <CheckSquare className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-xl font-bold tracking-tight text-foreground">No tasks yet</h3>
        <p className="mt-2 text-[14px] font-medium text-muted-foreground max-w-sm text-center">
          You&apos;re all caught up! Create a new task to start organizing your day.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="relative w-full max-w-md group">
          <Search className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
          <Input
            placeholder="Filter tasks..."
            className="pl-11 h-12 bg-secondary/30 border-white/5 focus:border-primary/50 transition-all duration-300 rounded-[14px] smooth-ring shadow-sm font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select
          value={sortBy}
          onValueChange={(v) => {
            if (v) setSortBy(v as 'default' | 'smart' | 'dueDate')
          }}
        >
          <SelectTrigger className="w-full sm:w-[200px] h-12 bg-secondary/30 border-white/5 rounded-[14px] smooth-ring font-medium shadow-sm transition-all duration-300 hover:bg-secondary/50">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default Order</SelectItem>
            <SelectItem value="smart">
              <div className="flex items-center text-primary font-semibold">
                <Sparkles className="w-3.5 h-3.5 mr-2" />
                Kyro Smart Sort
              </div>
            </SelectItem>
            <SelectItem value="dueDate">Due Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3">
        {filteredTasks.map((task) => {
          let dueDateDisplay: { label: string; isOverdue: boolean } | null = null
          if (task.due_date) {
            try {
              const parsed = parseISO(task.due_date)
              const overdue = isPast(parsed) && !isToday(parsed) && task.status !== 'done'
              dueDateDisplay = {
                label: isToday(parsed) ? 'Today' : format(parsed, 'MMM d'),
                isOverdue: overdue,
              }
            } catch {
              dueDateDisplay = null
            }
          }

          return (
            <div
              key={task.id}
              className={`flex flex-col rounded-[16px] border transition-all duration-300 group ${
                task.status === 'done'
                  ? 'bg-secondary/10 border-white/5 opacity-60 grayscale-[30%]'
                  : 'glass-card hover:bg-card/80 hover:border-white/10 hover:shadow-[0_8px_30px_rgb(0,0,0,0.15)] hover:-translate-y-0.5'
              }`}
            >
              <div className="flex items-center justify-between p-4 sm:p-5">
                <div className="flex items-center space-x-4 flex-1 pr-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 transition-colors duration-300 rounded-[10px] ${
                      expandedTasks.has(task.id)
                        ? 'bg-secondary text-foreground'
                        : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
                    }`}
                    onClick={() => {
                      const newExpanded = new Set(expandedTasks)
                      if (newExpanded.has(task.id)) newExpanded.delete(task.id)
                      else newExpanded.add(task.id)
                      setExpandedTasks(newExpanded)
                    }}
                  >
                    {expandedTasks.has(task.id) ? (
                      <ChevronDown className="h-[18px] w-[18px]" />
                    ) : (
                      <ChevronRight className="h-[18px] w-[18px]" />
                    )}
                  </Button>
                  <Checkbox
                    checked={task.status === 'done'}
                    onCheckedChange={() => handleToggle(task.id, task.status)}
                    className="h-6 w-6 rounded-[6px] border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all duration-300 data-[state=checked]:shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                  />
                  <div
                    className="flex flex-col cursor-pointer"
                    onClick={() => {
                      const newExpanded = new Set(expandedTasks)
                      if (newExpanded.has(task.id)) newExpanded.delete(task.id)
                      else newExpanded.add(task.id)
                      setExpandedTasks(newExpanded)
                    }}
                  >
                    <span
                      className={`text-[16px] font-semibold transition-colors duration-300 ${
                        task.status === 'done'
                          ? 'line-through text-muted-foreground/70'
                          : 'text-foreground group-hover:text-primary'
                      }`}
                    >
                      {task.title}
                    </span>
                    {task.description && (
                      <span className="text-[13px] font-medium text-muted-foreground line-clamp-1 mt-1 opacity-80">
                        {task.description}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  {dueDateDisplay && (
                    <span
                      className={`text-[11px] font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                        dueDateDisplay.isOverdue
                          ? 'bg-brand-rose/10 text-brand-rose border-brand-rose/20'
                          : 'bg-secondary/60 text-muted-foreground border-white/5'
                      }`}
                    >
                      <Calendar className="h-3 w-3" />
                      {dueDateDisplay.label}
                    </span>
                  )}

                  {task.priority !== 'medium' && (
                    <Badge
                      variant={task.priority === 'urgent' ? 'destructive' : 'secondary'}
                      className={`capitalize px-3 py-1 text-[11px] font-bold tracking-wider rounded-full shadow-sm transition-transform duration-300 group-hover:scale-105 ${
                        task.priority === 'urgent'
                          ? 'bg-brand-rose/15 text-brand-rose border-brand-rose/20'
                          : 'bg-secondary/80 text-muted-foreground border-white/5'
                      }`}
                    >
                      {task.priority}
                    </Badge>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(task)}
                    className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-[10px] transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110"
                    title="Edit Task"
                  >
                    <Edit2 className="h-[16px] w-[16px]" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(task.id)}
                    className="h-9 w-9 text-muted-foreground hover:text-brand-rose hover:bg-brand-rose/15 rounded-[10px] transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110"
                    title="Delete Task"
                  >
                    <Trash2 className="h-[18px] w-[18px]" />
                  </Button>
                </div>
              </div>

              {expandedTasks.has(task.id) && (
                <div className="px-14 pb-4">
                  <SubtaskList
                    taskId={task.id}
                    initialSubtasks={
                      ((task as unknown as Record<string, unknown>).subtasks as Database['public']['Tables']['subtasks']['Row'][]) || []
                    }
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <EditTaskDialog
        task={editingTask}
        projects={projects}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </div>
  )
}
