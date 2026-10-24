'use client'

import React, { useState, useEffect } from 'react'
import { useTaskStore } from '@/store/useTaskStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useCharacterStore } from '@/store/characterStore'
import { LocalTask, TaskPriority, TaskRecurrence, TaskTimeframe } from '@/types/local'
import {
  CheckSquare,
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Trash2,
  Folder,
  Clock,
  Bell,
  Calendar,
  Repeat,
  Edit3,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { requestNotificationPermission } from '@/lib/notificationService'

const WEEKDAYS = [
  { day: 0, label: 'Sun' },
  { day: 1, label: 'Mon' },
  { day: 2, label: 'Tue' },
  { day: 3, label: 'Wed' },
  { day: 4, label: 'Thu' },
  { day: 5, label: 'Fri' },
  { day: 6, label: 'Sat' },
]

export default function TasksPage() {
  const [mounted, setMounted] = useState(false)
  const {
    tasks,
    subtasks,
    addTask,
    updateTask,
    toggleStatus,
    removeTask,
    addSubtask,
    toggleSubtask,
  } = useTaskStore()
  const projects = useProjectStore((s) => s.projects)
  const celebrate = useCharacterStore((s) => s.celebrate)

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'done'>('active')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null)

  // Quick inline add
  const [quickTitle, setQuickTitle] = useState('')

  // Modal form state
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium')
  const [newTimeframe, setNewTimeframe] = useState<TaskTimeframe>('daily')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [newDueDate, setNewDueDate] = useState<string>('')
  const [newDueTime, setNewDueTime] = useState<string>('')
  const [newReminderTime, setNewReminderTime] = useState<string>('')
  const [newStartTime, setNewStartTime] = useState<string>('')
  const [newEndTime, setNewEndTime] = useState<string>('')
  const [newRecurrence, setNewRecurrence] = useState<TaskRecurrence>('none')
  const [newRecurrenceDays, setNewRecurrenceDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [enableReminder, setEnableReminder] = useState<boolean>(true)
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const taskId = params.get('taskId')
      const completeTaskId = params.get('completeTaskId')

      if (completeTaskId) {
        const target = useTaskStore.getState().tasks.find((t) => t.id === completeTaskId)
        if (target && target.status !== 'done') {
          useTaskStore.getState().toggleStatus(completeTaskId)
          toast.success(`Completed task "${target.title}" from notification!`)
        }
        setHighlightedTaskId(completeTaskId)
      } else if (taskId) {
        setHighlightedTaskId(taskId)
        setExpandedTaskId(taskId)
      }
    }
  }, [])

  const openCreateModal = () => {
    setEditingTaskId(null)
    setNewTitle('')
    setNewDesc('')
    setNewPriority('medium')
    setNewTimeframe('daily')
    setSelectedProjectId('')
    setNewDueDate(format(new Date(), 'yyyy-MM-dd'))
    setNewDueTime('')
    setNewReminderTime('09:00')
    setNewStartTime('09:00')
    setNewEndTime('10:00')
    setNewRecurrence('none')
    setNewRecurrenceDays([1, 2, 3, 4, 5])
    setEnableReminder(true)
    setShowAddModal(true)
  }

  const openEditModal = (task: LocalTask) => {
    setEditingTaskId(task.id)
    setNewTitle(task.title)
    setNewDesc(task.description || '')
    setNewPriority(task.priority)
    setNewTimeframe(task.timeframe || 'daily')
    setSelectedProjectId(task.projectId || '')
    setNewDueDate(task.dueDate || '')
    setNewDueTime(task.dueTime || '')
    setNewReminderTime(task.reminderTime || task.startTime || '')
    setNewStartTime(task.startTime || '')
    setNewEndTime(task.endTime || '')
    setNewRecurrence(task.recurrence || 'none')
    setNewRecurrenceDays(task.recurrenceDays || [1, 2, 3, 4, 5])
    setEnableReminder(task.enableReminder ?? true)
    setShowAddModal(true)
  }

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickTitle.trim()) return
    addTask({ title: quickTitle.trim(), priority: 'medium', timeframe: 'daily' })
    setQuickTitle('')
    toast.success('Task added.')
  }

  const handleModalSave = async () => {
    if (!newTitle.trim()) return

    const effectiveReminderTime = newReminderTime || newStartTime || newDueTime || null
    if (
      enableReminder &&
      effectiveReminderTime &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'default'
    ) {
      try {
        await requestNotificationPermission()
      } catch {}
    }

    const payload = {
      title: newTitle.trim(),
      description: newDesc.trim() || null,
      priority: newPriority,
      timeframe: newTimeframe,
      projectId: selectedProjectId || null,
      dueDate: newDueDate || null,
      dueTime: newDueTime || null,
      reminderTime: effectiveReminderTime,
      startTime: newStartTime || effectiveReminderTime || null,
      endTime: newEndTime || null,
      recurrence: newRecurrence,
      recurrenceDays: newRecurrence === 'custom' ? newRecurrenceDays : undefined,
      enableReminder: Boolean(enableReminder && effectiveReminderTime),
    }

    if (editingTaskId) {
      updateTask(editingTaskId, payload)
      toast.success(
        payload.enableReminder && effectiveReminderTime
          ? `Task updated! Reminder rescheduled for ${effectiveReminderTime}.`
          : 'Task updated.'
      )
    } else {
      addTask(payload)
      toast.success(
        payload.enableReminder && effectiveReminderTime
          ? `Task created! Android reminder scheduled for ${effectiveReminderTime}.`
          : 'Task created.'
      )
    }

    setShowAddModal(false)
    setEditingTaskId(null)
  }

  const handleToggle = (id: string, currentStatus: string) => {
    toggleStatus(id)
    if (currentStatus !== 'done') {
      celebrate()
      toast.success('Task marked complete — scheduled reminders cancelled.')
    }
  }

  const toggleRecurrenceWeekday = (day: number) => {
    setNewRecurrenceDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const nowHm = format(new Date(), 'HH:mm')

  const filteredTasks = tasks
    .filter((t) => {
      if (filterStatus === 'active') return t.status !== 'done'
      if (filterStatus === 'done') return t.status === 'done'
      return true
    })
    .filter((t) => {
      return (
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
      )
    })

  if (!mounted) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="h-16 rounded-2xl bg-stone-900/40 border border-stone-800/60 animate-pulse" />
        <div className="h-64 rounded-2xl bg-stone-900/40 border border-stone-800/60 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Task Matrix</h1>
          <p className="text-stone-400 text-sm">
            Organize priorities with scheduled Android notifications, due dates, and recurrence.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(212,168,83,0.3)] transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          New Scheduled Task
        </button>
      </div>

      {/* Quick Add Form */}
      <form onSubmit={handleQuickAdd} className="flex gap-2">
        <input
          type="text"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="Quick add a priority and press Enter..."
          className="flex-1 bg-stone-900/80 border border-stone-800 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-stone-500 focus:outline-none focus:border-amber-400/60 transition-colors"
        />
        <button
          type="submit"
          disabled={!quickTitle.trim()}
          className="px-5 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-200 font-semibold text-xs transition-colors cursor-pointer"
        >
          Add
        </button>
      </form>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full bg-stone-900/60 border border-stone-800 rounded-xl pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-stone-500 focus:outline-none focus:border-amber-400/60"
          />
        </div>

        <div className="flex gap-1.5 p-1 rounded-xl bg-stone-900 border border-stone-800 self-stretch sm:self-auto">
          {(['active', 'all', 'done'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                filterStatus === tab
                  ? 'bg-amber-400 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.map((task) => {
          const isDone = task.status === 'done'
          const project = projects.find((p) => p.id === task.projectId)
          const taskSubtasks = subtasks.filter((st) => st.taskId === task.id)
          const isExpanded = expandedTaskId === task.id
          const isHighlighted = highlightedTaskId === task.id
          const reminderHm = task.reminderTime || task.startTime
          const isOverdue =
            !isDone &&
            task.dueDate &&
            (task.dueDate < todayStr ||
              (task.dueDate === todayStr &&
                Boolean(task.dueTime || reminderHm) &&
                (task.dueTime || reminderHm)! < nowHm))

          return (
            <div
              key={task.id}
              className={`world-deck p-4 transition-all duration-200 ${
                isDone
                  ? 'opacity-60 bg-stone-950/40'
                  : isHighlighted
                  ? 'border-amber-400 ring-1 ring-amber-400/40'
                  : 'hover:border-stone-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <button
                    onClick={() => handleToggle(task.id, task.status)}
                    className="mt-0.5 w-5 h-5 rounded-md border border-stone-600 hover:border-amber-400 flex items-center justify-center shrink-0 cursor-pointer text-stone-500 hover:text-amber-400 transition-colors"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-semibold text-foreground ${
                        isDone ? 'line-through text-stone-500' : ''
                      }`}
                    >
                      {task.title}
                    </p>

                    {task.description && (
                      <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    {/* Metadata Pills */}
                    <div className="flex flex-wrap items-center gap-2 mt-2.5">
                      {/* Priority */}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          task.priority === 'urgent'
                            ? 'bg-rose-500/15 text-rose-300'
                            : task.priority === 'high'
                            ? 'bg-amber-500/15 text-amber-300'
                            : 'bg-blue-500/15 text-blue-300'
                        }`}
                      >
                        {task.priority}
                      </span>

                      {/* Overdue indicator */}
                      {isOverdue && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300 font-bold flex items-center gap-1">
                          <AlertCircle className="w-2.5 h-2.5" />
                          Overdue
                        </span>
                      )}

                      {/* Due Date */}
                      {task.dueDate && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-300 font-mono flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5 text-stone-400" />
                          <span>
                            {task.dueDate}
                            {task.dueTime ? ` @ ${task.dueTime}` : ''}
                          </span>
                        </span>
                      )}

                      {/* Scheduled Reminder Time */}
                      {reminderHm && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold flex items-center gap-1 border ${
                            task.enableReminder !== false && !isDone
                              ? 'bg-amber-400/10 text-amber-300 border-amber-400/20'
                              : 'bg-stone-900 text-stone-500 border-stone-800'
                          }`}
                        >
                          <Clock className="w-2.5 h-2.5" />
                          <span>
                            {reminderHm}
                            {task.endTime ? ` - ${task.endTime}` : ''}
                          </span>
                          {task.enableReminder !== false && !isDone && (
                            <Bell className="w-2.5 h-2.5 text-amber-400" />
                          )}
                        </span>
                      )}

                      {/* Recurrence */}
                      {task.recurrence && task.recurrence !== 'none' && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-sky-300 font-mono flex items-center gap-1 capitalize">
                          <Repeat className="w-2.5 h-2.5" />
                          <span>{task.recurrence}</span>
                        </span>
                      )}

                      {/* Project */}
                      {project && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded font-semibold flex items-center gap-1"
                          style={{
                            backgroundColor: `${project.color}20`,
                            color: project.color,
                          }}
                        >
                          <Folder className="w-3 h-3" />
                          {project.name}
                        </span>
                      )}

                      {/* Subtasks Count toggle */}
                      {taskSubtasks.length > 0 && (
                        <button
                          onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                          className="text-[10px] text-stone-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                        >
                          <span>
                            {taskSubtasks.filter((s) => s.isCompleted).length}/{taskSubtasks.length}{' '}
                            subtasks
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEditModal(task)}
                    className="p-1.5 rounded-lg text-stone-500 hover:text-amber-400 hover:bg-stone-800/60 transition-colors cursor-pointer"
                    title="Edit task & reminder schedule"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                    className="p-1.5 rounded-lg text-stone-500 hover:text-stone-300 hover:bg-stone-800/60 transition-colors cursor-pointer"
                    title="Subtasks"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      removeTask(task.id)
                      toast.info('Task deleted and scheduled reminder cancelled.')
                    }}
                    className="p-1.5 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-stone-800/60 transition-colors cursor-pointer"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Subtasks Drawer */}
              {isExpanded && (
                <div className="mt-4 pt-3 border-t border-stone-800/60 pl-8 space-y-2">
                  {taskSubtasks.map((st) => (
                    <div key={st.id} className="flex items-center gap-2 text-xs">
                      <button
                        onClick={() => toggleSubtask(st.id)}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          st.isCompleted
                            ? 'bg-emerald-400 border-emerald-400 text-stone-950'
                            : 'border-stone-700'
                        }`}
                      >
                        {st.isCompleted && <CheckCircle2 className="w-3 h-3" />}
                      </button>
                      <span
                        className={st.isCompleted ? 'line-through text-stone-500' : 'text-stone-300'}
                      >
                        {st.title}
                      </span>
                    </div>
                  ))}

                  {/* Add subtask */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      placeholder="Add subtask..."
                      className="bg-stone-900 border border-stone-800 rounded-lg px-2.5 py-1 text-xs text-foreground placeholder:text-stone-500 flex-1"
                    />
                    <button
                      onClick={() => {
                        if (newSubtaskTitle.trim()) {
                          addSubtask(task.id, newSubtaskTitle.trim())
                          setNewSubtaskTitle('')
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-stone-800 text-stone-300 text-xs font-semibold hover:bg-stone-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {filteredTasks.length === 0 && (
          <div className="p-12 text-center world-deck border-dashed border-stone-800">
            <CheckSquare className="w-10 h-10 text-stone-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-foreground">No tasks match your criteria</h3>
            <p className="text-xs text-stone-400 mt-1">
              Add a new priority or clear search filters.
            </p>
          </div>
        )}
      </div>

      {/* Add / Edit Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-stone-950 border border-stone-800 p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <h3 className="text-xl font-serif font-bold text-foreground">
                {editingTaskId ? 'Edit Task & Reminder' : 'Schedule Priority Task'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto pr-1 flex-1">
              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Study Electrical Machines"
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2 text-sm text-foreground focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1">
                  Description / Notes (optional)
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Detailed notes or context..."
                  rows={2}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2 text-sm text-foreground focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-foreground"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1">
                    Repeat / Recurrence
                  </label>
                  <select
                    value={newRecurrence}
                    onChange={(e) => setNewRecurrence(e.target.value as TaskRecurrence)}
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-foreground"
                  >
                    <option value="none">Once (One-time)</option>
                    <option value="daily">Daily</option>
                    <option value="weekdays">Weekdays (Mon–Fri)</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom Weekdays</option>
                  </select>
                </div>
              </div>

              {newRecurrence === 'custom' && (
                <div>
                  <label className="block text-[11px] font-semibold text-stone-400 mb-1.5">
                    Select Active Days
                  </label>
                  <div className="flex gap-1.5">
                    {WEEKDAYS.map((w) => {
                      const active = newRecurrenceDays.includes(w.day)
                      return (
                        <button
                          key={w.day}
                          type="button"
                          onClick={() => toggleRecurrenceWeekday(w.day)}
                          className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                            active
                              ? 'bg-amber-400 text-stone-950 border-amber-400'
                              : 'bg-stone-900 text-stone-400 border-stone-800'
                          }`}
                        >
                          {w.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Due Date & Due Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-foreground font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1">
                    Due Time (optional)
                  </label>
                  <input
                    type="time"
                    value={newDueTime}
                    onChange={(e) => setNewDueTime(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-foreground font-mono"
                  />
                </div>
              </div>

              {/* Android System Reminder Configuration */}
              <div className="p-3.5 rounded-xl bg-stone-900/70 border border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="text-xs font-bold text-stone-200 block">
                        Android Reminder Notification
                      </span>
                      <span className="text-[10px] text-stone-400">
                        Triggers system notification shade &amp; heads-up alert
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableReminder}
                    onChange={(e) => setEnableReminder(e.target.checked)}
                    className="accent-amber-400 w-4 h-4 cursor-pointer"
                  />
                </div>

                {enableReminder && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-800">
                    <div>
                      <span className="text-[10px] text-stone-400 block mb-1">
                        Reminder Time
                      </span>
                      <input
                        type="time"
                        value={newReminderTime}
                        onChange={(e) => {
                          setNewReminderTime(e.target.value)
                          if (!newStartTime) setNewStartTime(e.target.value)
                        }}
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-foreground font-mono font-bold focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 block mb-1">
                        End Time (optional)
                      </span>
                      <input
                        type="time"
                        value={newEndTime}
                        onChange={(e) => setNewEndTime(e.target.value)}
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-foreground font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1">
                  Workspace Project
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-foreground"
                >
                  <option value="">No Project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-stone-400 hover:text-stone-200 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleModalSave}
                disabled={!newTitle.trim()}
                className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-stone-950 font-bold text-xs cursor-pointer"
              >
                {editingTaskId ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
