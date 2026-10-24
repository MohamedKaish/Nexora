import { useTaskStore } from '@/store/useTaskStore'
import { useHabitStore } from '@/store/useHabitStore'
import { useNoteStore } from '@/store/useNoteStore'
import { useFinanceStore } from '@/store/useFinanceStore'
import { useHydrationStore } from '@/store/useHydrationStore'
import { sendNexoraNotification } from '@/utils/notificationBridge'
import { format } from 'date-fns'

let isWatcherRunning = false

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10))
  if (isNaN(h) || isNaN(m)) return -1
  return h * 60 + m
}

export async function triggerCircadianTestAlert(
  anchor: 'morning' | 'midday' | 'evening' | 'custom'
): Promise<boolean> {
  const financeCalc = useFinanceStore.getState().getCalculations()
  const hydrationCalc = useHydrationStore.getState().getCalculations()

  if (anchor === 'morning') {
    return sendNexoraNotification(
      '☀️ Morning Executive Briefing',
      `Safe-to-Spend: $${financeCalc.safeToSpendDaily.toFixed(2)}/day. Target Hydration: ${hydrationCalc.targetHydrationMl}ml (climate offset +${hydrationCalc.weatherOffsetMl}ml). Systems nominal!`,
      'circadian-briefing-morning',
      true
    )
  }

  if (anchor === 'midday') {
    return sendNexoraNotification(
      '💧 Midday Circadian Pacing Check',
      `${hydrationCalc.completionPercentage}% of hydration achieved (${hydrationCalc.remainingMl}ml remaining). Discretionary spending pacing is steady on trajectory.`,
      'circadian-check-midday',
      true
    )
  }

  if (anchor === 'evening') {
    const remainingDays = useFinanceStore.getState().payPeriodDaysRemaining
    return sendNexoraNotification(
      '🌙 Evening Reflection & Rebalancing',
      `Spent today: $${financeCalc.totalSpentToday.toFixed(2)}. Trajectory smoothed across ${remainingDays} remaining days. Replenish and rest.`,
      'circadian-reflection-evening',
      true
    )
  }

  return sendNexoraNotification(
    '⚡ Aura Life OS · Out-of-App Signal',
    `Notification tray transmission verified! Safe-to-Spend: $${financeCalc.safeToSpendDaily.toFixed(2)} | Hydration: ${hydrationCalc.completionPercentage}%.`,
    'aura-test-signal',
    true
  )
}

export function startScheduleNotificationWatcher() {
  if (typeof window === 'undefined' || isWatcherRunning) return
  isWatcherRunning = true

  const checkSchedule = async () => {
    try {
      const now = new Date()
      const todayStr = format(now, 'yyyy-MM-dd')
      const currentHours = now.getHours()
      const currentMinutes = now.getHours() * 60 + now.getMinutes()
      const currentTimeMs = now.getTime()

      // ─── 0. Check 2-Hour Hydration Reminder Engine ───
      const hydrationState = useHydrationStore.getState()
      if (hydrationState.enableReminders !== false) {
        const intervalHours = hydrationState.reminderIntervalHours || 2
        // Daytime active window: 07:00 to 23:00
        if (currentHours >= 7 && currentHours <= 23) {
          // Even hour bucket for interval (e.g., 8, 10, 12, 14, 16, 18, 20, 22)
          const hourBucket = Math.floor(currentHours / intervalHours) * intervalHours
          const hydrationKey = `notif_hydration_2h_${todayStr}_${hourBucket}`

          if (!localStorage.getItem(hydrationKey)) {
            const mostRecentLog = hydrationState.logs[0]
            const recentlyDrank =
              mostRecentLog &&
              currentTimeMs - new Date(mostRecentLog.timestamp).getTime() < 45 * 60 * 1000

            if (!recentlyDrank) {
              localStorage.setItem(hydrationKey, 'true')
              hydrationState.recordHydrationReminderSent?.()
              const hydrationCalc = hydrationState.getCalculations()
              await sendNexoraNotification(
                '💧 Time to Drink Water!',
                `Hydration reminder: Drink a glass of water to stay energized and reach your ${hydrationCalc.targetHydrationMl}ml goal.`,
                `hydration-reminder-${todayStr}-${hourBucket}`,
                true
              )
            }
          }
        }
      }

      // ─── 1. Check Circadian Anchors (08:00 Morning, 21:00 Evening) ───
      if (currentHours === 8 && now.getMinutes() <= 5) {
        const morningKey = `notif_circadian_morning_${todayStr}`
        if (!localStorage.getItem(morningKey)) {
          localStorage.setItem(morningKey, 'true')
          await triggerCircadianTestAlert('morning')
        }
      }

      if (currentHours === 21 && now.getMinutes() <= 5) {
        const eveningKey = `notif_circadian_evening_${todayStr}`
        if (!localStorage.getItem(eveningKey)) {
          localStorage.setItem(eveningKey, 'true')
          await triggerCircadianTestAlert('evening')
        }
      }

      // ─── 2. Check Tactical Reminder Notes ───
      const notes = useNoteStore.getState().notes
      for (const note of notes) {
        if (!note.remindAt || note.reminderFired) continue

        const reminderTimeMs = new Date(note.remindAt).getTime()
        if (reminderTimeMs <= currentTimeMs && currentTimeMs - reminderTimeMs < 120000) {
          useNoteStore.getState().markReminderFired(note.id)
          await sendNexoraNotification(
            `⏰ Reminder: ${note.title}`,
            note.content || 'Tactical reminder note window is active!',
            `note-reminder-${note.id}`,
            true
          )
        }
      }

      // ─── 3. Check Tasks ───
      const tasks = useTaskStore.getState().tasks
      const todayTasks = tasks.filter((t) => {
        if (t.status === 'done') return false
        const isToday =
          t.dueDate === todayStr ||
          t.isScheduleForToday === true ||
          t.timeframe === 'daily'
        return isToday && t.startTime
      })

      for (const task of todayTasks) {
        if (!task.startTime) continue
        const taskStartMinutes = timeToMinutes(task.startTime)
        if (taskStartMinutes < 0) continue

        const diffMinutes = taskStartMinutes - currentMinutes

        // Alert 1: 15 minutes before task start
        const key15m = `notif_task_15m_${task.id}_${todayStr}`
        if (diffMinutes > 0 && diffMinutes <= 15) {
          if (!localStorage.getItem(key15m)) {
            localStorage.setItem(key15m, 'true')
            await sendNexoraNotification(
              `⏳ Upcoming Task: ${task.title}`,
              `Scheduled to begin in ${diffMinutes} min (${task.startTime}). Prepare your workspace!`,
              `task-15m-${task.id}`,
              true
            )
          }
        }

        // Alert 2: Window starts now (0 to 5 minutes after start time)
        const keyStart = `notif_task_start_${task.id}_${todayStr}`
        if (diffMinutes <= 0 && diffMinutes >= -5) {
          if (!localStorage.getItem(keyStart)) {
            localStorage.setItem(keyStart, 'true')
            await sendNexoraNotification(
              `⚡ Task Window Active: ${task.title}`,
              `Your scheduled task window (${task.startTime}${task.endTime ? ' - ' + task.endTime : ''}) is now active!`,
              `task-start-${task.id}`,
              true
            )
          }
        }

        // Alert 3: Task Overdue check
        if (task.endTime) {
          const taskEndMinutes = timeToMinutes(task.endTime)
          if (taskEndMinutes > 0 && currentMinutes > taskEndMinutes) {
            const keyOverdue = `notif_task_overdue_${task.id}_${todayStr}`
            if (!localStorage.getItem(keyOverdue)) {
              localStorage.setItem(keyOverdue, 'true')
              await sendNexoraNotification(
                `⚠️ Task Overdue: ${task.title}`,
                `Scheduled completion time (${task.endTime}) has passed. Realign your focus or reschedule.`,
                `task-overdue-${task.id}`,
                true
              )
            }
          }
        }
      }

      // ─── 4. Check Scheduled Habits (Remind at exact set time e.g. 6:00 AM) ───
      const habitState = useHabitStore.getState()
      const habits = habitState.habits
      const completions = habitState.completions
      const todayHabits = habits.filter((h) => h.enableReminder !== false)

      for (const habit of todayHabits) {
        let startMin = habit.startTime ? timeToMinutes(habit.startTime) : -1
        let endMin = habit.endTime ? timeToMinutes(habit.endTime) : -1

        if (startMin < 0 || endMin < 0) {
          const legacyPeriod = (habit as unknown as { period?: string }).period
          if (legacyPeriod === 'morning') {
            startMin = 6 * 60
            endMin = 9 * 60
          } else if (legacyPeriod === 'afternoon') {
            startMin = 12 * 60
            endMin = 15 * 60
          } else if (legacyPeriod === 'evening') {
            startMin = 18 * 60
            endMin = 21 * 60
          }
        }

        if (startMin >= 0) {
          const diffStart = startMin - currentMinutes

          // Reminder 1: 15 minutes before habit timing
          const key15m = `notif_habit_15m_${habit.id}_${todayStr}`
          if (diffStart > 0 && diffStart <= 15) {
            if (!localStorage.getItem(key15m)) {
              localStorage.setItem(key15m, 'true')
              await sendNexoraNotification(
                `⏳ Upcoming in 15 mins: ${habit.name}`,
                `Scheduled for ${habit.startTime || 'soon'}. Get ready for ${habit.name}!`,
                `habit-15m-${habit.id}`,
                true
              )
            }
          }

          // Reminder 2: Exact Scheduled Time (e.g. 6:00 AM)
          const keyStart = `notif_habit_start_${habit.id}_${todayStr}`
          if (diffStart <= 0 && diffStart >= -5) {
            if (!localStorage.getItem(keyStart)) {
              localStorage.setItem(keyStart, 'true')
              await sendNexoraNotification(
                `⏰ Habit Reminder: ${habit.name}`,
                `It's ${habit.startTime || 'time'}! Time for your scheduled habit: ${habit.name}.`,
                `habit-start-${habit.id}`,
                true
              )
            }
          }
        }

        if (endMin >= 0) {
          const isDoneToday = completions.some(
            (c) => c.habitId === habit.id && c.completedDate === todayStr
          )
          if (!isDoneToday) {
            const diffEnd = endMin - currentMinutes
            const keyClosing = `notif_habit_closing_${habit.id}_${todayStr}`
            if (diffEnd > 0 && diffEnd <= 30) {
              if (!localStorage.getItem(keyClosing)) {
                localStorage.setItem(keyClosing, 'true')
                await sendNexoraNotification(
                  `⌛ Habit Window Closing: ${habit.name}`,
                  `Window closes at ${habit.endTime}. Check off ${habit.name} before the day ends!`,
                  `habit-closing-${habit.id}`,
                  true
                )
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('Schedule watcher check error:', err)
    }
  }

  // Initial check on load
  checkSchedule()

  // Polling every 20 seconds for precise time window notifications
  setInterval(checkSchedule, 20000)
}
