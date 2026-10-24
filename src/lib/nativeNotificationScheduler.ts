import type { LocalTask, LocalHabit } from '@/types/local'
import type { HydrationReminderConfig } from '@/store/useHydrationStore'
import type { ExpenseReminderConfig, CurrencyCode } from '@/store/useFinanceStore'

export type NotificationChannelId =
  | 'nexora_tasks'
  | 'nexora_habits'
  | 'nexora_hydration'
  | 'nexora_expenses'

export interface NotificationChannelMeta {
  id: NotificationChannelId
  name: string
  description: string
  importance: 'high' | 'default'
}

export const NEXORA_NOTIFICATION_CHANNELS: Record<
  NotificationChannelId,
  NotificationChannelMeta
> = {
  nexora_tasks: {
    id: 'nexora_tasks',
    name: 'Task Reminders',
    description: 'Scheduled task reminders, due alerts, and high-priority deadlines',
    importance: 'high',
  },
  nexora_habits: {
    id: 'nexora_habits',
    name: 'Habit Reminders',
    description: 'Scheduled daily and weekday habit time windows',
    importance: 'high',
  },
  nexora_hydration: {
    id: 'nexora_hydration',
    name: 'Hydration Reminders',
    description: 'Periodic water intake reminders during active waking hours',
    importance: 'default',
  },
  nexora_expenses: {
    id: 'nexora_expenses',
    name: 'Expense Reminders',
    description: 'Daily cash-flow and expense logging reminders',
    importance: 'default',
  },
}

export const NOTIFICATION_CHANNELS: NotificationChannelMeta[] = Object.values(
  NEXORA_NOTIFICATION_CHANNELS
)

export interface ScheduledAlarmSpec {
  id: string
  title: string
  body: string
  triggerAtMs: number
  channelId: NotificationChannelId
  targetUrl: string
  category: 'task' | 'habit' | 'hydration' | 'expense'
  sourceType: 'task' | 'habit' | 'hydration' | 'expense'
  sourceId: string
  enabled: boolean
  repeatPattern?: 'once' | 'daily' | 'weekdays' | 'weekly' | 'interval'
  createdAt: string
}

export type ScheduledAlarmRecord = ScheduledAlarmSpec

interface NativeBridgeWithScheduler {
  showNotification?: (title: string, message: string, tag: string) => void
  scheduleNotification?: (
    id: string,
    title: string,
    message: string,
    triggerAtMs: number,
    channelId: string,
    targetUrl: string
  ) => void
  cancelNotification?: (id: string) => void
  cancelAllNotifications?: () => void
  openAppNotificationSettings?: () => void
  hasNotificationPermission?: () => boolean
  requestNotificationPermission?: () => void
}

const ALARM_STORAGE_KEY = 'nexora_scheduled_alarms_v2'
const CHANNEL_PREF_STORAGE_KEY = 'nexora_channel_preferences_v1'

let memoryAlarmRegistry: Record<string, ScheduledAlarmSpec> = {}
let memoryChannelPrefs: Record<NotificationChannelId, boolean> = {
  nexora_tasks: true,
  nexora_habits: true,
  nexora_hydration: true,
  nexora_expenses: true,
}

export function getChannelPreferences(): Record<NotificationChannelId, boolean> {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(CHANNEL_PREF_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          memoryChannelPrefs = { ...memoryChannelPrefs, ...parsed }
        }
      }
    } catch {}
  }
  return { ...memoryChannelPrefs }
}

export function setChannelEnabled(
  channelId: NotificationChannelId,
  enabled: boolean
): void {
  const current = getChannelPreferences()
  current[channelId] = enabled
  memoryChannelPrefs = current
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(CHANNEL_PREF_STORAGE_KEY, JSON.stringify(current))
    } catch {}
  }
  if (!enabled) {
    const reg = readAlarmRegistry()
    for (const [id, spec] of Object.entries(reg)) {
      if (spec.channelId === channelId) {
        cancelNativeAlarm(id)
      }
    }
  }
}

export function isAndroidNativeApp(): boolean {
  return Boolean(getNativeBridge())
}

function readAlarmRegistry(): Record<string, ScheduledAlarmSpec> {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(ALARM_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          memoryAlarmRegistry = parsed
          return parsed
        }
      }
    } catch {}
  }
  return { ...memoryAlarmRegistry }
}

function writeAlarmRegistry(registry: Record<string, ScheduledAlarmSpec>): void {
  memoryAlarmRegistry = { ...registry }
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(ALARM_STORAGE_KEY, JSON.stringify(registry))
    } catch {}
  }
}

function getNativeBridge(): NativeBridgeWithScheduler | null {
  if (typeof window === 'undefined') return null
  return (
    (window as unknown as { NexoraNativeBridge?: NativeBridgeWithScheduler })
      .NexoraNativeBridge || null
  )
}

export function getScheduledAlarms(): ScheduledAlarmSpec[] {
  const reg = readAlarmRegistry()
  return Object.values(reg).sort((a, b) => a.triggerAtMs - b.triggerAtMs)
}

export function scheduleNativeAlarm(
  spec: Omit<ScheduledAlarmSpec, 'sourceType' | 'enabled'> & {
    sourceType?: 'task' | 'habit' | 'hydration' | 'expense'
    enabled?: boolean
  }
): ScheduledAlarmSpec | null {
  if (!spec.id || !spec.title || spec.triggerAtMs <= 0) return null

  const prefs = getChannelPreferences()
  if (prefs[spec.channelId] === false) return null

  const normalized: ScheduledAlarmSpec = {
    ...spec,
    sourceType: spec.sourceType || spec.category,
    enabled: spec.enabled ?? true,
  }

  const reg = readAlarmRegistry()
  reg[normalized.id] = normalized
  writeAlarmRegistry(reg)

  // 1. Native Android APK AlarmManager Bridge
  const bridge = getNativeBridge()
  if (bridge && typeof bridge.scheduleNotification === 'function') {
    try {
      bridge.scheduleNotification(
        normalized.id,
        normalized.title,
        normalized.body,
        Math.round(normalized.triggerAtMs),
        normalized.channelId,
        normalized.targetUrl
      )
    } catch (err) {
      console.warn('Native bridge scheduleNotification failed:', err)
    }
  }

  // 2. Capacitor LocalNotifications Plugin Bridge (if running in Capacitor Android shell)
  if (typeof window !== 'undefined') {
    const capLocalNotifs = (
      window as unknown as {
        Capacitor?: {
          Plugins?: {
            LocalNotifications?: {
              schedule: (opts: unknown) => Promise<unknown>
            }
          }
        }
      }
    ).Capacitor?.Plugins?.LocalNotifications
    if (capLocalNotifs && typeof capLocalNotifs.schedule === 'function') {
      const numericId = Math.abs(
        normalized.id
          .split('')
          .reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) | 0, 0)
      )
      capLocalNotifs
        .schedule({
          notifications: [
            {
              id: numericId,
              title: normalized.title,
              body: normalized.body,
              channelId: normalized.channelId,
              schedule: { at: new Date(normalized.triggerAtMs), allowWhileIdle: true },
              extra: { targetUrl: normalized.targetUrl, sourceId: normalized.sourceId },
            },
          ],
        })
        .catch(() => {})
    }
  }

  // 3. Service Worker TimestampTrigger & Background Timer Relay
  if (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    navigator.serviceWorker.controller
  ) {
    try {
      navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_ALARM',
        alarm: normalized,
      })
    } catch {}
  }

  return normalized
}

export function cancelNativeAlarm(alarmId: string): boolean {
  const reg = readAlarmRegistry()
  const existed = Boolean(reg[alarmId])
  delete reg[alarmId]
  writeAlarmRegistry(reg)

  const bridge = getNativeBridge()
  if (bridge && typeof bridge.cancelNotification === 'function') {
    try {
      bridge.cancelNotification(alarmId)
    } catch (err) {
      console.warn('Native bridge cancelNotification failed:', err)
    }
  }

  if (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    navigator.serviceWorker.controller
  ) {
    try {
      navigator.serviceWorker.controller.postMessage({
        type: 'CANCEL_ALARM',
        alarmId,
      })
    } catch {}
  }

  return existed
}

export function cancelAlarmsBySourceId(sourceId: string): number {
  const reg = readAlarmRegistry()
  let cancelledCount = 0
  const bridge = getNativeBridge()

  for (const [id, spec] of Object.entries(reg)) {
    if (spec.sourceId === sourceId || id.includes(sourceId)) {
      delete reg[id]
      cancelledCount++
      if (bridge && typeof bridge.cancelNotification === 'function') {
        try {
          bridge.cancelNotification(id)
        } catch {}
      }
      if (
        typeof navigator !== 'undefined' &&
        'serviceWorker' in navigator &&
        navigator.serviceWorker.controller
      ) {
        try {
          navigator.serviceWorker.controller.postMessage({
            type: 'CANCEL_ALARM',
            alarmId: id,
          })
        } catch {}
      }
    }
  }

  if (cancelledCount > 0) {
    writeAlarmRegistry(reg)
  }
  return cancelledCount
}

export function clearAllScheduledAlarms(): void {
  writeAlarmRegistry({})
  const bridge = getNativeBridge()
  if (bridge && typeof bridge.cancelAllNotifications === 'function') {
    try {
      bridge.cancelAllNotifications()
    } catch {}
  }
  if (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    navigator.serviceWorker.controller
  ) {
    try {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_ALL_ALARMS',
      })
    } catch {}
  }
}

export function openAndroidNotificationSettings(): void {
  const bridge = getNativeBridge()
  if (bridge && typeof bridge.openAppNotificationSettings === 'function') {
    try {
      bridge.openAppNotificationSettings()
    } catch {}
  }
}

function parseHHMM(timeStr: string): { hours: number; minutes: number } | null {
  if (!timeStr) return null
  const parts = timeStr.split(':').map((n) => parseInt(n, 10))
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null
  return { hours: parts[0], minutes: parts[1] }
}

export function computeNextOccurrenceMs(params: {
  timeStr: string
  dateStr?: string | null
  recurrence?: 'once' | 'none' | 'daily' | 'weekdays' | 'weekly' | 'custom'
  selectedDays?: number[]
  referenceNow?: Date
}): number | null {
  const parsed = parseHHMM(params.timeStr)
  if (!parsed) return null

  const now = params.referenceNow || new Date()
  const nowMs = now.getTime()
  const recurrence = params.recurrence || 'daily'

  if (params.dateStr && (recurrence === 'once' || recurrence === 'none')) {
    const [y, m, d] = params.dateStr.split('-').map((n) => parseInt(n, 10))
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      const target = new Date(y, m - 1, d, parsed.hours, parsed.minutes, 0, 0)
      if (target.getTime() > nowMs) return target.getTime()
    }
  }

  for (let offset = 0; offset <= 7; offset++) {
    const candidate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + offset,
      parsed.hours,
      parsed.minutes,
      0,
      0
    )

    if (candidate.getTime() <= nowMs) continue

    const dayOfWeek = candidate.getDay()

    if (recurrence === 'weekdays') {
      if (dayOfWeek >= 1 && dayOfWeek <= 5) return candidate.getTime()
    } else if (
      recurrence === 'custom' &&
      Array.isArray(params.selectedDays) &&
      params.selectedDays.length > 0
    ) {
      if (params.selectedDays.includes(dayOfWeek)) return candidate.getTime()
    } else {
      return candidate.getTime()
    }
  }

  return null
}

export function syncTaskNotification(
  task: LocalTask,
  referenceNow: Date = new Date()
): ScheduledAlarmSpec | null {
  cancelAlarmsBySourceId(task.id)

  if (task.status === 'done' || task.enableReminder === false) {
    return null
  }

  const reminderTimeStr = task.reminderTime || task.startTime || task.dueTime
  if (!reminderTimeStr) return null

  const recurrence =
    task.recurrence && task.recurrence !== 'none'
      ? task.recurrence
      : task.timeframe === 'daily'
      ? 'daily'
      : task.timeframe === 'weekly'
      ? 'weekly'
      : task.dueDate
      ? 'once'
      : 'daily'

  const nextTriggerMs = computeNextOccurrenceMs({
    timeStr: reminderTimeStr,
    dateStr: task.dueDate,
    recurrence,
    selectedDays: task.recurrenceDays,
    referenceNow,
  })

  if (!nextTriggerMs) return null

  return scheduleNativeAlarm({
    id: `alarm_task_${task.id}`,
    title: 'Nexora — Task Reminder',
    body: `Time to complete your scheduled task: ${task.title}.`,
    triggerAtMs: nextTriggerMs,
    channelId: 'nexora_tasks',
    targetUrl: `/tasks?taskId=${encodeURIComponent(task.id)}`,
    category: 'task',
    sourceType: 'task',
    sourceId: task.id,
    enabled: true,
    repeatPattern: recurrence === 'custom' ? 'weekdays' : recurrence,
    createdAt: referenceNow.toISOString(),
  })
}

export function syncHabitNotification(
  habit: LocalHabit,
  completedToday: boolean = false,
  referenceNow: Date = new Date()
): ScheduledAlarmSpec | null {
  cancelAlarmsBySourceId(habit.id)

  const reminderTimeStr = habit.reminderTime || habit.startTime
  if (!habit.enableReminder || !reminderTimeStr) {
    return null
  }

  const effectiveNow = completedToday
    ? new Date(
        referenceNow.getFullYear(),
        referenceNow.getMonth(),
        referenceNow.getDate(),
        23,
        59,
        59
      )
    : referenceNow

  const nextTriggerMs = computeNextOccurrenceMs({
    timeStr: reminderTimeStr,
    recurrence: habit.frequency,
    selectedDays: habit.selectedDays,
    referenceNow: effectiveNow,
  })

  if (!nextTriggerMs) return null

  return scheduleNativeAlarm({
    id: `alarm_habit_${habit.id}`,
    title: 'Nexora — Habit Time',
    body: `Your scheduled habit is ready. Time for ${habit.name}.`,
    triggerAtMs: nextTriggerMs,
    channelId: 'nexora_habits',
    targetUrl: `/habits?habitId=${encodeURIComponent(habit.id)}`,
    category: 'habit',
    sourceType: 'habit',
    sourceId: habit.id,
    enabled: true,
    repeatPattern: habit.frequency === 'custom' ? 'weekdays' : habit.frequency,
    createdAt: referenceNow.toISOString(),
  })
}

export function syncHydrationNotifications(params: {
  config?: HydrationReminderConfig
  enabled?: boolean
  consumedMl: number
  goalMl: number
  upcomingSlots?: Date[]
  upcomingSlotMs?: number[]
  referenceNow?: Date
}): ScheduledAlarmSpec[] {
  cancelAlarmsBySourceId('hydration_scheduler')

  const isEnabled =
    params.enabled !== undefined
      ? params.enabled
      : params.config
      ? params.config.enabled
      : true

  if (!isEnabled) return []
  if (
    params.config?.stopWhenGoalReached !== false &&
    params.consumedMl >= params.goalMl
  ) {
    return []
  }

  const now = params.referenceNow || new Date()
  const scheduled: ScheduledAlarmSpec[] = []

  const slots: Date[] =
    params.upcomingSlots ||
    (params.upcomingSlotMs ? params.upcomingSlotMs.map((ms) => new Date(ms)) : [])

  const slotsToSchedule = slots.slice(0, 8)
  for (const slot of slotsToSchedule) {
    const slotMs = slot.getTime()
    if (slotMs <= now.getTime()) continue

    const slotId = `alarm_hydration_${slot.getFullYear()}_${slot.getMonth() + 1}_${slot.getDate()}_${slot.getHours()}_${slot.getMinutes()}`
    const res = scheduleNativeAlarm({
      id: slotId,
      title: 'Nexora — Hydration Time',
      body: `Time to drink water! You've consumed ${params.consumedMl.toLocaleString()} ml of your ${params.goalMl.toLocaleString()} ml daily goal.`,
      triggerAtMs: slotMs,
      channelId: 'nexora_hydration',
      targetUrl: '/dashboard#hydration',
      category: 'hydration',
      sourceType: 'hydration',
      sourceId: 'hydration_scheduler',
      enabled: true,
      repeatPattern: 'interval',
      createdAt: now.toISOString(),
    })
    if (res) scheduled.push(res)
  }

  return scheduled
}

export function syncExpenseReminderNotification(params: {
  config: ExpenseReminderConfig
  defaultCurrency: CurrencyCode
  referenceNow?: Date
}): ScheduledAlarmSpec | null {
  cancelAlarmsBySourceId('expense_daily_reminder')

  if (!params.config.enabled || !params.config.time) {
    return null
  }

  const now = params.referenceNow || new Date()
  const nextTriggerMs = computeNextOccurrenceMs({
    timeStr: params.config.time,
    recurrence: 'daily',
    referenceNow: now,
  })

  if (!nextTriggerMs) return null

  return scheduleNativeAlarm({
    id: 'alarm_expense_daily',
    title: 'Nexora — Expense Tracker',
    body: `Time to log today's expenses and keep your ${params.defaultCurrency} wallet balances accurate.`,
    triggerAtMs: nextTriggerMs,
    channelId: 'nexora_expenses',
    targetUrl: '/dashboard#finance',
    category: 'expense',
    sourceType: 'expense',
    sourceId: 'expense_daily_reminder',
    enabled: true,
    repeatPattern: 'daily',
    createdAt: now.toISOString(),
  })
}
