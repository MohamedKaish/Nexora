/**
 * Local-first data types for Nexora.
 * These are independent of Supabase database types.
 * They represent the canonical shape of data in IndexedDB and Zustand stores.
 */

// ─── Core Entity Base ───

export interface LocalEntity {
  id: string
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

// ─── Task ───

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'todo' | 'in_progress' | 'done'

export interface LocalTask extends LocalEntity {
  title: string
  description: string | null
  priority: TaskPriority
  status: TaskStatus
  projectId: string | null
  dueDate: string | null
  isScheduleForToday: boolean
  isUrgent: boolean
  isImportant: boolean
  estimatedTimeMinutes: number | null
  actualTimeMinutes: number
  recurrenceRule: string | null
  // For cloud sync mapping
  userId?: string
}

// ─── Subtask ───

export interface LocalSubtask extends LocalEntity {
  taskId: string
  title: string
  isCompleted: boolean
}

// ─── Project ───

export type ProjectStatus = 'active' | 'archived' | 'completed'

export interface LocalProject extends LocalEntity {
  name: string
  description: string | null
  color: string
  status: ProjectStatus
  dueDate: string | null
  categoryId?: string | null
  userId?: string
}

// ─── Goal ───

export type GoalType = 'daily' | 'weekly' | 'monthly'
export type GoalStatus = 'active' | 'completed' | 'failed'

export interface LocalGoal extends LocalEntity {
  title: string
  type: GoalType
  status: GoalStatus
  periodStart: string
  periodEnd: string
  progress?: number
  milestones?: GoalMilestone[]
  userId?: string
}

export interface GoalMilestone {
  id: string
  title: string
  isCompleted: boolean
}

// ─── Habit ───

export type HabitFrequency = 'daily' | 'weekly' | 'weekdays'

export interface LocalHabit extends LocalEntity {
  name: string
  frequency: HabitFrequency
  color: string
  streak: number
  recurrenceRule: string | null
  userId?: string
}

export interface LocalHabitCompletion {
  id: string
  habitId: string
  completedDate: string
  createdAt: string
}

// ─── Timeline Block ───

export interface LocalTimelineBlock extends LocalEntity {
  type: string
  blockType: string
  refId: string | null
  title: string
  startTime: string
  endTime: string
  isFixed: boolean
  score: number
  userId?: string
}

// ─── Focus Session ───

export type FocusMode = 'pomodoro' | 'short_break' | 'long_break' | 'deep_work' | 'stopwatch' | 'custom'

export interface LocalFocusSession {
  id: string
  mode: FocusMode
  duration: number
  taskId?: string | null
  completedAt: string
}

// ─── Agent Configuration ───

export type AgentPersonality = 'professional' | 'friendly' | 'calm' | 'energetic' | 'minimal' | 'motivational' | 'loyal'

export interface AgentConfig {
  id: string
  name: string
  personality: AgentPersonality
  tone: string
  isEnabled: boolean
  schedulingPreference: 'balanced' | 'aggressive' | 'relaxed'
  createdAt: string
  updatedAt: string
}

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  id: 'default-agent',
  name: 'Nexora',
  personality: 'friendly',
  tone: 'encouraging',
  isEnabled: true,
  schedulingPreference: 'balanced',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

// ─── Character Configuration ───

export interface CharacterConfig {
  id: string
  body: string
  hair: string
  hairColor: string
  face: string
  outfit: string
  outfitColor: string
  accessory: string
  glasses: string
  expression: string
  isCompanionEnabled: boolean
  isReducedMotion: boolean
  createdAt: string
  updatedAt: string
}

export const DEFAULT_CHARACTER_CONFIG: CharacterConfig = {
  id: 'default-character',
  body: 'boy',
  hair: 'short_01',
  hairColor: '#1C1917',
  face: 'face_01',
  outfit: 'casual_01',
  outfitColor: '#6366F1',
  accessory: 'none',
  glasses: 'none',
  expression: 'neutral',
  isCompanionEnabled: true,
  isReducedMotion: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

// ─── User Preferences (stored in localStorage) ───

export interface LocalPreferences {
  displayName: string
  theme: 'light' | 'dark' | 'system'
  accentColor: string
  onboardingComplete: boolean
  agentName: string
  sidebarCollapsed: boolean
  language: string
  pomodoroDuration: number
  shortBreakDuration: number
  longBreakDuration: number
}

export const DEFAULT_PREFERENCES: LocalPreferences = {
  displayName: '',
  theme: 'dark',
  accentColor: '#6366F1',
  onboardingComplete: false,
  agentName: 'Nexora',
  sidebarCollapsed: false,
  language: 'en',
  pomodoroDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
}

// ─── Workspace Export Format ───

export interface WorkspaceExport {
  version: number
  exportedAt: string
  appVersion: string
  tasks: LocalTask[]
  projects: LocalProject[]
  goals: LocalGoal[]
  habits: LocalHabit[]
  habitCompletions: LocalHabitCompletion[]
  timeline: LocalTimelineBlock[]
  focusSessions: LocalFocusSession[]
  agentConfig: AgentConfig
  characterConfig: CharacterConfig
  preferences: LocalPreferences
}

// ─── App Mode ───

export type AppMode = 'guest' | 'authenticated' | 'syncing' | 'offline'

// ─── Utility Functions ───

export function createLocalId(): string {
  return crypto.randomUUID()
}

export function nowISO(): string {
  return new Date().toISOString()
}

export function createLocalTask(partial: Partial<LocalTask> & { title: string }): LocalTask {
  const now = nowISO()
  return {
    id: createLocalId(),
    title: partial.title,
    description: partial.description ?? null,
    priority: partial.priority ?? 'medium',
    status: partial.status ?? 'todo',
    projectId: partial.projectId ?? null,
    dueDate: partial.dueDate ?? null,
    isScheduleForToday: partial.isScheduleForToday ?? false,
    isUrgent: partial.isUrgent ?? false,
    isImportant: partial.isImportant ?? false,
    estimatedTimeMinutes: partial.estimatedTimeMinutes ?? null,
    actualTimeMinutes: partial.actualTimeMinutes ?? 0,
    recurrenceRule: partial.recurrenceRule ?? null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }
}

export function createLocalProject(partial: Partial<LocalProject> & { name: string }): LocalProject {
  const now = nowISO()
  return {
    id: createLocalId(),
    name: partial.name,
    description: partial.description ?? null,
    color: partial.color ?? '#6366F1',
    status: partial.status ?? 'active',
    dueDate: partial.dueDate ?? null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }
}

export function createLocalGoal(partial: Partial<LocalGoal> & { title: string; periodStart: string; periodEnd: string }): LocalGoal {
  const now = nowISO()
  return {
    id: createLocalId(),
    title: partial.title,
    type: partial.type ?? 'weekly',
    status: partial.status ?? 'active',
    periodStart: partial.periodStart,
    periodEnd: partial.periodEnd,
    progress: partial.progress ?? 0,
    milestones: partial.milestones ?? [],
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }
}

export function createLocalHabit(partial: Partial<LocalHabit> & { name: string }): LocalHabit {
  const now = nowISO()
  return {
    id: createLocalId(),
    name: partial.name,
    frequency: partial.frequency ?? 'daily',
    color: partial.color ?? '#10B981',
    streak: partial.streak ?? 0,
    recurrenceRule: partial.recurrenceRule ?? null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }
}
