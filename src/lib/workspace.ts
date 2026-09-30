/**
 * Workspace operations: export, import, reset.
 * Works entirely with IndexedDB local data.
 */

import { exportAllData, importAllData, dbClearAll } from '@/lib/db/indexeddb'
import type { WorkspaceExport, LocalPreferences } from '@/types/local'

const CURRENT_SCHEMA_VERSION = 1

export async function exportWorkspace(preferences: LocalPreferences): Promise<string> {
  const data = await exportAllData()
  
  const agentConfigRaw = localStorage.getItem('nexora_agent_config')
  const characterConfigRaw = localStorage.getItem('nexora_character_config')
  
  const exportData: WorkspaceExport = {
    version: CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: '2.0.0',
    tasks: (data.tasks ?? []) as WorkspaceExport['tasks'],
    projects: (data.projects ?? []) as WorkspaceExport['projects'],
    goals: (data.goals ?? []) as WorkspaceExport['goals'],
    habits: (data.habits ?? []) as WorkspaceExport['habits'],
    habitCompletions: (data.habitCompletions ?? []) as WorkspaceExport['habitCompletions'],
    timeline: (data.timeline ?? []) as WorkspaceExport['timeline'],
    focusSessions: (data.focusSessions ?? []) as WorkspaceExport['focusSessions'],
    agentConfig: agentConfigRaw ? JSON.parse(agentConfigRaw)?.state?.config : null,
    characterConfig: characterConfigRaw ? JSON.parse(characterConfigRaw)?.state?.config : null,
    preferences,
  }
  
  return JSON.stringify(exportData, null, 2)
}

export function downloadWorkspaceFile(json: string): void {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `nexora-workspace-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export interface ImportValidationResult {
  valid: boolean
  error?: string
  data?: WorkspaceExport
  summary?: {
    tasks: number
    projects: number
    goals: number
    habits: number
    timeline: number
    focusSessions: number
  }
}

export function validateImportFile(json: string): ImportValidationResult {
  try {
    const data = JSON.parse(json) as WorkspaceExport
    
    if (!data.version || typeof data.version !== 'number') {
      return { valid: false, error: 'Invalid file: missing version number.' }
    }
    
    if (data.version > CURRENT_SCHEMA_VERSION) {
      return { valid: false, error: `This file was exported from a newer version of Nexora (v${data.version}). Please update Nexora first.` }
    }
    
    if (!data.exportedAt || typeof data.exportedAt !== 'string') {
      return { valid: false, error: 'Invalid file: missing export timestamp.' }
    }
    
    // Validate arrays
    const requiredArrays: (keyof WorkspaceExport)[] = ['tasks', 'projects', 'goals', 'habits']
    for (const key of requiredArrays) {
      if (data[key] !== undefined && !Array.isArray(data[key])) {
        return { valid: false, error: `Invalid file: "${key}" must be an array.` }
      }
    }
    
    // Validate individual items have IDs
    const allArrays = ['tasks', 'projects', 'goals', 'habits', 'habitCompletions', 'timeline', 'focusSessions'] as const
    for (const key of allArrays) {
      const arr = data[key]
      if (Array.isArray(arr)) {
        for (const item of arr) {
          if (!item || typeof item !== 'object' || !('id' in item)) {
            return { valid: false, error: `Invalid file: items in "${key}" must have an "id" field.` }
          }
        }
      }
    }
    
    return {
      valid: true,
      data,
      summary: {
        tasks: data.tasks?.length ?? 0,
        projects: data.projects?.length ?? 0,
        goals: data.goals?.length ?? 0,
        habits: data.habits?.length ?? 0,
        timeline: data.timeline?.length ?? 0,
        focusSessions: data.focusSessions?.length ?? 0,
      }
    }
  } catch {
    return { valid: false, error: 'Invalid JSON file. Please check the file and try again.' }
  }
}

export async function importWorkspace(data: WorkspaceExport): Promise<void> {
  const importData: Record<string, unknown[]> = {
    tasks: data.tasks ?? [],
    projects: data.projects ?? [],
    goals: data.goals ?? [],
    habits: data.habits ?? [],
    habitCompletions: data.habitCompletions ?? [],
    timeline: data.timeline ?? [],
    focusSessions: data.focusSessions ?? [],
  }
  
  await importAllData(importData)
}

export async function resetWorkspace(): Promise<void> {
  await dbClearAll()
  
  // Clear localStorage stores (Zustand persisted state)
  const keysToRemove = [
    'nexora_app_state',
    'nexora_agent_config',
    'nexora_character_config',
    'nexora_guest_tasks',
    'nexora_guest_projects',
    'nexora_guest_goals',
    'nexora_guest_habits',
    'nexora_guest_timeline',
    'nexora-focus-storage',
    'nexora-sync-queue',
    'nexora_ui_prefs',
    'nexora_guest_name',
    'nexora_idb_migrated',
  ]
  
  for (const key of keysToRemove) {
    localStorage.removeItem(key)
  }
}
