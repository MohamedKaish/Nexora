'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CheckSquare,
  Zap,
  Bot,
  Sparkles,
} from 'lucide-react'
import { useAgentStore } from '@/store/agentStore'

const mobileNavItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/focus', label: 'Focus', icon: Zap },
  { href: '/agent', label: 'Agent', icon: Bot },
  { href: '/character', label: 'Me', icon: Sparkles },
]

export function MobileNav() {
  const pathname = usePathname()
  const agentName = useAgentStore((s) => s.config.name)

  return (
    <nav className="bottom-nav md:hidden" aria-label="Mobile Navigation">
      {mobileNavItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
        const label = item.href === '/agent' ? agentName : item.label
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            aria-label={label}
          >
            <div className="relative">
              <item.icon className={`h-5 w-5 transition-all duration-200 ${
                isActive ? 'scale-110' : ''
              }`} />
              {isActive && (
                <div className="absolute inset-0 blur-md bg-accent/30 rounded-full" />
              )}
            </div>
            <span className={`transition-all ${isActive ? 'text-accent' : ''}`}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
