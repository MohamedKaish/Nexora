'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, CheckSquare, Zap, Flame, User, StickyNote } from 'lucide-react'

const MOBILE_ITEMS = [
  { name: 'World', href: '/dashboard', icon: Compass },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Notes', href: '/notes', icon: StickyNote },
  { name: 'Focus', href: '/focus', icon: Zap },
  { name: 'Habits', href: '/habits', icon: Flame },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 h-[calc(4rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] bg-stone-950/95 border-t border-stone-800/80 backdrop-blur-xl flex items-center justify-around px-2">
      {MOBILE_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center w-14 h-full gap-1 transition-colors ${
              isActive ? 'text-amber-400' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}
