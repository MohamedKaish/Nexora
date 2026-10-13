import { useTaskStore } from '@/store/useTaskStore'
import { useHabitStore } from '@/store/useHabitStore'
import { sendNotification } from './notificationService'
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
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      const now = new Date()
      const currentMinutes = now.getHours() * 60 + now.getMinutes()

      // ─── 1. Check Tasks ───
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
            await sendNotification(`⏳ Upcoming Task: ${task.title}`, {
              body: `Scheduled to begin in ${diffMinutes} min (${task.startTime}). Prepare your focus chamber!`,
              tag: `task-15m-${task.id}`,
              type: 'task',
              link: '/tasks',
              playSound: true,
            })
          }
        }

        // Alert 2: Window starts now (0 to 5 minutes after start time)
        const keyStart = `notif_task_start_${task.id}_${todayStr}`
        if (diffMinutes <= 0 && diffMinutes >= -5) {
          if (!localStorage.getItem(keyStart)) {
            localStorage.setItem(keyStart, 'true')
            await sendNotification(`⚡ Task Window Active: ${task.title}`, {
              body: `Your scheduled task window (${task.startTime}${task.endTime ? ' - ' + task.endTime : ''}) is now active!`,
              tag: `task-start-${task.id}`,
              type: 'task',
              link: '/tasks',
              playSound: true,
            })
          }
        }
      }

      // ─── 2. Check Habits ───
      const habits = useHabitStore.getState().habits
      const todayHabits = habits.filter((h) => h.hasTimeRange && h.startTime && (h.enableReminder !== false))

      for (const habit of todayHabits) {
        if (!habit.startTime) continue
        const habitStartMinutes = timeToMinutes(habit.startTime)
        if (habitStartMinutes < 0) continue

        const diffMinutes = habitStartMinutes - currentMinutes

        // Alert 1: 15 minutes before habit window
        const key15m = `notif_habit_15m_${habit.id}_${todayStr}`
        if (diffMinutes > 0 && diffMinutes <= 15) {
          if (!localStorage.getItem(key15m)) {
            localStorage.setItem(key15m, 'true')
            await sendNotification(`⏳ Habit Horizon: ${habit.name}`, {
              body: `Scheduled habit window opens in ${diffMinutes} min (${habit.startTime}). Stay consistent!`,
              tag: `habit-15m-${habit.id}`,
              type: 'habit',
              link: '/habits',
              playSound: true,
            })
          }
        }

        // Alert 2: Habit window opens now
        const keyStart = `notif_habit_start_${habit.id}_${todayStr}`
        if (diffMinutes <= 0 && diffMinutes >= -5) {
          if (!localStorage.getItem(keyStart)) {
            localStorage.setItem(keyStart, 'true')
            await sendNotification(`🔥 Habit Window Open: ${habit.name}`, {
              body: `Your habit window (${habit.startTime}${habit.endTime ? ' - ' + habit.endTime : ''}) is active now. Complete your momentum!`,
              tag: `habit-start-${habit.id}`,
              type: 'habit',
              link: '/habits',
              playSound: true,
            })
          }
        }
      }
    } catch (err) {
      console.warn('Schedule watcher check error:', err)
    }
  }

  // Initial check on load
  checkSchedule()

  // Polling every 30 seconds
  setInterval(checkSchedule, 30000)
}
