import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { LocalProject, ProjectStatus } from '@/types/local'

interface ProjectState {
  projects: LocalProject[]
  addProject: (params: { name: string; description?: string | null; color?: string }) => void
  updateProject: (id: string, partial: Partial<LocalProject>) => void
  removeProject: (id: string) => void
}

const INITIAL_PROJECTS: LocalProject[] = []

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      projects: INITIAL_PROJECTS,

      addProject: (params) => {
        const project: LocalProject = {
          id: 'proj_' + Math.random().toString(36).substring(2, 9),
          name: params.name,
          description: params.description ?? null,
          color: params.color ?? '#6366F1',
          status: 'active',
          dueDate: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({ projects: [...state.projects, project] }))
      },

      updateProject: (id, partial) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...partial, updatedAt: new Date().toISOString() } : p
          ),
        }))
      },

      removeProject: (id) => {
        set((state) => ({ projects: state.projects.filter((p) => p.id !== id) }))
      },
    }),
    { name: 'nexora_project_storage' }
  )
)
