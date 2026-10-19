'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTaskStore } from '@/store/useTaskStore'
import { useHabitStore } from '@/store/useHabitStore'
import { useFocusStore } from '@/store/useFocusStore'
import { useNoteStore } from '@/store/useNoteStore'
import { useAppStore } from '@/store/appStore'
import { useKyroStore } from '@/store/kyroStore'
import { KyroActionChip } from '@/types/kyro'

export function useKyroBrain() {
  const pathname = usePathname()
  const router = useRouter()

  const userName = useAppStore((s) => s.preferences.displayName) || 'Explorer'
  const agentName = useAppStore((s) => s.agentConfig.name) || 'Kyro'

  const { speak, setAnimationState, setModel, toggleVoice } = useKyroStore()

  // Track previous states to detect state edges (transitions)
  const prevPathnameRef = useRef<string | null>(null)
  const prevTasksRef = useRef<Map<string, string>>(new Map())
  const prevHabitsRef = useRef<Map<string, number>>(new Map())
  const prevFocusRunningRef = useRef<boolean>(false)
  const isInitialMount = useRef<boolean>(true)

  // ── 1. Route Change Awareness (Clash of Clans Guide Walkthroughs) ──
  useEffect(() => {
    if (!pathname) return

    // Avoid double speaking on initial mount if already handled
    if (prevPathnameRef.current === pathname) return
    const isFirst = prevPathnameRef.current === null
    prevPathnameRef.current = pathname

    const tasks = useTaskStore.getState().tasks
    const habits = useHabitStore.getState().habits
    const activeTasks = tasks.filter((t) => t.status !== 'done')
    const urgentTasks = activeTasks.filter((t) => t.priority === 'urgent' || t.priority === 'high')
    const todayStr = new Date().toISOString().split('T')[0]
    const completions = useHabitStore.getState().completions
    const habitsCompleted = completions.filter((c) => c.completedDate === todayStr).length

    // Delay slightly so page transition completes and Kyro glides in
    const timer = setTimeout(() => {
      // Trigger walking/gliding animation during route change
      setAnimationState('WALKING', 1200, 'IDLE')

      let greeting = ''
      let chips: KyroActionChip[] = [
        { id: 'next', label: '🎯 What next?', action: 'ask_next_task' },
        { id: 'focus', label: '⚡ 25m Focus', action: 'start_focus' },
      ]

      switch (pathname) {
        case '/dashboard':
          if (isFirst) {
            greeting = `Welcome back to the Sanctuary, ${userName}! All systems operational. ${activeTasks.length} objectives are active today.`
          } else {
            greeting = `Sanctuary Command active. You have ${activeTasks.length} tasks and ${habitsCompleted}/${habits.length} habits logged.`
          }
          break

        case '/tasks':
          if (urgentTasks.length > 0) {
            greeting = `Task Matrix engaged, Boss! You have ${urgentTasks.length} high-priority quest${urgentTasks.length > 1 ? 's' : ''} waiting. Shall we strike down "${urgentTasks[0].title}" first?`
            chips = [
              { id: 'strike', label: `⚔️ Tackle "${urgentTasks[0].title.slice(0, 16)}..."`, action: 'custom', payload: { taskId: urgentTasks[0].id } },
              { id: 'focus', label: '⚡ Focus on Task', action: 'start_focus' },
            ]
          } else if (activeTasks.length > 0) {
            greeting = `Task Matrix online. ${activeTasks.length} quests queued. Ready to bank some momentum?`
          } else {
            greeting = `Task Matrix is completely clear, ${userName}! Outstanding discipline. Ready to plan the next milestone?`
          }
          break

        case '/habits':
          greeting = `Habit Horizon open. ${habitsCompleted} of ${habits.length} habits locked for today. Keep the chain unbroken!`
          chips = [
            { id: 'cheer', label: '🔥 Keep Streak', action: 'ask_next_task' },
            { id: 'switch', label: '🔄 Switch 3D Model', action: 'switch_model' },
          ]
          break

        case '/focus':
          greeting = `Focus Chamber locked. Acoustic barriers engaged. Choose your duration and eliminate distractions.`
          chips = [
            { id: 'pomodoro', label: '⚡ Start Pomodoro (25m)', action: 'start_focus' },
            { id: 'voice', label: '🔊 Toggle Voice', action: 'toggle_voice' },
          ]
          break

        case '/timetable':
          greeting = `Weekly chronological timeline mapped. Your daylight hours are structured for maximum flow.`
          break

        case '/calendar':
          greeting = `Calendar telemetry synchronized. Time blocks and horizons aligned.`
          break

        case '/analytics':
          greeting = `Performance Intelligence loaded. Analyzing your streak retention and velocity curves.`
          break

        case '/notes': {
          const notesCount = useNoteStore.getState().notes.length
          const remindersPending = useNoteStore.getState().notes.filter((n) => n.remindAt && !n.reminderFired).length
          greeting = `Tactical Notes & Vault active, Boss! You have ${notesCount} active brief${notesCount === 1 ? '' : 's'} and ${remindersPending} scheduled reminder${remindersPending === 1 ? '' : 's'}.`
          chips = [
            { id: 'new_note', label: '➕ New Note', action: 'custom', payload: { actionType: 'create_note' } },
            { id: 'check_reminders', label: '⏰ Check Reminders', action: 'custom', payload: { actionType: 'view_reminders' } },
          ]
          break
        }

        case '/character':
          greeting = `Companion Atelier! Here you can customize my appearance, swap archetypes, or load 3D Blender models.`
          chips = [
            { id: 'switch', label: '🔄 Switch 3D Model', action: 'switch_model' },
            { id: 'upload', label: '📦 Upload .GLB', action: 'upload_glb' },
          ]
          break

        case '/settings':
          greeting = `Sanctuary Settings & System Configurations. Security protocols and data exports available.`
          break

        default:
          greeting = `Standing by at your side in ${pathname.replace('/', '')}. How can I assist?`
          break
      }

      speak(greeting, 4500, chips)
    }, isFirst ? 1200 : 400)

    return () => clearTimeout(timer)
  }, [pathname, userName, speak, setAnimationState])

  // ── 2. Real-Time Task & Habit Celebration Watcher ──
  useEffect(() => {
    // Populate baseline on first run to avoid false trigger
    const initialTasks = useTaskStore.getState().tasks
    initialTasks.forEach((t) => prevTasksRef.current.set(t.id, t.status))

    const initialHabits = useHabitStore.getState().habits
    initialHabits.forEach((h) => prevHabitsRef.current.set(h.id, h.streak))

    // Subscribe to task status changes
    const unsubTasks = useTaskStore.subscribe((state) => {
      for (const task of state.tasks) {
        const prevStatus = prevTasksRef.current.get(task.id)
        if (prevStatus && prevStatus !== 'done' && task.status === 'done') {
          // Task was just completed!
          setAnimationState('CELEBRATING', 3500, 'IDLE')
          const praises = [
            `Outstanding execution, ${userName}! "${task.title}" is crushed. Momentum surges!`,
            `Direct hit, Boss! Quest "${task.title}" checked off the board. Clean victory!`,
            `Objective complete! That's how legends build consistency. Keep rolling!`,
          ]
          const randomPraise = praises[Math.floor(Math.random() * praises.length)]
          speak(randomPraise, 4500, [
            { id: 'next', label: '🎯 Next Quest', action: 'ask_next_task' },
            { id: 'focus', label: '⚡ Focus Chamber', action: 'start_focus' },
          ])
          break
        }
        prevTasksRef.current.set(task.id, task.status)
      }
    })

    // Subscribe to habit streak changes
    const unsubHabits = useHabitStore.subscribe((state) => {
      for (const habit of state.habits) {
        const prevStreak = prevHabitsRef.current.get(habit.id) ?? 0
        if (habit.streak > prevStreak) {
          // Streak incremented!
          setAnimationState('CELEBRATING', 3200, 'IDLE')
          speak(
            `Habit reinforced: "${habit.name}"! ${habit.streak}-day streak locked in. The chain holds strong!`,
            4000,
            [{ id: 'focus', label: '⚡ Next Block', action: 'start_focus' }]
          )
          break
        }
        prevHabitsRef.current.set(habit.id, habit.streak)
      }
    })

    // Subscribe to Focus timer state changes
    const unsubFocus = useFocusStore.subscribe((state) => {
      if (!prevFocusRunningRef.current && state.isRunning) {
        // Focus started
        setAnimationState('FOCUS_MODE')
        speak(`Focus Chamber locked. 25 minutes of uninterrupted velocity. I will stand guard.`, 3500)
      } else if (prevFocusRunningRef.current && !state.isRunning && state.remainingSeconds === 0) {
        // Focus completed
        setAnimationState('CELEBRATING', 4000, 'IDLE')
        speak(`Deep Work session conquered, ${userName}! High-bandwidth focus logged. Take a refreshing breath.`, 4500)
      } else if (prevFocusRunningRef.current && !state.isRunning) {
        // Paused
        setAnimationState('IDLE')
      }
      prevFocusRunningRef.current = state.isRunning
    })

    return () => {
      unsubTasks()
      unsubHabits()
      unsubFocus()
    }
  }, [userName, speak, setAnimationState])

  // ── 3. Quick Action Execution Handler ──
  const handleActionChip = (chip: KyroActionChip) => {
    switch (chip.action) {
      case 'ask_next_task': {
        const tasks = useTaskStore.getState().tasks.filter((t) => t.status !== 'done')
        const urgent = tasks.find((t) => t.priority === 'urgent' || t.priority === 'high') || tasks[0]
        if (urgent) {
          speak(`Top priority: "${urgent.title}". Let's dive in and knock it out.`, 3800, [
            { id: 'focus', label: '⚡ Start 25m Focus', action: 'start_focus' },
          ])
        } else {
          speak(`No urgent tasks pending! You have a clean slate. Perfect time for deep habit momentum.`, 3500)
        }
        break
      }

      case 'start_focus': {
        useFocusStore.getState().startTimer()
        router.push('/focus')
        break
      }

      case 'switch_model': {
        const currentModel = useKyroStore.getState().settings.model
        const nextModel =
          currentModel === 'kyro_prime'
            ? 'pyro_fox'
            : currentModel === 'pyro_fox'
            ? 'aegis_bot'
            : 'kyro_prime'
        setModel(nextModel)
        break
      }

      case 'upload_glb': {
        const input = document.getElementById('kyro-glb-upload-input') as HTMLInputElement
        if (input) input.click()
        break
      }

      case 'toggle_voice': {
        toggleVoice()
        break
      }

      case 'custom': {
        if (chip.payload?.actionType === 'create_note') {
          router.push('/notes')
          speak('Opening Tactical Notes Vault to author a new objective brief.', 3500)
        } else if (chip.payload?.actionType === 'view_reminders') {
          router.push('/notes')
          speak('Displaying all upcoming scheduled reminder timestamps.', 3500)
        } else if (chip.payload?.taskId) {
          router.push('/tasks')
          speak('Locking on target task. Let us conquer it.', 3500)
        }
        break
      }

      default:
        break
    }
  }

  return {
    handleActionChip,
  }
}
