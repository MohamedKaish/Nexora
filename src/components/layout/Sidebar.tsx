'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Compass,
  CheckSquare,
  Flame,
  Zap,
  Target,
  FolderKanban,
  CalendarDays,
  CalendarRange,
  BarChart3,
  Bell,
  Sparkles,
  Bot,
  Settings,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'

interface NavSection {
  title: string
  items: {
    name: string
    href: string
    icon: React.ElementType
    badge?: string
  }[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Core Habitat',
    items: [
      { name: 'World Hub', href: '/dashboard', icon: Compass },
      { name: 'Tasks', href: '/tasks', icon: CheckSquare },
      { name: 'Habits', href: '/habits', icon: Flame },
      { name: 'Focus Chamber', href: '/focus', icon: Zap },
    ],
  },
  {
    title: 'Horizon Planning',
    items: [
      { name: 'Goals', href: '/goals', icon: Target },
      { name: 'Projects', href: '/projects', icon: FolderKanban },
      { name: 'Timetable', href: '/timetable', icon: CalendarDays },
      { name: 'Calendar', href: '/calendar', icon: CalendarRange },
    ],
  },
  {
    title: 'Insights',
    items: [
      { name: 'Analytics', href: '/analytics', icon: BarChart3 },
      { name: 'Inbox', href: '/notifications', icon: Bell },
    ],
  },
  {
    title: 'Personal Ally',
    items: [
      { name: 'Companion Atelier', href: '/character', icon: Sparkles },
      { name: 'Kyro Agent', href: '/agent', icon: Bot },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const agentName = useAppStore((s) => s.agentConfig.name) || 'Kyro'

  return (
    <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 z-40 bg-stone-950/80 border-r border-stone-800/80 backdrop-blur-xl">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-stone-800/80 gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_0_15px_rgba(212,168,83,0.35)]">
          <span className="text-stone-950 font-bold text-lg font-serif">N</span>
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-gradient-gold">NEXORA</span>
          <span className="text-[10px] text-amber-300/70 uppercase tracking-widest font-semibold">Living OS</span>
        </div>
      </div>

      {/* Nav links */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1.5">
            <h4 className="px-3 text-[10px] font-bold text-stone-500 uppercase tracking-widest">
              {section.title}
            </h4>
            {section.items.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              const itemName = item.name.replace('Kyro Agent', `${agentName} Agent`)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-amber-400/10 text-amber-300 border border-amber-400/25 shadow-sm'
                      : 'text-stone-400 hover:text-stone-100 hover:bg-stone-900/60'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-amber-400' : 'text-stone-400'
                    }`}
                  />
                  <span>{itemName}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      {/* Ambient Footer */}
      <div className="p-4 border-t border-stone-800/80 text-center">
        <p className="text-[11px] text-stone-500 font-medium">Nexora v2.0 · Sanctuary Active</p>
      </div>
    </aside>
  )
}
