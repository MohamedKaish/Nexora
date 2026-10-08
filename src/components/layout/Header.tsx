'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAppStore } from '@/store/appStore'
import { useTaskStore } from '@/store/useTaskStore'
import { useHabitStore } from '@/store/useHabitStore'
import { useGoalStore } from '@/store/useGoalStore'
import { useFocusStore } from '@/store/useFocusStore'
import { useKyroStore } from '@/store/kyroStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { usePwa } from '@/components/pwa/PwaProvider'
import { calculateProductivityLevel } from '@/lib/gamification'
import { Bot, Zap, Crown, Sparkles, Download, Menu, Bell } from 'lucide-react'

interface HeaderProps {
  onOpenTutorial?: () => void
  onOpenMobileDrawer?: () => void
}

export function Header({ onOpenTutorial, onOpenMobileDrawer }: HeaderProps) {
  const pathname = usePathname()
  const userName = useAppStore((s) => s.preferences.displayName) || 'Explorer'
  const agentName = useAppStore((s) => s.agentConfig.name) || 'Kyro'
  const isFocusRunning = useFocusStore((s) => s.isRunning)
  const remainingSeconds = useFocusStore((s) => s.remainingSeconds)
  const toggleKyro = useKyroStore((s) => s.toggleOpen)
  const { isInstalled, openDownloadModal } = usePwa()
  const unreadNotifsCount = useNotificationStore(
    (s) => s.notifications.filter((n) => !n.isRead).length
  )

  const tasks = useTaskStore((s) => s.tasks)
  const habits = useHabitStore((s) => s.habits)
  const completions = useHabitStore((s) => s.completions)
  const goals = useGoalStore((s) => s.goals)
  const focusSessions = useFocusStore((s) => s.sessions)

  const levelInfo = useMemo(() => {
    return calculateProductivityLevel(tasks, habits, completions, focusSessions, goals)
  }, [tasks, habits, completions, focusSessions, goals])

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  // Derive route title
  const routeTitle = (() => {
    switch (pathname) {
      case '/dashboard':
        return 'Sanctuary World'
      case '/tasks':
        return 'Task Matrix'
      case '/habits':
        return 'Habit Momentum'
      case '/goals':
        return 'Goal Horizons'
      case '/projects':
        return 'Workspaces'
      case '/focus':
        return 'Focus Chamber'
      case '/timetable':
        return 'Weekly Timetable'
      case '/calendar':
        return 'Calendar Sync'
      case '/analytics':
        return 'Performance Intelligence'
      case '/character':
        return 'Companion Atelier'
      case '/agent':
        return `${agentName} Agent`
      case '/account':
        return 'Explorer Profile & Rank'
      case '/setup':
        return 'Sanctuary Setup'
      case '/notifications':
        return 'Activity Inbox'
      case '/settings':
        return 'Sanctuary Settings'
      default:
        return 'Nexora'
    }
  })()

  return (
    <header className="h-16 border-b border-stone-800/80 bg-stone-950/60 backdrop-blur-xl px-3 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 transition-colors">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Drawer Trigger (Flipkart-Style) */}
        {onOpenMobileDrawer && (
          <button
            onClick={onOpenMobileDrawer}
            className="lg:hidden p-2 -ml-1.5 rounded-xl text-stone-300 hover:text-amber-400 hover:bg-stone-900/80 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
            aria-label="Open navigation drawer"
          >
            <Menu className="w-5 h-5 text-amber-400" />
          </button>
        )}

        <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight truncate">
          {routeTitle}
        </h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Active Focus Pill */}
        {isFocusRunning && (
          <Link
            href="/focus"
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-semibold hover:bg-amber-400/20 transition-colors animate-pulse"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] sm:text-xs">Focus: {formatTimer(remainingSeconds)}</span>
          </Link>
        )}

        {/* Download & Install App Button */}
        {!isInstalled && (
          <button
            onClick={openDownloadModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold text-xs shadow-[0_0_12px_rgba(212,168,83,0.3)] transition-all cursor-pointer"
            title="Download Android APK or Install App directly"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Download App</span>
          </button>
        )}

        {/* Companion Guide / Tutorial Trigger (Desktop only - cleaner mobile) */}
        {onOpenTutorial && (
          <button
            onClick={onOpenTutorial}
            className="hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 hover:border-amber-400 text-amber-300 text-xs font-semibold transition-all cursor-pointer"
            title="Open Interactive Companion Guide"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Sanctuary Guide</span>
          </button>
        )}

        {/* Quick Kyro trigger */}
        <button
          onClick={toggleKyro}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-stone-900 border border-stone-800 hover:border-amber-400/40 text-stone-300 text-xs font-semibold transition-all cursor-pointer"
        >
          <Bot className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="hidden sm:inline">{agentName}</span>
        </button>

        {/* Notifications Bell with Live Badge */}
        <Link
          href="/notifications"
          className="relative p-2 rounded-full bg-stone-900 border border-stone-800 hover:border-amber-400/40 text-stone-300 hover:text-amber-300 transition-colors flex items-center justify-center shrink-0"
          title="Sanctuary Transmissions & Alerts"
        >
          <Bell className="w-4 h-4" />
          {unreadNotifsCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-stone-950 text-[10px] font-extrabold flex items-center justify-center shadow-[0_0_8px_rgba(212,168,83,0.6)] animate-pulse">
              {unreadNotifsCount > 9 ? '9+' : unreadNotifsCount}
            </span>
          )}
        </Link>

        {/* User Account & Level Pill */}
        <Link
          href="/account"
          className="flex items-center gap-2 pl-1 sm:pl-2 group hover:opacity-90 transition-opacity shrink-0"
          title="View Explorer Profile & Level Rank"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border border-amber-400/50 flex items-center justify-center text-xs font-bold text-stone-950 shadow-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="absolute -bottom-1 -right-1 px-1 rounded-full bg-stone-900 border border-amber-400/60 text-[9px] font-extrabold text-amber-300">
              {levelInfo.level}
            </span>
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-bold text-stone-200 group-hover:text-amber-300 transition-colors truncate max-w-[100px]">
              {userName}
            </span>
            <span className="text-[10px] text-amber-400/80 font-mono font-semibold flex items-center gap-0.5">
              <Crown className="w-2.5 h-2.5" />
              Lv. {levelInfo.level}
            </span>
          </div>
        </Link>
      </div>
    </header>
  )
}
