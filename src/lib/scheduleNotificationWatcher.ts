import { useTaskStore } from '@/store/useTaskStore'
import { useHabitStore } from '@/store/useHabitStore'
import { useNoteStore } from '@/store/useNoteStore'
import { sendNexoraNotification } from '@/utils/notificationBridge'
import { format } from 'date-fns'

let isWatcherRunning = false

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10))
  if (isNaN(h) || isNaN(m)) return -1
  return h * 60 + m
}

export function startScheduleNotificationWatcher() {
  if (typeof window === 'undefined' || isWatcherRunning) return
  isWatcherRunning = true

  const checkSchedule = async () => {
    try {
      const now = new Date()
      const todayStr = format(now, 'yyyy-MM-dd')
      const currentMinutes = now.getHours() * 60 + now.getMinutes()
      const currentTimeMs = now.getTime()

      // ─── 1. Check Tactical Reminder Notes ───
      const notes = useNoteStore.getState().notes
      for (const note of notes) {
        if (!note.remindAt || note.reminderFired) continue

        const reminderTimeMs = new Date(note.remindAt).getTime()
        // If due within the last 2 minutes or reached right now
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

      // ─── 2. Check Tasks ───
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

      // ─── 3. Check Habits & Custom Time Windows ───
      const habitState = useHabitStore.getState()
      const habits = habitState.habits
      const completions = habitState.completions
      const todayHabits = habits.filter((h) => h.enableReminder !== false)

      for (const habit of todayHabits) {
        // Resolve time window: custom start/end or default period windows
        let startMin = habit.startTime ? timeToMinutes(habit.startTime) : -1
        let endMin = habit.endTime ? timeToMinutes(habit.endTime) : -1

        // Default periods if time range isn't manually set
        if (startMin < 0 || endMin < 0) {
          const legacyPeriod = (habit as unknown as { period?: string }).period
          if (legacyPeriod === 'morning') {
            startMin = 6 * 60 // 06:00
            endMin = 11 * 60 // 11:00
          } else if (legacyPeriod === 'afternoon') {
            startMin = 12 * 60 // 12:00
            endMin = 17 * 60 // 17:00
          } else if (legacyPeriod === 'evening') {
            startMin = 18 * 60 // 18:00
            endMin = 22 * 60 + 30 // 22:30
          }
        }

        if (startMin >= 0) {
          const diffStart = startMin - currentMinutes

          // Alert: 15 minutes before habit window opens
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

          // Alert: Habit window opens now
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

        // Alert: Habit window closing in 30 minutes if not completed
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
