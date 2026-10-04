'use client'

import React, { useState } from 'react'
import { useAppStore } from '@/store/appStore'
import {
  Bell,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Flame,
  Zap,
  Trash2,
  Check,
} from 'lucide-react'
import { format } from 'date-fns'

interface NotificationItem {
  id: string
  title: string
  message: string
  type: 'kyro' | 'habit' | 'focus' | 'task'
  timestamp: string
  isRead: boolean
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n-1',
    title: 'Kyro Contextual Insight',
    message: 'You have cleared 3 tasks today! A 25-minute focus session will finalize your momentum.',
    type: 'kyro',
    timestamp: new Date().toISOString(),
    isRead: false,
  },
  {
    id: 'n-2',
    title: 'Habit Streak Alert',
    message: 'Your top habit chain is active! Check in before midnight to protect your streak.',
    type: 'habit',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    isRead: false,
  },
  {
    id: 'n-3',
    title: 'Focus Chamber Logged',
    message: 'Completed 25m Pomodoro Focus session in the Deep Work sanctuary.',
    type: 'focus',
    timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
    isRead: true,
  },
  {
    id: 'n-4',
    title: 'Sanctuary Online',
    message: 'Nexora Living Operating System initialized and synchronized.',
    type: 'task',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    isRead: true,
  },
]

export default function NotificationsPage() {
  const agentName = useAppStore((s) => s.agentConfig.name) || 'Kyro'
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS)

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const deleteOne = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const toggleOne = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-gradient-gold">
            Sanctuary Transmissions
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Logs, alerts from {agentName}, and milestone broadcasts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={markAllAsRead}
            className="px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 hover:border-amber-400/40 text-stone-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 text-amber-400" />
            <span>Mark all read</span>
          </button>
          <button
            onClick={clearAll}
            className="px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 hover:border-rose-400/40 text-stone-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear inbox</span>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="world-deck p-6 space-y-3">
        {notifications.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Bell className="w-10 h-10 text-stone-600 mx-auto" />
            <h3 className="text-base font-bold text-foreground">Inbox is tranquil</h3>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              No pending transmissions from {agentName} or your habitat.
            </p>
          </div>
        ) : (
          notifications.map((n) => {
            const Icon =
              n.type === 'kyro'
                ? Sparkles
                : n.type === 'habit'
                ? Flame
                : n.type === 'focus'
                ? Zap
                : CheckCircle2

            return (
              <div
                key={n.id}
                onClick={() => toggleOne(n.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                  !n.isRead
                    ? 'bg-amber-400/10 border-amber-400/40'
                    : 'bg-stone-900/60 border-stone-800/80 hover:border-stone-700'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                      n.type === 'kyro'
                        ? 'bg-amber-400/20 text-amber-400'
                        : n.type === 'habit'
                        ? 'bg-orange-400/20 text-orange-400'
                        : n.type === 'focus'
                        ? 'bg-blue-400/20 text-blue-400'
                        : 'bg-emerald-400/20 text-emerald-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-foreground">{n.title}</h4>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-stone-300 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-stone-500 font-mono">
                      {format(new Date(n.timestamp), 'MMM dd, HH:mm')}
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteOne(n.id)
                  }}
                  className="p-1.5 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-stone-800 transition-colors"
                  title="Remove transmission"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
