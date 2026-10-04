'use client'

import React, { useState } from 'react'
import { useTaskStore } from '@/store/useTaskStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useCharacterStore } from '@/store/characterStore'
import { TaskPriority, TaskTimeframe } from '@/types/local'
import {
  CheckSquare,
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Trash2,
  Folder,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

export default function TasksPage() {
  const { tasks, subtasks, addTask, toggleStatus, removeTask, addSubtask, toggleSubtask } = useTaskStore()
  const projects = useProjectStore((s) => s.projects)
  const celebrate = useCharacterStore((s) => s.celebrate)

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'done'>('active')
  const [showAddModal, setShowAddModal] = useState(false)

  // Quick inline add
  const [quickTitle, setQuickTitle] = useState('')

  // Modal form state
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium')
  const [newTimeframe, setNewTimeframe] = useState<TaskTimeframe>('daily')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickTitle.trim()) return
    addTask({ title: quickTitle.trim(), priority: 'medium', timeframe: 'daily' })
    setQuickTitle('')
  }

  const handleModalAdd = () => {
    if (!newTitle.trim()) return
    addTask({
      title: newTitle.trim(),
      description: newDesc.trim() || null,
      priority: newPriority,
      timeframe: newTimeframe,
      projectId: selectedProjectId || null,
    })
    setNewTitle('')
    setNewDesc('')
    setShowAddModal(false)
  }

  const handleToggle = (id: string, currentStatus: string) => {
    toggleStatus(id)
    if (currentStatus !== 'done') {
      celebrate()
    }
  }

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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Task Matrix</h1>
          <p className="text-stone-400 text-sm">Organize and execute actionable daily priorities.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(212,168,83,0.3)] transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          New Task
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

          return (
            <div
              key={task.id}
              className={`world-deck p-4 transition-all duration-200 ${
                isDone ? 'opacity-60 bg-stone-950/40' : 'hover:border-stone-700'
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
                      <p className="text-xs text-stone-400 mt-1 leading-relaxed">{task.description}</p>
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

                      {/* Timeframe */}
                      {task.timeframe && task.timeframe !== 'none' && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-stone-800 text-stone-400 font-medium">
                          {task.timeframe}
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
                            {taskSubtasks.filter((s) => s.isCompleted).length}/{taskSubtasks.length} subtasks
                          </span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                    className="p-1.5 rounded-lg text-stone-500 hover:text-stone-300 hover:bg-stone-800/60 transition-colors"
                    title="Subtasks"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeTask(task.id)}
                    className="p-1.5 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-stone-800/60 transition-colors"
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
                          st.isCompleted ? 'bg-emerald-400 border-emerald-400 text-stone-950' : 'border-stone-700'
                        }`}
                      >
                        {st.isCompleted && <CheckCircle2 className="w-3 h-3" />}
                      </button>
                      <span className={st.isCompleted ? 'line-through text-stone-500' : 'text-stone-300'}>
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
            <p className="text-xs text-stone-400 mt-1">Add a new priority or clear search filters.</p>
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-stone-950 border border-stone-800 p-6 space-y-4 shadow-2xl">
            <h3 className="text-xl font-serif font-bold text-foreground">Add New Priority Task</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Task title..."
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2 text-sm text-foreground focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1">Description (optional)</label>
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
                  <label className="block text-xs font-semibold text-stone-400 mb-1">Priority</label>
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
                  <label className="block text-xs font-semibold text-stone-400 mb-1">Timeframe</label>
                  <select
                    value={newTimeframe}
                    onChange={(e) => setNewTimeframe(e.target.value as TaskTimeframe)}
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-foreground"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="none">No Timeframe</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1">Workspace Project</label>
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

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-stone-400 hover:text-stone-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleModalAdd}
                disabled={!newTitle.trim()}
                className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-stone-950 font-bold text-xs"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
