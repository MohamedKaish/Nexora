/**
 * Local-first canonical data types for Nexora.
 */

export interface LocalEntity {
  id: string
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskTimeframe = 'daily' | 'weekly' | 'monthly' | 'none'

export interface LocalTask extends LocalEntity {
  title: string
  description: string | null
  priority: TaskPriority
  status: TaskStatus
  timeframe?: TaskTimeframe
  projectId: string | null
  dueDate: string | null
  isScheduleForToday?: boolean
  estimatedTimeMinutes?: number | null
  actualTimeMinutes?: number
}

export interface LocalSubtask extends LocalEntity {
  taskId: string
  title: string
  isCompleted: boolean
}

export type ProjectStatus = 'active' | 'archived' | 'completed'

export interface LocalProject extends LocalEntity {
  name: string
  description: string | null
  color: string
  status: ProjectStatus
  dueDate: string | null
}

export type GoalType = 'daily' | 'weekly' | 'monthly'
export type GoalStatus = 'active' | 'completed' | 'failed'

export interface LocalGoal extends LocalEntity {
  title: string
  type: GoalType
  status: GoalStatus
  periodStart: string
  periodEnd: string
  progress: number
}

export type HabitFrequency = 'daily' | 'weekly' | 'weekdays'

export interface LocalHabit extends LocalEntity {
  name: string
  description?: string | null
  frequency: HabitFrequency
  color: string
  streak: number
}

export interface LocalHabitCompletion {
  id: string
  habitId: string
  completedDate: string // YYYY-MM-DD
  createdAt?: string
}

export interface LocalTimetableSlot extends LocalEntity {
  dayOfWeek: number // 0 = Sun, 1 = Mon ...
  startTime: string // HH:mm
  endTime: string   // HH:mm
  title: string
  category: string  // Work, Study, Health, Personal
  color: string
}

export type FocusMode = 'pomodoro' | 'short_break' | 'long_break' | 'deep_work' | 'stopwatch'

export interface LocalFocusSession {
  id: string
  mode: FocusMode
  durationSeconds: number
  completedAt: string
}

export type CompanionArchetype =
  | 'nyxen'
  | 'aerix'
  | 'vayron'
  | 'skyr'
  | 'frostwing'
  | 'aegis'
  | 'custom'

export type CompanionMood =
  | 'idle'
  | 'greeting'
  | 'happy'
  | 'celebrating'
  | 'thinking'
  | 'focused'
  | 'tired'
  | 'sleeping'
  | 'surprised'
  | 'encouraging'
  | 'listening'
  | 'speaking'

export interface CharacterConfig {
  id?: string
  name?: string
  archetype: CompanionArchetype
  body?: string
  hair?: string
  hairColor?: string
  outfit?: string
  outfitColor?: string
  accessory?: string
  glasses?: string
  expression?: string
  mood: CompanionMood
  isCompanionEnabled?: boolean
  isReducedMotion?: boolean
  updatedAt?: string
}

export const DEFAULT_CHARACTER_CONFIG: CharacterConfig = {
  id: 'default-character',
  name: 'Kyro',
  archetype: 'nyxen',
  body: 'sleek',
  hair: 'sleek_crest',
  hairColor: '#38BDF8',
  outfit: 'shadow_sprint',
  outfitColor: '#1E1B4B',
  accessory: 'none',
  glasses: 'none',
  expression: 'attentive',
  mood: 'idle',
  isCompanionEnabled: true,
  isReducedMotion: false,
  updatedAt: new Date().toISOString(),
}

export type AgentPersonality = 'friendly' | 'calm' | 'energetic' | 'professional' | 'minimal' | 'motivational'

export interface AgentConfig {
  name: string
  personality: AgentPersonality
  tone: string
}

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  name: 'Kyro',
  personality: 'friendly',
  tone: 'Encouraging & concise',
}

export interface LocalPreferences {
  displayName: string
  dateOfBirth?: string
  gender?: 'male' | 'female' | 'non-binary' | 'other' | 'prefer-not-to-say' | string
  title?: string
  bio?: string
  avatarUrl?: string
  theme: 'dark' | 'light' | 'system'
  onboardingComplete: boolean
  pomodoroDuration: number
  shortBreakDuration: number
  longBreakDuration: number
}

export const DEFAULT_PREFERENCES: LocalPreferences = {
  displayName: 'Explorer',
  dateOfBirth: '',
  gender: 'prefer-not-to-say',
  title: 'Sanctuary Pioneer',
  bio: 'Navigating daily quests and mastering focus inside the Nexora habitat.',
  avatarUrl: '',
  theme: 'dark',
  onboardingComplete: false,
  pomodoroDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
}

// ─── Kyro AI Conversation & Action Types ───
export interface KyroMessage {
  id: string
  sender: 'user' | 'kyro'
  text: string
  timestamp: string
  proposedAction?: KyroProposedAction
}

export interface KyroProposedAction {
  id: string
  type: string
  label: string
  payload: Record<string, unknown>
  isExecuted?: boolean
}
