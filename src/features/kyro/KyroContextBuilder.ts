import {
  NEXORA_ALLOWED_ROUTES,
  type LocalTask,
  type LocalHabit,
  type LocalHabitCompletion,
  type LocalGoal,
  type LocalProject,
  type LocalFocusSession,
} from '@/types/local'
import { useTimelineStore, type TimetableSlot } from '@/store/timelineStore'
import { useTaskStore } from '@/store/useTaskStore'
import { useHabitStore } from '@/store/useHabitStore'
import { useGoalStore } from '@/store/useGoalStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useFocusStore } from '@/store/useFocusStore'
import { useHydrationStore } from '@/store/useHydrationStore'
import { useFinanceStore, formatCurrency } from '@/store/useFinanceStore'
import { useNoteStore, type TacticalNote } from '@/store/useNoteStore'
import { useAppStore } from '@/store/appStore'
import { useCharacterStore } from '@/store/characterStore'
import { format, isBefore, startOfDay, parseISO } from 'date-fns'

export interface StructuredHydrationContext {
  available: boolean
  consumedMl: number | null
  dailyGoalMl: number | null
  remainingMl: number | null
  completionPercentage: number | null
  preferredUnit: 'ml' | 'oz' | null
  remindersEnabled: boolean | null
}

export interface StructuredFinanceContext {
  available: boolean
  hasActivityOrBalances: boolean
  defaultCurrency: string | null
  totalBalanceFormatted: string | null
  spentTodayFormatted: string | null
  incomeTodayFormatted: string | null
  walletsSummary: Array<{
    name: string
    currency: string
    balanceFormatted: string
  }>
}

export interface StructuredNotesRemindersContext {
  available: boolean
  totalNotes: number
  pinnedNotesCount: number
  pendingRemindersCount: number
  upcomingNoteReminders: Array<{
    id: string
    title: string
    remindAt: string
    priority: string
  }>
  scheduledTaskReminders: Array<{
    id: string
    title: string
    dueDate: string | null
    reminderTime: string
    priority: string
  }>
  recentNotes: Array<{
    id: string
    title: string
    priority: string
    isPinned: boolean
  }>
}

export interface StructuredNexoraContext {
  systemMetadata: {
    userName: string
    agentName: string
    creatureArchetype: string
    currentDate: string
    currentDayOfWeek: string
    currentTime: string
  }
  tasks: {
    available: boolean
    totalActive: number
    urgentCount: number
    overdueCount: number
    completedTodayCount: number
    topPriorityTasks: Array<{
      id: string
      title: string
      priority: string
      status: string
      dueDate: string | null
      dueTime?: string | null
      reminderTime?: string | null
    }>
    dueTodayTasks: Array<{
      id: string
      title: string
      priority: string
      status: string
      dueTime?: string | null
      reminderTime?: string | null
    }>
  }
  habits: {
    available: boolean
    totalHabits: number
    completedTodayCount: number
    pendingTodayCount: number
    activeStreaks: Array<{ name: string; streak: number }>
    pendingHabitsToday: string[]
  }
  hydration: StructuredHydrationContext
  finance: StructuredFinanceContext
  notesAndReminders: StructuredNotesRemindersContext
  goals: {
    available: boolean
    activeCount: number
    mainGoals: Array<{ title: string; progress: number; type: string }>
  }
  projects: {
    available: boolean
    totalProjects: number
    projectList: Array<{ name: string; id: string }>
  }
  focus: {
    available: boolean
    sessionsCompletedToday: number
    totalFocusMinutesToday: number
    isFocusTimerRunning: boolean
    activeMode: string
  }
  timetable: {
    available: boolean
    todaySchedule: Array<{ time: string; title: string; category: string }>
  }
  navigation: {
    allowedRoutes: Array<{ path: string; description: string }>
  }
}

export interface RawContextInputs {
  userName?: string
  agentName?: string
  creatureArchetype?: string
  tasks?: LocalTask[] | null
  habits?: LocalHabit[] | null
  completions?: LocalHabitCompletion[] | null
  goals?: LocalGoal[] | null
  projects?: LocalProject[] | null
  focusSessions?: LocalFocusSession[] | null
  isFocusRunning?: boolean
  focusMode?: string
  timetableSlots?: TimetableSlot[] | null
  hydration?: {
    consumedTodayMl: number
    targetHydrationMl: number
    remainingMl: number
    completionPercentage: number
    preferredUnit?: 'ml' | 'oz'
    remindersEnabled?: boolean
  } | null
  finance?: {
    defaultCurrency: string
    hasActivityOrBalances: boolean
    totalBalanceFormatted: string | null
    spentTodayFormatted: string | null
    incomeTodayFormatted: string | null
    walletsSummary: Array<{
      name: string
      currency: string
      balanceFormatted: string
    }>
  } | null
  notes?: TacticalNote[] | null
}

/**
 * Transforms Nexora Zustand stores into a single, clean, verified JSON context
 * for the Kyro AI Companion. Missing or unconfigured domains are marked honestly
 * (`available: false` or `hasActivityOrBalances: false`) and never filled with fake defaults.
 */
export class KyroContextBuilder {
  static collectLiveStoreInputs(overrides?: Partial<RawContextInputs>): RawContextInputs {
    const appState = useAppStore.getState()
    const charState = useCharacterStore.getState()
    const taskState = useTaskStore.getState()
    const habitState = useHabitStore.getState()
    const goalState = useGoalStore.getState()
    const projectState = useProjectStore.getState()
    const focusState = useFocusStore.getState()
    const timelineState = useTimelineStore.getState()
    const hydrationState = useHydrationStore.getState()
    const financeState = useFinanceStore.getState()
    const noteState = useNoteStore.getState()

    // Hydration snapshot
    let hydrationSnapshot: RawContextInputs['hydration'] = null
    try {
      const calc = hydrationState.calculateCircadianTarget()
      hydrationSnapshot = {
        consumedTodayMl: calc.consumedTodayMl,
        targetHydrationMl: calc.targetHydrationMl,
        remainingMl: calc.remainingMl,
        completionPercentage: calc.completionPercentage,
        preferredUnit: hydrationState.preferredUnit || 'ml',
        remindersEnabled: Boolean(hydrationState.reminderConfig?.enabled),
      }
    } catch {
      hydrationSnapshot = null
    }

    // Finance snapshot (only existing valid summary data; never fabricate balances)
    let financeSnapshot: RawContextInputs['finance'] = null
    try {
      const walletsWithBalances = financeState.getWalletsWithBalances()
      const activeWallets = walletsWithBalances.filter((w) => !w.archived)
      const hasOpeningBalances = activeWallets.some((w) => w.openingBalance !== 0 || w.currentBalance !== 0)
      const hasTransactions = financeState.transactions.length > 0
      const hasActivityOrBalances = hasOpeningBalances || hasTransactions
      const defaultCurrency = financeState.defaultCurrency || 'INR'
      const dailySummaries = financeState.getSummaryByCurrency('daily')
      const primarySummary = dailySummaries[defaultCurrency]

      financeSnapshot = {
        defaultCurrency,
        hasActivityOrBalances,
        totalBalanceFormatted: hasActivityOrBalances && primarySummary
          ? formatCurrency(primarySummary.closingBalance, defaultCurrency)
          : null,
        spentTodayFormatted: hasActivityOrBalances && primarySummary
          ? formatCurrency(primarySummary.totalExpenses, defaultCurrency)
          : null,
        incomeTodayFormatted: hasActivityOrBalances && primarySummary
          ? formatCurrency(primarySummary.totalIncome, defaultCurrency)
          : null,
        walletsSummary: hasActivityOrBalances
          ? activeWallets.slice(0, 5).map((w) => ({
              name: w.name,
              currency: w.currency,
              balanceFormatted: formatCurrency(w.currentBalance, w.currency),
            }))
          : [],
      }
    } catch {
      financeSnapshot = null
    }

    return {
      userName: appState.preferences?.displayName || 'Explorer',
      agentName: appState.agentConfig?.name || 'Kyro',
      creatureArchetype: charState.config?.archetype || 'nyxen',
      tasks: taskState.tasks,
      habits: habitState.habits,
      completions: habitState.completions,
      goals: goalState.goals,
      projects: projectState.projects,
      focusSessions: focusState.sessions,
      isFocusRunning: focusState.isRunning,
      focusMode: focusState.mode,
      timetableSlots: timelineState.slots,
      hydration: hydrationSnapshot,
      finance: financeSnapshot,
      notes: noteState.notes,
      ...overrides,
    }
  }

  static buildContext(inputs: RawContextInputs): StructuredNexoraContext {
    const now = new Date()
    const todayStr = format(now, 'yyyy-MM-dd')
    const todayStart = startOfDay(now)
    const dayOfWeekIndex = now.getDay()

    // 1. Tasks Analysis
    const tasksAvailable = Array.isArray(inputs.tasks)
    const rawTasks = tasksAvailable ? inputs.tasks! : []
    const activeTasks = rawTasks.filter((t) => t.status !== 'done')
    const urgentTasks = activeTasks.filter(
      (t) => t.priority === 'urgent' || t.priority === 'high'
    )

    const overdueTasks = activeTasks.filter((t) => {
      if (!t.dueDate) return false
      try {
        return isBefore(parseISO(t.dueDate), todayStart)
      } catch {
        return false
      }
    })

    const dueTodayTasks = activeTasks
      .filter((t) => t.dueDate === todayStr)
      .slice(0, 6)
      .map((t) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        status: t.status,
        dueTime: t.dueTime ?? null,
        reminderTime: t.reminderTime ?? null,
      }))

    const completedTodayCount = rawTasks.filter(
      (t) => t.status === 'done' && t.updatedAt.startsWith(todayStr)
    ).length

    const priorityWeight: Record<string, number> = {
      urgent: 4,
      high: 3,
      medium: 2,
      low: 1,
    }

    const sortedTopTasks = [...activeTasks]
      .sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0))
      .slice(0, 6)
      .map((t) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        status: t.status,
        dueDate: t.dueDate,
        dueTime: t.dueTime ?? null,
        reminderTime: t.reminderTime ?? null,
      }))

    // 2. Habits Analysis
    const habitsAvailable = Array.isArray(inputs.habits) && Array.isArray(inputs.completions)
    const rawHabits = habitsAvailable ? inputs.habits! : []
    const rawCompletions = habitsAvailable ? inputs.completions! : []

    const completedHabitIdsToday = new Set(
      rawCompletions
        .filter((c) => c.completedDate === todayStr)
        .map((c) => c.habitId)
    )

    const pendingHabitsToday = rawHabits
      .filter((h) => !completedHabitIdsToday.has(h.id))
      .map((h) => h.name)

    const activeStreaks = rawHabits
      .filter((h) => h.streak > 0)
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 5)
      .map((h) => ({ name: h.name, streak: h.streak }))

    // 3. Hydration Analysis
    const hydration: StructuredHydrationContext = inputs.hydration
      ? {
          available: true,
          consumedMl: inputs.hydration.consumedTodayMl,
          dailyGoalMl: inputs.hydration.targetHydrationMl,
          remainingMl: inputs.hydration.remainingMl,
          completionPercentage: inputs.hydration.completionPercentage,
          preferredUnit: inputs.hydration.preferredUnit ?? 'ml',
          remindersEnabled: inputs.hydration.remindersEnabled ?? null,
        }
      : {
          available: false,
          consumedMl: null,
          dailyGoalMl: null,
          remainingMl: null,
          completionPercentage: null,
          preferredUnit: null,
          remindersEnabled: null,
        }

    // 4. Finance Analysis
    const finance: StructuredFinanceContext = inputs.finance
      ? {
          available: true,
          hasActivityOrBalances: inputs.finance.hasActivityOrBalances,
          defaultCurrency: inputs.finance.defaultCurrency,
          totalBalanceFormatted: inputs.finance.totalBalanceFormatted,
          spentTodayFormatted: inputs.finance.spentTodayFormatted,
          incomeTodayFormatted: inputs.finance.incomeTodayFormatted,
          walletsSummary: inputs.finance.walletsSummary,
        }
      : {
          available: false,
          hasActivityOrBalances: false,
          defaultCurrency: null,
          totalBalanceFormatted: null,
          spentTodayFormatted: null,
          incomeTodayFormatted: null,
          walletsSummary: [],
        }

    // 5. Notes & Reminders Analysis
    const notesAvailable = Array.isArray(inputs.notes)
    const rawNotes = notesAvailable ? inputs.notes! : []
    const upcomingNoteReminders = rawNotes
      .filter((n) => Boolean(n.remindAt) && !n.reminderFired)
      .slice(0, 5)
      .map((n) => ({
        id: n.id,
        title: n.title,
        remindAt: n.remindAt!,
        priority: n.priority,
      }))

    const scheduledTaskReminders = activeTasks
      .filter((t) => Boolean(t.enableReminder && t.reminderTime))
      .slice(0, 5)
      .map((t) => ({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate,
        reminderTime: t.reminderTime!,
        priority: t.priority,
      }))

    const notesAndReminders: StructuredNotesRemindersContext = {
      available: notesAvailable || tasksAvailable,
      totalNotes: rawNotes.length,
      pinnedNotesCount: rawNotes.filter((n) => n.isPinned).length,
      pendingRemindersCount: upcomingNoteReminders.length + scheduledTaskReminders.length,
      upcomingNoteReminders,
      scheduledTaskReminders,
      recentNotes: rawNotes.slice(0, 5).map((n) => ({
        id: n.id,
        title: n.title,
        priority: n.priority,
        isPinned: n.isPinned,
      })),
    }

    // 6. Focus Sessions Today
    const focusAvailable = Array.isArray(inputs.focusSessions)
    const rawFocusSessions = focusAvailable ? inputs.focusSessions! : []
    const todayFocusSessions = rawFocusSessions.filter((s) =>
      s.completedAt.startsWith(todayStr)
    )
    const totalFocusMinutesToday = Math.round(
      todayFocusSessions.reduce((acc, s) => acc + s.durationSeconds, 0) / 60
    )

    // 7. Timetable for Today
    const timetableAvailable = Array.isArray(inputs.timetableSlots)
    const rawSlots = timetableAvailable ? inputs.timetableSlots! : []
    const todaySchedule = rawSlots
      .filter((s) => s.dayOfWeek === dayOfWeekIndex)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .slice(0, 8)
      .map((s) => ({
        time: `${s.startTime} - ${s.endTime}`,
        title: s.title,
        category: s.category,
      }))

    // 8. Allowed Navigation Routes
    const allowedRoutes = Object.entries(NEXORA_ALLOWED_ROUTES).map(([path, description]) => ({
      path,
      description,
    }))

    return {
      systemMetadata: {
        userName: inputs.userName || 'Explorer',
        agentName: inputs.agentName || 'Kyro',
        creatureArchetype: inputs.creatureArchetype || 'nyxen',
        currentDate: todayStr,
        currentDayOfWeek: format(now, 'EEEE'),
        currentTime: format(now, 'HH:mm'),
      },
      tasks: {
        available: tasksAvailable,
        totalActive: activeTasks.length,
        urgentCount: urgentTasks.length,
        overdueCount: overdueTasks.length,
        completedTodayCount,
        topPriorityTasks: sortedTopTasks,
        dueTodayTasks,
      },
      habits: {
        available: habitsAvailable,
        totalHabits: rawHabits.length,
        completedTodayCount: completedHabitIdsToday.size,
        pendingTodayCount: pendingHabitsToday.length,
        activeStreaks,
        pendingHabitsToday: pendingHabitsToday.slice(0, 6),
      },
      hydration,
      finance,
      notesAndReminders,
      goals: {
        available: Array.isArray(inputs.goals),
        activeCount: Array.isArray(inputs.goals) ? inputs.goals.length : 0,
        mainGoals: Array.isArray(inputs.goals)
          ? inputs.goals.slice(0, 4).map((g) => ({
              title: g.title,
              progress: g.progress,
              type: g.type,
            }))
          : [],
      },
      projects: {
        available: Array.isArray(inputs.projects),
        totalProjects: Array.isArray(inputs.projects) ? inputs.projects.length : 0,
        projectList: Array.isArray(inputs.projects)
          ? inputs.projects.slice(0, 5).map((p) => ({
              name: p.name,
              id: p.id,
            }))
          : [],
      },
      focus: {
        available: focusAvailable,
        sessionsCompletedToday: todayFocusSessions.length,
        totalFocusMinutesToday,
        isFocusTimerRunning: Boolean(inputs.isFocusRunning),
        activeMode: inputs.focusMode || 'pomodoro',
      },
      timetable: {
        available: timetableAvailable,
        todaySchedule,
      },
      navigation: {
        allowedRoutes,
      },
    }
  }
}
