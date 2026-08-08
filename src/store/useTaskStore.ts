import { create } from 'zustand'
import { Database } from '@/types/database.types'

type Task = Database['public']['Tables']['tasks']['Row']

interface TaskState {
  tasks: Task[]
  isLoading: boolean
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  removeTask: (id: string) => void
  toggleStatus: (id: string) => void
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  isLoading: true,
  setTasks: (tasks) => set({ tasks, isLoading: false }),
  addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),
  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map((t) => t.id === id ? { ...t, ...updates } : t)
  })),
  removeTask: (id) => set((state) => ({
    tasks: state.tasks.filter((t) => t.id !== id)
  })),
  toggleStatus: (id) => set((state) => ({
    tasks: state.tasks.map((t) => {
      if (t.id === id) {
        return { ...t, status: t.status === 'done' ? 'todo' : 'done' }
      }
      return t
    })
  })),
}))
