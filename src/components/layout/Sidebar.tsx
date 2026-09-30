'use client'

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
  User,
  Sparkles
} from 'lucide-react'
import { useAgentStore } from '@/store/agentStore'

const mainNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/habits', label: 'Habits', icon: Flame },
  { href: '/focus', label: 'Focus', icon: Zap },
  { href: '/timeline', label: 'Timeline', icon: Clock },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
]

const secondaryNavItems = [
  { href: '/agent', label: 'Agent', icon: Bot },
  { href: '/character', label: 'Companion', icon: Sparkles },
  { href: '/analytics', label: 'Analytics', icon: LineChart },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const agentName = useAgentStore((s) => s.config.name)

  const renderNavItem = (item: { href: string; label: string; icon: React.ElementType }) => {
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
    const label = item.href === '/agent' ? agentName : item.label

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-all duration-200 group relative cursor-pointer ${
          isActive
            ? 'bg-accent/10 text-accent font-medium'
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
        }`}
        aria-current={isActive ? 'page' : undefined}
        aria-label={label}
      >
        {isActive && (
          <div className="absolute left-0 w-1 h-5 bg-accent rounded-r-full" />
        )}
        <item.icon className={`h-[18px] w-[18px] shrink-0 transition-all duration-200 ${
          isActive ? 'text-accent' : 'text-muted-foreground/60 group-hover:text-foreground'
        }`} />
        <span className="text-[13px] font-medium truncate">{label}</span>
      </Link>
    )
  }

  return (
    <aside className="hidden w-[240px] flex-col bg-card/30 md:flex border-r border-border/30">
      {/* Logo */}
      <div className="flex h-14 items-center px-5">
        <Link href="/dashboard" className="flex items-center gap-2.5 group cursor-pointer">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 border border-accent/20 transition-all duration-200 group-hover:scale-105 group-hover:bg-accent/15">
            <span className="text-accent text-xs font-black">N</span>
          </div>
          <span className="text-base tracking-tight font-semibold text-foreground">Nexora</span>
        </Link>
      </div>

      {/* Main Nav */}
      <div className="flex-1 overflow-auto py-2">
        <nav aria-label="Main Navigation" className="px-3 space-y-0.5">
          {mainNavItems.map(renderNavItem)}

          <div className="h-px bg-border/30 my-3" />

          {secondaryNavItems.map(renderNavItem)}
        </nav>
      </div>
    </aside>
  )
}
