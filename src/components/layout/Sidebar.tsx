'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  CheckSquare, 
  FolderKanban, 
  CalendarDays, 
  Flame, 
  Clock, 
  LineChart, 
  Settings,
  Target,
  Zap
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Command Center', icon: LayoutDashboard },
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

export function Sidebar() {
  const pathname = usePathname()
  
  return (
    <aside className="hidden w-[260px] flex-col bg-sidebar md:flex transition-all border-r border-sidebar-border/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      <div className="flex h-[68px] items-center px-6">
        <Link href="/dashboard" className="flex items-center gap-3 font-bold group w-full">
          <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-primary/10 border border-primary/20 shadow-inner transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_12px_rgba(99,102,241,0.3)]">
            <span className="text-primary text-sm font-black leading-none">N</span>
          </div>
          <span className="text-lg tracking-tight font-semibold text-sidebar-foreground group-hover:text-primary transition-colors">Nexora</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav aria-label="Main Navigation" className="grid items-start px-3 text-[14px] font-medium space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 transition-all duration-200 group relative ${
                  isActive 
                    ? 'bg-primary/10 text-primary font-medium shadow-sm' 
                    : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent font-medium'
                }`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
              >
                {isActive && (
                  <div className="absolute left-0 w-1 h-5 bg-primary rounded-r-full shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                )}
                <item.icon className={`h-[18px] w-[18px] transition-all duration-300 ${isActive ? 'text-primary' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground group-hover:scale-110'}`} />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
