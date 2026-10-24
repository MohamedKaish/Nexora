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

      // ─── 1. Check Circadian Anchors (08:00, 14:00, 21:00) ───
      // 08:00 Morning Executive Briefing
      if (currentHours === 8 && now.getMinutes() <= 5) {
        const morningKey = `notif_circadian_morning_${todayStr}`
        if (!localStorage.getItem(morningKey)) {
          localStorage.setItem(morningKey, 'true')
          await triggerCircadianTestAlert('morning')
        }
      }

      // 14:00 Midday Hydration Check-in
      if (currentHours === 14 && now.getMinutes() <= 5) {
        const middayKey = `notif_circadian_midday_${todayStr}`
        if (!localStorage.getItem(middayKey)) {
          localStorage.setItem(middayKey, 'true')
          await triggerCircadianTestAlert('midday')
        }
      }

      // 21:00 Evening Reflection & Rebalancing
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
              `Scheduled to begin in ${diffMinutes} min (${task.startTime}). Prepare your focus chamber!`,
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

      // ─── 4. Check Habits & Custom Time Windows ───
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
            endMin = 11 * 60
          } else if (legacyPeriod === 'afternoon') {
            startMin = 12 * 60
            endMin = 17 * 60
          } else if (legacyPeriod === 'evening') {
            startMin = 18 * 60
            endMin = 22 * 60 + 30
          }
        }

        if (startMin >= 0) {
          const diffStart = startMin - currentMinutes
          const key15m = `notif_habit_15m_${habit.id}_${todayStr}`
          if (diffStart > 0 && diffStart <= 15) {
            if (!localStorage.getItem(key15m)) {
              localStorage.setItem(key15m, 'true')
              await sendNexoraNotification(
                `⏳ Habit Horizon: ${habit.name}`,
                `Scheduled habit window opens in ${diffStart} min (${habit.startTime || 'Scheduled'}). Stay consistent!`,
                `habit-15m-${habit.id}`,
                true
              )
            }
          }

          const keyStart = `notif_habit_start_${habit.id}_${todayStr}`
          if (diffStart <= 0 && diffStart >= -5) {
            if (!localStorage.getItem(keyStart)) {
              localStorage.setItem(keyStart, 'true')
              await sendNexoraNotification(
                `🔥 Habit Window Open: ${habit.name}`,
                `Habit window is active now! Complete it to build your momentum streak.`,
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
                  `⌛ Habit Closing Soon: ${habit.name}`,
                  `Only ${diffEnd} minutes remaining in your habit window. Check it off before it closes!`,
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
