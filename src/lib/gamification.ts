import { LocalTask, LocalHabit, LocalHabitCompletion, LocalFocusSession, LocalGoal } from '@/types/local'

export interface LevelInfo {
  level: number
  title: string
  rank: string
  totalXp: number
  currentLevelXp: number
  nextLevelXpThreshold: number
  progressPercent: number
  xpBreakdown: {
    tasksXp: number
    habitsXp: number
    focusXp: number
    goalsXp: number
  }
}

export interface Badge {
  id: string
  title: string
  description: string
  icon: string
  category: 'tasks' | 'habits' | 'focus' | 'goals' | 'mastery'
  isUnlocked: boolean
  progressText: string
}

const LEVEL_RANKS: Array<{ minLevel: number; title: string; rank: string }> = [
  { minLevel: 1, title: 'Novice Explorer', rank: 'Initiate' },
  { minLevel: 3, title: 'Focus Apprentice', rank: 'Adept' },
  { minLevel: 5, title: 'Momentum Scout', rank: 'Vanguard' },
  { minLevel: 8, title: 'Sanctuary Adept', rank: 'Guardian' },
  { minLevel: 12, title: 'Velocity Master', rank: 'Champion' },
  { minLevel: 16, title: 'Flow Sovereign', rank: 'Master' },
  { minLevel: 20, title: 'Nexus Grandmaster', rank: 'Grandmaster' },
  { minLevel: 25, title: 'Celestial Architect', rank: 'Legend' },
]

export function calculateProductivityLevel(
  tasks: LocalTask[] = [],
  habits: LocalHabit[] = [],
  completions: LocalHabitCompletion[] = [],
  focusSessions: LocalFocusSession[] = [],
  goals: LocalGoal[] = []
): LevelInfo {
  // XP calculations:
  // - Completed tasks: 50 XP each
  const completedTasksCount = tasks.filter((t) => t.status === 'done').length
  const tasksXp = completedTasksCount * 50

  // - Habit check-ins: 25 XP each + streak bonus
  const totalHabitCompletions = completions.length
  const maxStreak = Math.max(...habits.map((h) => h.streak || 0), 0)
  const habitsXp = totalHabitCompletions * 25 + maxStreak * 10

  // - Focus minutes: 2 XP per minute of deep work
  const totalFocusSeconds = focusSessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0)
  const totalFocusMinutes = Math.round(totalFocusSeconds / 60)
  const focusXp = totalFocusMinutes * 2

  // - Goals progress & completed goals: 150 XP per completed goal + 1 XP per progress %
  const completedGoalsCount = goals.filter((g) => g.status === 'completed').length
  const goalsProgressSum = goals.reduce((acc, g) => acc + (g.progress || 0), 0)
  const goalsXp = completedGoalsCount * 150 + goalsProgressSum

  const totalXp = tasksXp + habitsXp + focusXp + goalsXp

  // Level curve: Level 1 = 0 XP, Level 2 = 100 XP, Level 3 = 250 XP, etc.
  // XP to reach level L = 50 * (L - 1)^1.6
  // Inverse: level = Math.floor((totalXp / 50)^(1 / 1.6)) + 1
  let level = 1
  let prevThreshold = 0
  let nextThreshold = 100

  while (true) {
    const thresholdForNext = Math.round(75 * Math.pow(level, 1.45))
    if (totalXp < thresholdForNext) {
      nextThreshold = thresholdForNext
      break
    }
    prevThreshold = thresholdForNext
    level++
    if (level > 100) break
  }

  const currentLevelXp = Math.max(0, totalXp - prevThreshold)
  const xpNeededInCurrentLevel = Math.max(1, nextThreshold - prevThreshold)
  const progressPercent = Math.min(100, Math.round((currentLevelXp / xpNeededInCurrentLevel) * 100))

  // Find rank title
  const rankInfo = [...LEVEL_RANKS].reverse().find((r) => level >= r.minLevel) || LEVEL_RANKS[0]

  return {
    level,
    title: rankInfo.title,
    rank: rankInfo.rank,
    totalXp,
    currentLevelXp,
    nextLevelXpThreshold: nextThreshold,
    progressPercent,
    xpBreakdown: {
      tasksXp,
      habitsXp,
      focusXp,
      goalsXp,
    },
  }
}

export function getProductivityBadges(
  tasks: LocalTask[] = [],
  habits: LocalHabit[] = [],
  completions: LocalHabitCompletion[] = [],
  focusSessions: LocalFocusSession[] = [],
  goals: LocalGoal[] = []
): Badge[] {
  const completedTasks = tasks.filter((t) => t.status === 'done').length
  const maxStreak = Math.max(...habits.map((h) => h.streak || 0), 0)
  const totalFocusMins = Math.round(
    focusSessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0) / 60
  )
  const completedGoals = goals.filter((g) => g.status === 'completed').length

  return [
    {
      id: 'first_quest',
      title: 'First Blood',
      description: 'Conquer your first task in the matrix.',
      icon: '⚔️',
      category: 'tasks',
      isUnlocked: completedTasks >= 1,
      progressText: `${Math.min(completedTasks, 1)} / 1 task`,
    },
    {
      id: 'task_slayer',
      title: 'Task Slayer',
      description: 'Complete 10 tasks across your workspaces.',
      icon: '⚡',
      category: 'tasks',
      isUnlocked: completedTasks >= 10,
      progressText: `${Math.min(completedTasks, 10)} / 10 tasks`,
    },
    {
      id: 'streak_forge',
      title: 'Chain Forger',
      description: 'Build a 3-day unbroken habit streak.',
      icon: '🔥',
      category: 'habits',
      isUnlocked: maxStreak >= 3,
      progressText: `${Math.min(maxStreak, 3)} / 3 days`,
    },
    {
      id: 'habit_sentinel',
      title: 'Habit Sentinel',
      description: 'Achieve a 7-day master habit streak.',
      icon: '🛡️',
      category: 'habits',
      isUnlocked: maxStreak >= 7,
      progressText: `${Math.min(maxStreak, 7)} / 7 days`,
    },
    {
      id: 'first_flow',
      title: 'Deep Ingress',
      description: 'Log your first 25-minute Pomodoro focus chamber.',
      icon: '🧘',
      category: 'focus',
      isUnlocked: totalFocusMins >= 25,
      progressText: `${Math.min(totalFocusMins, 25)} / 25 mins`,
    },
    {
      id: 'centurion_focus',
      title: 'Centurion Flow',
      description: 'Accumulate 100 minutes of deep work.',
      icon: '⌛',
      category: 'focus',
      isUnlocked: totalFocusMins >= 100,
      progressText: `${Math.min(totalFocusMins, 100)} / 100 mins`,
    },
    {
      id: 'horizon_conqueror',
      title: 'Horizon Master',
      description: 'Complete at least 1 milestone goal.',
      icon: '🎯',
      category: 'goals',
      isUnlocked: completedGoals >= 1,
      progressText: `${Math.min(completedGoals, 1)} / 1 goal`,
    },
    {
      id: 'sanctuary_harmony',
      title: 'Sanctuary Harmony',
      description: 'Have active progress in Tasks, Habits, and Focus Chamber simultaneously.',
      icon: '🌌',
      category: 'mastery',
      isUnlocked: completedTasks >= 1 && completions.length >= 1 && totalFocusMins >= 1,
      progressText: 'Synergy achieved',
    },
  ]
}
