'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Bot,
  CheckSquare, 
  FolderKanban, 
  CalendarDays, 
  Flame, 
  Clock, 
  LineChart, 
  Settings, 
  Target, 
  Zap,
  Menu,
  X
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Command Center', icon: LayoutDashboard },
  { href: '/agent', label: 'Nexora Agent', icon: Bot },
  { href: '/focus', label: 'Focus Mode', icon: Zap },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/habits', label: 'Habits', icon: Flame },
  { href: '/timeline', label: 'Timeline', icon: Clock },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/timetable', label: 'Timetable', icon: Clock },
  { href: '/analytics', label: 'Analytics', icon: LineChart },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="md:hidden flex items-center">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 focus:outline-none transition-colors"
        aria-label="Open mobile menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-sidebar border-r border-sidebar-border/60 p-6 pt-5 shadow-2xl z-50">
            <div className="flex items-center justify-between pb-4 border-b border-sidebar-border/40">
              <Link 
                href="/dashboard" 
                onClick={() => setIsOpen(false)} 
                className="flex items-center gap-3 font-bold"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-primary/10 border border-primary/20">
                  <span className="text-primary text-sm font-black leading-none">N</span>
                </div>
                <span className="text-lg tracking-tight font-semibold text-sidebar-foreground">Nexora</span>
              </Link>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                aria-label="Close mobile menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 space-y-1 text-sm font-medium">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 transition-all ${
                      isActive
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}
    </div>
  )
}
