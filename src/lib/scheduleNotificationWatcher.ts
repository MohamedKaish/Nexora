import { useTaskStore } from '@/store/useTaskStore'
import { useHabitStore } from '@/store/useHabitStore'
import { useNoteStore } from '@/store/useNoteStore'
import { useFinanceStore } from '@/store/useFinanceStore'
import { useHydrationStore } from '@/store/useHydrationStore'
import { sendNexoraNotification } from '@/utils/notificationBridge'
import {
  syncTaskNotification,
  syncHabitNotification,
  syncHydrationNotifications,
  syncExpenseReminderNotification,
} from '@/lib/nativeNotificationScheduler'
import { format } from 'date-fns'

let isWatcherRunning = false

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10))
  if (isNaN(h) || isNaN(m)) return -1
  return h * 60 + m
}

export function syncAllSchedulesToNativeBridge(referenceNow: Date = new Date()) {
  try {
    const tasks = useTaskStore.getState().tasks
    for (const task of tasks) {
      syncTaskNotification(task, referenceNow)
    }

    const todayStr = format(referenceNow, 'yyyy-MM-dd')
    const { habits, completions } = useHabitStore.getState()
    for (const habit of habits) {
      const doneToday = completions.some(
        (c) => c.habitId === habit.id && c.completedDate === todayStr
      )
      syncHabitNotification(habit, doneToday, referenceNow)
    }

    const hydrationState = useHydrationStore.getState()
    const progress = hydrationState.getDailyProgress(todayStr)
    syncHydrationNotifications({
      config: hydrationState.reminderConfig,
      consumedMl: progress.consumedMl,
      goalMl: progress.goalMl,
      upcomingSlots: hydrationState.getUpcomingReminderSlots(referenceNow),
      referenceNow,
    })

    const financeState = useFinanceStore.getState()
    syncExpenseReminderNotification({
      config: financeState.expenseReminder,
      defaultCurrency: financeState.defaultCurrency,
      referenceNow,
    })
  } catch (err) {
    console.warn('Failed to sync schedules to native bridge:', err)
  }
}

export function startScheduleNotificationWatcher() {
  if (typeof window === 'undefined' || isWatcherRunning) return
  isWatcherRunning = true

  // Immediately register all active Task, Habit, Hydration, and Expense alarms with the native bridge / Service Worker
  syncAllSchedulesToNativeBridge(new Date())

  const checkSchedule = async () => {
    try {
      const now = new Date()
      const todayStr = format(now, 'yyyy-MM-dd')
      const currentMinutes = now.getHours() * 60 + now.getMinutes()
      const currentTimeMs = now.getTime()

      // ─── 1. Hydration Interval Reminder Check ───
      const hydrationState = useHydrationStore.getState()
      if (hydrationState.shouldFireReminderAt(now)) {
        const intervalMins = Math.max(15, hydrationState.reminderConfig.intervalMinutes || 120)
        const startMins = timeToMinutes(hydrationState.reminderConfig.startTime || '09:00')
        const elapsedSinceStart = currentMinutes - startMins

        if (elapsedSinceStart >= 0 && elapsedSinceStart % intervalMins <= 2) {
          const slotBucket = Math.floor(elapsedSinceStart / intervalMins)
          const hydrationKey = `notif_hydration_${todayStr}_slot_${slotBucket}`

          if (!localStorage.getItem(hydrationKey)) {
            const mostRecentLog = hydrationState.logs[0]
            const recentlyDrank =
              mostRecentLog &&
              currentTimeMs - new Date(mostRecentLog.timestamp).getTime() < 25 * 60 * 1000

            if (!recentlyDrank) {
              localStorage.setItem(hydrationKey, 'true')
              hydrationState.recordHydrationReminderSent()
              const progress = hydrationState.getDailyProgress(todayStr)
              await sendNexoraNotification(
                'Nexora — Hydration Time',
                `Time to drink water! You've consumed ${progress.consumedMl.toLocaleString()} ml of your ${progress.goalMl.toLocaleString()} ml daily goal.`,
                `hydration-reminder-${todayStr}-${slotBucket}`,
                true
              )
            }
          }
        }
      }

      // ─── 2. Check Scheduled Tasks ───
      const tasks = useTaskStore.getState().tasks
      for (const task of tasks) {
        if (task.status === 'done' || task.enableReminder === false) continue
        const reminderHm = task.reminderTime || task.startTime || task.dueTime
        if (!reminderHm) continue

        const isDueToday =
          !task.dueDate ||
          task.dueDate === todayStr ||
          task.recurrence === 'daily' ||
          (task.recurrence === 'weekdays' && now.getDay() >= 1 && now.getDay() <= 5) ||
          (task.recurrence === 'custom' && task.recurrenceDays?.includes(now.getDay()))

        if (!isDueToday) continue

        const taskTargetMinutes = timeToMinutes(reminderHm)
        if (taskTargetMinutes < 0) continue

        if (
          currentMinutes >= taskTargetMinutes &&
          currentMinutes <= taskTargetMinutes + 2
        ) {
          const startKey = `notif_task_exact_${task.id}_${todayStr}_${reminderHm}`
          if (!localStorage.getItem(startKey)) {
            localStorage.setItem(startKey, 'true')
            useTaskStore.getState().markTaskNotified(task.id, todayStr)
            await sendNexoraNotification(
              'Nexora — Task Reminder',
              `Time to complete your scheduled task: ${task.title}.`,
              startKey,
              true
            )
          }
        }
      }

      // ─── 3. Check Scheduled Habits ───
      const { habits, completions } = useHabitStore.getState()
      for (const habit of habits) {
        const reminderHm = habit.reminderTime || habit.startTime
        if (!habit.enableReminder || !reminderHm) continue

        const completedToday = completions.some(
          (c) => c.habitId === habit.id && c.completedDate === todayStr
        )
        if (completedToday) continue

        if (habit.frequency === 'weekdays' && (now.getDay() === 0 || now.getDay() === 6)) {
          continue
        }
        if (
          habit.frequency === 'custom' &&
          Array.isArray(habit.selectedDays) &&
          !habit.selectedDays.includes(now.getDay())
        ) {
          continue
        }

        const habitTargetMinutes = timeToMinutes(reminderHm)
        if (habitTargetMinutes < 0) continue

        if (
          currentMinutes >= habitTargetMinutes &&
          currentMinutes <= habitTargetMinutes + 2
        ) {
          const habitExactKey = `notif_habit_exact_${habit.id}_${todayStr}_${reminderHm}`
          if (!localStorage.getItem(habitExactKey)) {
            localStorage.setItem(habitExactKey, 'true')
            useHabitStore.getState().markHabitNotified(habit.id, todayStr)
            await sendNexoraNotification(
              'Nexora — Habit Time',
              `Your scheduled habit is ready. Time for ${habit.name}.`,
              habitExactKey,
              true
            )
          }
        }
      }

      // ─── 4. Check Daily Expense Reminder ───
      const financeState = useFinanceStore.getState()
      if (financeState.expenseReminder.enabled && financeState.expenseReminder.time) {
        const expMins = timeToMinutes(financeState.expenseReminder.time)
        if (expMins >= 0 && currentMinutes >= expMins && currentMinutes <= expMins + 2) {
          const expKey = `notif_expense_daily_${todayStr}`
          if (!localStorage.getItem(expKey)) {
            localStorage.setItem(expKey, 'true')
            await sendNexoraNotification(
              'Nexora — Expense Tracker',
              `Time to log today's expenses and keep your ${financeState.defaultCurrency} wallet balances accurate.`,
              expKey,
              true
            )
          }
        }
      }

      // ─── 5. Check Tactical Reminder Notes ───
      const notes = useNoteStore.getState().notes
      for (const note of notes) {
        if (!note.remindAt || note.reminderFired) continue
        const reminderTimeMs = new Date(note.remindAt).getTime()
        if (reminderTimeMs <= currentTimeMs && currentTimeMs - reminderTimeMs < 120000) {
          useNoteStore.getState().markReminderFired(note.id)
          await sendNexoraNotification(
            `Nexora — Note Reminder: ${note.title}`,
            note.content || 'Scheduled note reminder is active.',
            `note-reminder-${note.id}`,
            true
          )
        }
      }
    } catch (err) {
      console.error('Schedule watcher error:', err)
    }
  }

  checkSchedule()
  setInterval(checkSchedule, 20000)
}
