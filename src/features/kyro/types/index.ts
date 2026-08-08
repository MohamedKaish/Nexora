export interface TaskInput {
  id: string
  title: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  estimatedMinutes: number
  dueDate: string | null
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
}
