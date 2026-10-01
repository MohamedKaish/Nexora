'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Target,
  Flame,
  Zap,
  Clock,
  Bot,
  Sparkles,
  Settings,
  LineChart,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useAgentStore } from '@/store/agentStore'
import { CompanionAvatar } from '@/features/companion/CompanionAvatar'
import { useAppStore } from '@/store/appStore'
import { useState } from 'react'

const mainNavItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/habits', label: 'Habits', icon: Flame },
  { href: '/focus', label: 'Focus', icon: Zap },
  { href: '/timeline', label: 'Timeline', icon: Clock },
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
  const displayName = useAppStore((s) => s.preferences.displayName)
  const [collapsed, setCollapsed] = useState(false)

  const renderNavItem = (item: { href: string; label: string; icon: React.ElementType }) => {
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
    const label = item.href === '/agent' ? agentName : item.label

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-200 cursor-pointer ${
          isActive
            ? 'bg-accent/8 text-accent'
            : 'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]'
        } ${collapsed ? 'justify-center px-2' : ''}`}
        aria-current={isActive ? 'page' : undefined}
        aria-label={label}
        title={collapsed ? label : undefined}
      >
        {/* Active indicator */}
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-accent rounded-r-full transition-all" />
        )}
        
        <div className={`relative flex items-center justify-center ${
          isActive ? 'text-accent' : 'text-muted-foreground/60 group-hover:text-foreground'
        } transition-all duration-200`}>
          <item.icon className="h-[18px] w-[18px] shrink-0" />
          {isActive && (
            <div className="absolute inset-0 blur-md bg-accent/20 rounded-full" />
          )}
        </div>
        
        {!collapsed && (
          <span className="text-[13px] font-semibold truncate">{label}</span>
        )}
      </Link>
    )
  }

  return (
    <aside className={`hidden md:flex flex-col transition-all duration-300 ${
      collapsed ? 'w-[72px]' : 'w-[250px]'
    }`}>
      {/* Frosted sidebar background */}
      <div className="flex flex-col h-full world-glass border-r border-border/30">
        {/* Logo */}
        <div className={`flex items-center h-16 px-4 ${collapsed ? 'justify-center' : ''}`}>
          <Link href="/dashboard" className="flex items-center gap-2.5 group cursor-pointer">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 border border-accent/20 transition-all duration-300 group-hover:scale-105 group-hover:bg-accent/15">
              <span className="text-accent text-sm font-black">N</span>
              <div className="absolute inset-0 rounded-xl bg-accent/5 blur-sm" />
            </div>
            {!collapsed && (
              <span className="text-base tracking-tight font-bold text-foreground">
                Nexora
              </span>
            )}
          </Link>
        </div>

        {/* Companion preview */}
        {!collapsed && (
          <div className="px-4 pb-3">
            <Link href="/character" className="flex items-center gap-3 p-2.5 rounded-2xl bg-foreground/[0.02] border border-border/20 hover:bg-foreground/[0.04] transition-all cursor-pointer group">
              <CompanionAvatar size={36} expression="happy" animate={false} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">
                  {displayName || 'Explorer'}
                </p>
                <p className="text-[10px] text-muted-foreground font-medium">
                  Your world
                </p>
              </div>
            </Link>
          </div>
        )}

        {/* Main Nav */}
        <div className="flex-1 overflow-auto py-1">
          <nav aria-label="Main Navigation" className={`space-y-0.5 ${collapsed ? 'px-2' : 'px-3'}`}>
            {mainNavItems.map(renderNavItem)}

            <div className="h-px bg-border/20 my-3" />

            {secondaryNavItems.map(renderNavItem)}
          </nav>
        </div>

        {/* Collapse toggle */}
        <div className={`p-3 border-t border-border/20 ${collapsed ? 'flex justify-center' : ''}`}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] transition-all cursor-pointer"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </aside>
  )
}
