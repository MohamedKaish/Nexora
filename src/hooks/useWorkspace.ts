import { useAuth } from '@/providers/AuthProvider'
import { useTaskStore } from '@/store/useTaskStore'
import { useProjectStore, Project } from '@/store/useProjectStore'
import { useGoalStore, Goal } from '@/store/useGoalStore'
import { Database } from '@/types/database.types'

import * as taskActions from '@/features/tasks/actions'
import * as projectActions from '@/features/projects/actions'
import * as goalActions from '@/features/goals/actions'

type Task = Database['public']['Tables']['tasks']['Row']

export function useWorkspace() {
  const { user } = useAuth()
  const { addTask, updateTask, removeTask } = useTaskStore()
  const { addProject, updateProject, removeProject } = useProjectStore()
  const { addGoal, updateGoal, removeGoal } = useGoalStore()

  const isGuest = !user

  // ================= TASKS =================
  const createTask = async (params: Parameters<typeof taskActions.createTask>[0]) => {
    if (isGuest) {
      const newTask: Task = {
        id: 'guest-' + crypto.randomUUID(),
        user_id: 'guest',
        title: params.title,
        description: params.description || null,
        status: params.status || 'todo',
        priority: params.priority || 'medium',
        project_id: params.project_id || null,
        due_date: params.due_date || null,
        is_schedule_for_today: params.is_schedule_for_today || false,
        is_urgent: params.is_urgent || false,
        is_important: params.is_important || false,
        estimated_time_minutes: params.estimated_time_minutes || null,
        actual_time_minutes: 0,
        recurrence_rule: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      }
      addTask(newTask)
      return newTask
    } else {
      const result = await taskActions.createTask(params)
      addTask(result)
      return result
    }
  }

  const updateTaskStatus = async (id: string, status: 'todo' | 'in_progress' | 'done') => {
    if (isGuest) {
      updateTask(id, { status, updated_at: new Date().toISOString() })
    } else {
      const result = await taskActions.toggleTaskStatus(id, status)
      updateTask(id, result)
    }
  }

  const updateTaskFields = async (id: string, updates: Partial<Task>) => {
    if (isGuest) {
      updateTask(id, { ...updates, updated_at: new Date().toISOString() })
    } else {
      const result = await taskActions.updateTask(id, updates)
      updateTask(id, result)
    }
  }

  const deleteTask = async (id: string) => {
    if (isGuest) {
      removeTask(id)
    } else {
      await taskActions.deleteTask(id)
      removeTask(id)
    }
  }

  // ================= PROJECTS =================
  const createProject = async (params: {
    name: string
    description?: string | null
    color: string
    status: 'active' | 'archived' | 'completed'
    due_date?: string | null
  }) => {
    if (isGuest) {
      const newProject: Project = {
        id: 'guest-' + crypto.randomUUID(),
        user_id: 'guest',
        category_id: null,
        name: params.name,
        description: params.description || null,
        color: params.color || '#3B82F6',
        status: params.status || 'active',
        due_date: params.due_date || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      }
      addProject(newProject)
      return newProject
    } else {
      const result = await projectActions.createProject(params)
      addProject(result as Project)
      return result as Project
    }
  }

  const editProject = async (id: string, updates: Partial<Project>) => {
    if (isGuest) {
      updateProject(id, { ...updates, updated_at: new Date().toISOString() })
    } else {
      const result = await projectActions.updateProject(id, updates)
      updateProject(id, result as Project)
    }
  }

  const deleteProject = async (id: string) => {
    if (isGuest) {
      removeProject(id)
    } else {
      await projectActions.deleteProject(id)
      removeProject(id)
    }
  }

  // ================= GOALS =================
  const createNewGoal = async (
    title: string,
    type: 'daily' | 'weekly' | 'monthly',
    periodStart: string,
    periodEnd: string
  ) => {
    if (isGuest) {
      const newGoal: Goal = {
        id: 'guest-' + crypto.randomUUID(),
        user_id: 'guest',
        title,
        type,
        status: 'active',
        period_start: periodStart,
        period_end: periodEnd,
        created_at: new Date().toISOString(),
      }
      addGoal(newGoal)
      return newGoal
    } else {
      const result = await goalActions.createGoal(title, type, periodStart, periodEnd)
      addGoal(result)
      return result
    }
  }

  const updateGoalFields = async (id: string, updates: Partial<Goal>) => {
    if (isGuest) {
      updateGoal(id, { ...updates })
    } else {
      const result = await goalActions.updateGoal(id, updates)
      updateGoal(id, result)
    }
  }

  const updateGoalStatusOnly = async (id: string, status: 'active' | 'completed' | 'failed') => {
    if (isGuest) {
      updateGoal(id, { status })
    } else {
      const result = await goalActions.updateGoalStatus(id, status)
      updateGoal(id, result)
    }
  }

  const removeGoalById = async (id: string) => {
    if (isGuest) {
      removeGoal(id)
    } else {
      await goalActions.deleteGoal(id)
      removeGoal(id)
    }
  }

  return {
    isGuest,
    createTask,
    updateTaskStatus,
    updateTaskFields,
    deleteTask,
    createProject,
    editProject,
    deleteProject,
    createNewGoal,
    updateGoalFields,
    updateGoalStatusOnly,
    removeGoalById
  }
}
