import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LocalProject } from '@/types/local'
import { createLocalProject, nowISO } from '@/types/local'
import { dbGetAll, dbPut, dbDelete } from '@/lib/db/indexeddb'

export type Project = LocalProject & {
  tasks?: { id: string; status: string; due_date: string | null; updated_at: string; deleted_at: string | null }[]
}

interface ProjectState {
  projects: Project[]
  isLoading: boolean
  setProjects: (projects: Project[]) => void
  addProject: (partial: Partial<LocalProject> & { name: string }) => Project
  updateProject: (id: string, updates: Partial<Project>) => void
  removeProject: (id: string) => void
  hydrate: () => Promise<void>
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      isLoading: true,
      setProjects: (projects) => set({ projects, isLoading: false }),
      addProject: (partial) => {
        const project: Project = createLocalProject(partial)
        set((state) => ({ projects: [project, ...state.projects] }))
        dbPut('projects', project).catch(console.error)
        return project
      },
      updateProject: (id, updates) => {
        const updatedAt = nowISO()
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt } : p
          ),
        }))
        const project = get().projects.find((p) => p.id === id)
        if (project) dbPut('projects', project).catch(console.error)
      },
      removeProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        }))
        dbDelete('projects', id).catch(console.error)
      },
      hydrate: async () => {
        try {
          const projects = await dbGetAll<Project>('projects')
          if (projects.length > 0) {
            set({ projects, isLoading: false })
          } else {
            set({ isLoading: false })
          }
        } catch {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'nexora_guest_projects',
      partialize: (state) => ({ projects: state.projects }),
    }
  )
)
