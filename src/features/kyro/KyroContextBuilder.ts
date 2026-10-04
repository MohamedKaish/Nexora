import { format } from 'date-fns'
import {
  LocalTask,
  LocalHabit,
  LocalHabitCompletion,
  LocalGoal,
  LocalProject,
  LocalFocusSession,
  LocalTimetableSlot,
} from '@/types/local'

export interface StructuredNexoraContext {
  systemMetadata: {
    appName: string
    currentDate: string
    currentTime: string
    dayOfWeek: string
    userName: string
    agentName: string
    creatureArchetype: string
  }
  tasks: {
    todayCount: number
    activeCount: number
    overdueCount: number
    completedTodayCount: number
    urgentTasks: Array<{ id: string; title: string; priority: string; dueDate?: string | null }>
    nextTasks: Array<{ id: string; title: string; priority: string }>
  }
  habits: {
    total: number
    completedToday: number
    pendingToday: Array<{ id: string; name: string; streak: number }>
    bestStreak: number
  }
  goals: Array<{
    id: string
    title: string
    progress: number
    periodEnd: string
    status: string
  }>
  projects: Array<{
    id: string
    name: string
    status: string
  }>
  focus: {
    isSessionActive: boolean
    todayMinutes: number
    totalSessionsCount: number
  }
  timetable: {
    todaySlots: Array<{
      id: string
      title: string
      startTime: string
      endTime: string
      category: string
    }>
  }
}

export interface RawContextInputs {
  userName: string
  agentName: string
  creatureArchetype: string
  tasks: LocalTask[]
  habits: LocalHabit[]
  completions: LocalHabitCompletion[]
  goals: LocalGoal[]
  projects: LocalProject[]
  focusSessions: LocalFocusSession[]
  isFocusRunning: boolean
  timetableSlots: LocalTimetableSlot[]
}

/**
 * Builds a structured, compact context summary of the user's Nexora habitat.
 * Formats priorities, streaks, schedules and overdue states without raw DB bloat.
 */
export function buildKyroContext(inputs: RawContextInputs): StructuredNexoraContext {
  const now = new Date()
  const todayStr = format(now, 'yyyy-MM-dd')
  const currentDayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, etc.

  // ── TASKS ──
  const activeTasks = inputs.tasks.filter((t) => t.status !== 'done')
  const completedToday = inputs.tasks.filter(
    (t) => t.status === 'done' && t.updatedAt?.startsWith(todayStr)
  )
  const overdueTasks = activeTasks.filter(
    (t) => t.dueDate && t.dueDate < todayStr
  )
  const urgentTasks = activeTasks.filter(
    (t) => t.priority === 'urgent' || t.priority === 'high'
  )

  // ── HABITS ──
  const todayCompletedHabitIds = new Set(
    inputs.completions
      .filter((c) => c.completedDate === todayStr)
      .map((c) => c.habitId)
  )
  const pendingHabits = inputs.habits.filter(
    (h) => !todayCompletedHabitIds.has(h.id)
  )
  const maxStreak = Math.max(...inputs.habits.map((h) => h.streak), 0)

  // ── FOCUS ──
  const todaySessions = inputs.focusSessions.filter((s) =>
    s.completedAt?.startsWith(todayStr)
  )
  const todayMinutes = Math.round(
    todaySessions.reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0) / 60
  )

  // ── TIMETABLE ──
  const todaySlots = inputs.timetableSlots
    .filter((s) => s.dayOfWeek === currentDayOfWeek)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .map((s) => ({
      id: s.id,
      title: s.title,
      startTime: s.startTime,
      endTime: s.endTime,
      category: s.category || 'General',
    }))

  return {
    systemMetadata: {
      appName: 'Nexora',
      currentDate: format(now, 'yyyy-MM-dd'),
      currentTime: format(now, 'HH:mm'),
      dayOfWeek: format(now, 'EEEE'),
      userName: inputs.userName || 'Explorer',
      agentName: inputs.agentName || 'Kyro',
      creatureArchetype: inputs.creatureArchetype || 'nyxen',
    },
    tasks: {
      todayCount: activeTasks.length,
      activeCount: activeTasks.length,
      overdueCount: overdueTasks.length,
      completedTodayCount: completedToday.length,
      urgentTasks: urgentTasks.slice(0, 4).map((t) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        dueDate: t.dueDate,
      })),
      nextTasks: activeTasks.slice(0, 4).map((t) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
      })),
    },
    habits: {
      total: inputs.habits.length,
      completedToday: todayCompletedHabitIds.size,
      pendingToday: pendingHabits.slice(0, 4).map((h) => ({
        id: h.id,
        name: h.name,
        streak: h.streak,
      })),
      bestStreak: maxStreak,
    },
    goals: inputs.goals.filter((g) => g.status === 'active').slice(0, 3).map((g) => ({
      id: g.id,
      title: g.title,
      progress: g.progress,
      periodEnd: g.periodEnd,
      status: g.status,
    })),
    projects: inputs.projects.filter((p) => p.status === 'active').slice(0, 3).map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
    })),
    focus: {
      isSessionActive: inputs.isFocusRunning,
      todayMinutes,
      totalSessionsCount: inputs.focusSessions.length,
    },
    timetable: {
      todaySlots,
    },
  }
}
