'use client'

import { useEffect, useState } from 'react'
import { useTaskStore } from '@/store/useTaskStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useGoalStore } from '@/store/useGoalStore'
import { useHabitStore } from '@/store/useHabitStore'
import { migrateFromLocalStorage } from '@/lib/db/indexeddb'

export function HydrationProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false)
  const hydrateTasks = useTaskStore((s) => s.hydrate)
  const hydrateProjects = useProjectStore((s) => s.hydrate)
  const hydrateGoals = useGoalStore((s) => s.hydrate)
  const hydrateHabits = useHabitStore((s) => s.hydrate)

  useEffect(() => {
    async function hydrateAll() {
      // 1. Run migration from localStorage first if needed
      await migrateFromLocalStorage()
      
      // 2. Hydrate all stores from IndexedDB
      await Promise.all([
        hydrateTasks(),
        hydrateProjects(),
        hydrateGoals(),
        hydrateHabits()
      ])
      
      setIsHydrated(true)
    }

    hydrateAll()
  }, [hydrateTasks, hydrateProjects, hydrateGoals, hydrateHabits])

  // Don't render children until hydration is complete to prevent layout shift / flashes
  if (!isHydrated) {
    return <div className="min-h-screen bg-background" /> // Optional loading skeleton
  }

  return <>{children}</>
}
