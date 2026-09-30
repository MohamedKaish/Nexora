import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LocalTask, TaskPriority, TaskStatus } from '@/types/local'
import { createLocalTask, nowISO } from '@/types/local'
import { dbGetAll, dbPut, dbDelete } from '@/lib/db/indexeddb'

interface TaskState {
  tasks: LocalTask[]
  isLoading: boolean
  isHydrated: boolean
  setTasks: (tasks: LocalTask[]) => void
  addTask: (partial: Partial<LocalTask> & { title: string }) => LocalTask
  updateTask: (id: string, updates: Partial<LocalTask>) => void
  removeTask: (id: string) => void
  toggleStatus: (id: string) => void
  hydrate: () => Promise<void>
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      isLoading: true,
      isHydrated: false,
      setTasks: (tasks) => set({ tasks, isLoading: false }),
      addTask: (partial) => {
        const task = createLocalTask(partial)
        set((state) => ({ tasks: [task, ...state.tasks] }))
        // Async persist to IndexedDB
        dbPut('tasks', task).catch(console.error)
        return task
      },
      updateTask: (id, updates) => {
        const updatedAt = nowISO()
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt } : t
          ),
        }))
        // Async persist
        const task = get().tasks.find((t) => t.id === id)
        if (task) dbPut('tasks', task).catch(console.error)
      },
      removeTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }))
        dbDelete('tasks', id).catch(console.error)
      },
      toggleStatus: (id) => {
        const updatedAt = nowISO()
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id === id) {
              const newStatus: TaskStatus = t.status === 'done' ? 'todo' : 'done'
              return { ...t, status: newStatus, updatedAt }
            }
            return t
          }),
        }))
        const task = get().tasks.find((t) => t.id === id)
        if (task) dbPut('tasks', task).catch(console.error)
      },
      hydrate: async () => {
        try {
          const tasks = await dbGetAll<LocalTask>('tasks')
          if (tasks.length > 0) {
            set({ tasks, isLoading: false, isHydrated: true })
          } else {
            set({ isLoading: false, isHydrated: true })
          }
        } catch {
          set({ isLoading: false, isHydrated: true })
        }
      },
    }),
    {
      name: 'nexora_guest_tasks',
      partialize: (state) => ({ tasks: state.tasks }),
    }
  )
)
