import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  LocalTask,
  LocalSubtask,
  TaskPriority,
  TaskRecurrence,
  TaskTimeframe,
} from '@/types/local'
import {
  syncTaskNotification,
  cancelAlarmsBySourceId,
} from '@/lib/nativeNotificationScheduler'

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
    dueTime?: string | null
    reminderTime?: string | null
    startTime?: string | null
    endTime?: string | null
    recurrence?: TaskRecurrence
    recurrenceDays?: number[]
    enableReminder?: boolean
    repeatOverdueAlerts?: boolean
    estimatedTimeMinutes?: number | null
  }) => LocalTask
  updateTask: (id: string, partial: Partial<LocalTask>) => void
  toggleStatus: (id: string) => void
  removeTask: (id: string) => void
  addSubtask: (taskId: string, title: string) => void
  toggleSubtask: (subtaskId: string) => void
  removeSubtask: (subtaskId: string) => void
  markTaskNotified: (id: string, dateStr: string) => void
}

const INITIAL_TASKS: LocalTask[] = []

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: INITIAL_TASKS,
      subtasks: [],

      addTask: (params) => {
        const effectiveReminder =
          params.reminderTime ?? params.startTime ?? params.dueTime ?? null
        const newTask: LocalTask = {
          id: 'task_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
          title: params.title,
          description: params.description ?? null,
          priority: params.priority ?? 'medium',
          status: 'todo',
          timeframe: params.timeframe ?? 'none',
          projectId: params.projectId ?? null,
          dueDate: params.dueDate ?? null,
          dueTime: params.dueTime ?? null,
          reminderTime: effectiveReminder,
          startTime: params.startTime ?? effectiveReminder,
          endTime: params.endTime ?? null,
          recurrence: params.recurrence ?? 'none',
          recurrenceDays: params.recurrenceDays,
          enableReminder: params.enableReminder ?? Boolean(effectiveReminder),
          repeatOverdueAlerts: params.repeatOverdueAlerts ?? false,
          lastNotifiedDate: null,
          estimatedTimeMinutes: params.estimatedTimeMinutes ?? null,
          actualTimeMinutes: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({ tasks: [newTask, ...state.tasks] }))
        syncTaskNotification(newTask)
        return newTask
      },

      updateTask: (id, partial) => {
        let updatedTask: LocalTask | null = null
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id !== id) return t
            updatedTask = {
              ...t,
              ...partial,
              updatedAt: new Date().toISOString(),
            }
            return updatedTask
          }),
        }))
        if (updatedTask) {
          syncTaskNotification(updatedTask)
        }
      },

      toggleStatus: (id) => {
        let updatedTask: LocalTask | null = null
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id !== id) return t
            const nextStatus = t.status === 'done' ? 'todo' : 'done'
            updatedTask = {
              ...t,
              status: nextStatus,
              updatedAt: new Date().toISOString(),
            }
            return updatedTask
          }),
        }))
        if (updatedTask) {
          if ((updatedTask as LocalTask).status === 'done') {
            cancelAlarmsBySourceId(id)
          } else {
            syncTaskNotification(updatedTask)
          }
        }
      },

      removeTask: (id) => {
        cancelAlarmsBySourceId(id)
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
          subtasks: state.subtasks.filter((st) => st.taskId !== id),
        }))
      },

      markTaskNotified: (id, dateStr) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, lastNotifiedDate: dateStr } : t
          ),
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
            st.id === subtaskId
              ? { ...st, isCompleted: !st.isCompleted, updatedAt: new Date().toISOString() }
              : st
          ),
        }))
      },

      removeSubtask: (subtaskId) => {
        set((state) => ({
          subtasks: state.subtasks.filter((st) => st.id !== subtaskId),
        }))
      },
    }),
    {
      name: 'nexora_task_storage',
      version: 2,
      migrate: (persistedState: unknown) => {
        const state = (persistedState || {}) as Partial<TaskState>
        const rawTasks = Array.isArray(state.tasks) ? state.tasks : []
        const migratedTasks: LocalTask[] = rawTasks.map((t) => ({
          ...t,
          dueTime: t.dueTime ?? null,
          reminderTime: t.reminderTime ?? t.startTime ?? t.dueTime ?? null,
          recurrence: t.recurrence ?? 'none',
          recurrenceDays: Array.isArray(t.recurrenceDays) ? t.recurrenceDays : undefined,
          repeatOverdueAlerts: t.repeatOverdueAlerts ?? false,
          lastNotifiedDate: t.lastNotifiedDate ?? null,
        }))
        return {
          tasks: migratedTasks,
          subtasks: Array.isArray(state.subtasks) ? state.subtasks : [],
        }
      },
    }
  )
)
