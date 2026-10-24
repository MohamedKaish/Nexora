'use client'

import React, { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAppStore } from '@/store/appStore'
import { NexoraLogo } from '@/components/brand/NexoraLogo'
import {
  X,
  Compass,
  CheckSquare,
  Flame,
  Zap,
  Target,
  FolderKanban,
  Clock,
  Calendar,
  BarChart3,
  Bot,
  User,
  Settings,
  Bell,
  Sparkles,
  Moon,
  Sun,
  Shield,
  Crown,
  ChevronRight,
  Download,
  StickyNote,
} from 'lucide-react'
import { usePwa } from '@/components/pwa/PwaProvider'

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
}

interface DrawerSection {
  title: string
  items: Array<{
    name: string
    href: string
    icon: React.ComponentType<{ className?: string }>
    badge?: string
  }>
}

const DRAWER_SECTIONS: DrawerSection[] = [
  {
    title: 'Core Habitat',
    items: [
      { name: 'Sanctuary World', href: '/dashboard', icon: Compass },
      { name: 'Task Matrix', href: '/tasks', icon: CheckSquare },
      { name: 'Habit Momentum', href: '/habits', icon: Flame },
      { name: 'Notes & Vault', href: '/notes', icon: StickyNote },
      { name: 'Focus Chamber', href: '/focus', icon: Zap },
    ],
  },
  {
    title: 'Horizon Planning',
    items: [
      { name: 'Goal Horizons', href: '/goals', icon: Target },
      { name: 'Workspaces', href: '/projects', icon: FolderKanban },
      { name: 'Weekly Timetable', href: '/timetable', icon: Clock },
      { name: 'Calendar Sync', href: '/calendar', icon: Calendar },
    ],
  },
  {
    title: 'Intelligence & Lore',
    items: [
      { name: 'Performance Intelligence', href: '/analytics', icon: BarChart3 },
      { name: 'Companion Atelier', href: '/character', icon: Sparkles },
      { name: 'Kyro Assistant', href: '/agent', icon: Bot },
      { name: 'Activity Inbox', href: '/notifications', icon: Bell },
    ],
  },
  {
    title: 'System & Account',
    items: [
      { name: 'Explorer Profile', href: '/account', icon: User },
      { name: 'Sanctuary Settings', href: '/settings', icon: Settings },
    ],
  },
]

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const pathname = usePathname()
  const userName = useAppStore((s) => s.preferences.displayName) || 'Explorer'
  const agentName = useAppStore((s) => s.agentConfig.name) || 'Kyro'
  const theme = useAppStore((s) => s.preferences.theme)
  const setTheme = useAppStore((s) => s.setTheme)
  const { isInstalled, openDownloadModal } = usePwa()
  const liveAppUrl = 'https://nexora-nine-kappa.vercel.app'
  const apkBuilderUrl = `https://www.pwabuilder.com?url=${encodeURIComponent(liveAppUrl)}`

  const drawerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Touch swipe to close (swipe left anywhere inside drawer)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return
    const diffX = e.changedTouches[0].clientX - touchStartX.current
    const diffY = e.changedTouches[0].clientY - touchStartY.current

    // If swiped left by > 50px and not mostly vertical
    if (diffX < -50 && Math.abs(diffY) < 100) {
      onClose()
    }
    touchStartX.current = null
    touchStartY.current = null
  }

  if (!isOpen) return null

  return (
    <div className="lg:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Drawer Panel */}
      <div
        ref={drawerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-80 max-w-[85vw] h-full bg-stone-950/98 border-r border-amber-400/25 shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-300 overflow-hidden"
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between gap-3 bg-stone-900/60">
          <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2">
            <NexoraLogo size={32} showText={true} showBadge={true} />
          </Link>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800/80 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card Profile Banner */}
        <div className="p-4 border-b border-stone-800/80 bg-gradient-to-r from-amber-500/10 via-transparent to-transparent">
          <Link
            href="/account"
            onClick={onClose}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-stone-900/60 transition-colors group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border border-amber-400/60 flex items-center justify-center text-sm font-bold text-stone-950 shrink-0 shadow-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <span className="text-sm font-bold text-foreground block truncate group-hover:text-amber-300 transition-colors">
                  {userName}
                </span>
                <span className="text-[11px] text-amber-400/90 font-mono font-semibold flex items-center gap-1">
                  <Crown className="w-3 h-3" /> Novice Explorer
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-500 group-hover:text-amber-400 transition-colors shrink-0" />
          </Link>
        </div>

        {/* Mode / Theme Switching Section (As requested for mobile) */}
        <div className="px-4 py-3 border-b border-stone-800 bg-stone-900/30 space-y-2">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
            Atmosphere Mode
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setTheme('dark')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-amber-400 text-stone-950 shadow-md font-extrabold'
                  : 'bg-stone-900/80 text-stone-300 hover:text-white border border-stone-800'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Dark Space</span>
            </button>

            <button
              onClick={() => setTheme('light')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-amber-400 text-stone-950 shadow-md font-extrabold'
                  : 'bg-stone-900/80 text-stone-300 hover:text-white border border-stone-800'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Sanctuary</span>
            </button>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {DRAWER_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-1">
              <h4 className="px-2.5 py-1 text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                {section.title}
              </h4>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  const displayName = item.name.replace('Kyro Assistant', `${agentName} Assistant`)

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30 shadow-sm'
                          : 'text-stone-300 hover:text-stone-100 hover:bg-stone-900/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-stone-400'}`} />
                        <span>{displayName}</span>
                      </div>
                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(212,168,83,0.8)]" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] border-t border-stone-800/80 bg-stone-900/50 space-y-2">
          {!isInstalled && (
            <div className="space-y-1.5">
              <a
                href="/download/Nexora.apk"
                download="Nexora.apk"
                onClick={onClose}
                className="w-full px-3 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Android APK</span>
              </a>

              <Link
                href="/download"
                onClick={onClose}
                className="w-full px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3 h-3 text-amber-400" />
                <span>Download Hub (APK &amp; PWA)</span>
              </Link>
            </div>
          )}

          <div className="flex items-center justify-between text-[10px] text-stone-500 px-1 pt-1">
            <div className="flex items-center gap-2">
              <Link href="/terms" onClick={onClose} className="hover:text-amber-400 transition-colors">Terms</Link>
              <span>·</span>
              <Link href="/privacy" onClick={onClose} className="hover:text-amber-400 transition-colors">Privacy</Link>
            </div>
            <span className="flex items-center gap-1 text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
