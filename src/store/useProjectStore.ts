import { create } from 'zustand'
import { Database } from '@/types/database.types'

type BaseProject = Database['public']['Tables']['projects']['Row']
export type Project = BaseProject & {
  tasks?: { id: string; status: string; due_date: string | null; updated_at: string; deleted_at: string | null }[]
}

interface ProjectState {
  projects: Project[]
  isLoading: boolean
  setProjects: (projects: Project[]) => void
  addProject: (project: Project) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  removeProject: (id: string) => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  isLoading: true,
  setProjects: (projects) => set({ projects, isLoading: false }),
  addProject: (project) => set((state) => ({ projects: [project, ...state.projects] })),
  updateProject: (id, updates) => set((state) => ({
    projects: state.projects.map((p) => p.id === id ? { ...p, ...updates } : p)
  })),
  removeProject: (id) => set((state) => ({
    projects: state.projects.filter((p) => p.id !== id)
  })),
}))
