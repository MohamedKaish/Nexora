import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { LocalTask, LocalSubtask, TaskPriority, TaskTimeframe } from '@/types/local'

interface TaskState {
  tasks: LocalTask[]
  subtasks: LocalSubtask[]
  addTask: (params: {
    title: string
    description?: string | null
    priority?: TaskPriority
    timeframe?: TaskTimeframe
    projectId?: string | null
    dueDate?: string | null
    estimatedTimeMinutes?: number | null
  }) => LocalTask
  updateTask: (id: string, partial: Partial<LocalTask>) => void
  toggleStatus: (id: string) => void
  removeTask: (id: string) => void
  addSubtask: (taskId: string, title: string) => void
  toggleSubtask: (subtaskId: string) => void
  removeSubtask: (subtaskId: string) => void
}

const INITIAL_TASKS: LocalTask[] = []

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: INITIAL_TASKS,
      subtasks: [],

      addTask: (params) => {
        const newTask: LocalTask = {
          id: 'task_' + Math.random().toString(36).substring(2, 9),
          title: params.title,
          description: params.description ?? null,
          priority: params.priority ?? 'medium',
          status: 'todo',
          timeframe: params.timeframe ?? 'none',
          projectId: params.projectId ?? null,
          dueDate: params.dueDate ?? null,
          estimatedTimeMinutes: params.estimatedTimeMinutes ?? null,
          actualTimeMinutes: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({ tasks: [newTask, ...state.tasks] }))
        return newTask
      },

      updateTask: (id, partial) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...partial, updatedAt: new Date().toISOString() } : t
          ),
        }))
      },

      toggleStatus: (id) => {
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id !== id) return t
            const nextStatus = t.status === 'done' ? 'todo' : 'done'
            return {
              ...t,
              status: nextStatus,
              updatedAt: new Date().toISOString(),
            }
          }),
        }))
      },

      removeTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
          subtasks: state.subtasks.filter((st) => st.taskId !== id),
        }))
      },

      addSubtask: (taskId, title) => {
        const subtask: LocalSubtask = {
          id: 'sub_' + Math.random().toString(36).substring(2, 9),
          taskId,
          title,
          isCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({ subtasks: [...state.subtasks, subtask] }))
      },

      toggleSubtask: (subtaskId) => {
        set((state) => ({
          subtasks: state.subtasks.map((st) =>
            st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted, updatedAt: new Date().toISOString() } : st
          ),
        }))
      },

      removeSubtask: (subtaskId) => {
        set((state) => ({
          subtasks: state.subtasks.filter((st) => st.id !== subtaskId),
        }))
      },
    }),
    { name: 'nexora_task_storage' }
  )
)
