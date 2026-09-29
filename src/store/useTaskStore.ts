import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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

export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({
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
    }),
    {
      name: 'nexora_guest_tasks',
      partialize: (state) => ({ tasks: state.tasks }), // Only persist tasks, not isLoading
    }
  )
)
