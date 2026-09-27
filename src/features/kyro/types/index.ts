export interface TaskInput {
  id: string
  title: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  estimatedMinutes: number
  dueDate: string | null
  isUrgent?: boolean
  isImportant?: boolean
  isScheduledForToday?: boolean
  projectId?: string | null
}

export interface TimetableSlotInput {
  id: string
  label: string
  dayOfWeek: number // 0 = Sun, 1 = Mon, ..., 6 = Sat
  startTime: string // "HH:MM:SS" or "HH:MM"
  endTime: string // "HH:MM:SS" or "HH:MM"
  color?: string
}

export interface HabitInput {
  id: string
  name: string
  frequency: string
}

export interface CalendarEventInput {
  id: string
  title: string
  startTime: string
  endTime: string
}

export interface KyroContext {
  tasks: TaskInput[]
  habits: HabitInput[]
  calendarEvents: CalendarEventInput[]
  timetableSlots?: TimetableSlotInput[]
}

export interface BankruptcyDiagnostic {
  isBankrupt: boolean
  totalRequiredMinutes: number
  totalAvailableMinutes: number
  deficitMinutes: number
  fittingTasks: TaskInput[]
  overflowTasks: TaskInput[]
  reason: string
}
