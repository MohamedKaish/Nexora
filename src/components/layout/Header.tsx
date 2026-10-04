'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAppStore } from '@/store/appStore'
import { useFocusStore } from '@/store/useFocusStore'
import { useKyroStore } from '@/store/kyroStore'
import { Bot, Zap, Bell, Sparkles } from 'lucide-react'

export function Header() {
  const pathname = usePathname()
  const userName = useAppStore((s) => s.preferences.displayName) || 'Explorer'
  const agentName = useAppStore((s) => s.agentConfig.name) || 'Kyro'
  const isFocusRunning = useFocusStore((s) => s.isRunning)
  const remainingSeconds = useFocusStore((s) => s.remainingSeconds)
  const toggleKyro = useKyroStore((s) => s.toggleOpen)

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
      case '/notifications':
        return 'Activity Inbox'
      case '/settings':
        return 'Sanctuary Settings'
      default:
        return 'Nexora'
    }
  })()

  return (
    <header className="h-16 border-b border-stone-800/80 bg-stone-950/60 backdrop-blur-xl px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h2 className="text-base font-bold text-foreground tracking-tight">{routeTitle}</h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Active Focus Pill */}
        {isFocusRunning && (
          <Link
            href="/focus"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-semibold hover:bg-amber-400/20 transition-colors animate-pulse"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Focus: {formatTimer(remainingSeconds)}</span>
          </Link>
        )}

        {/* Quick Kyro trigger */}
        <button
          onClick={toggleKyro}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-900 border border-stone-800 hover:border-amber-400/40 text-stone-300 text-xs font-semibold transition-all cursor-pointer"
        >
          <Bot className="w-3.5 h-3.5 text-amber-400" />
          <span>{agentName}</span>
        </button>

        {/* User Pill */}
        <div className="flex items-center gap-2 pl-2">
          <div className="w-7 h-7 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-xs font-bold text-amber-300">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="hidden sm:inline text-xs font-medium text-stone-300">{userName}</span>
        </div>
      </div>
    </header>
  )
}
