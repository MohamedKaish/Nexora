'use client'

import React, { useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import {
  Bell,
  Sparkles,
  CheckCircle2,
  Flame,
  Zap,
  Trash2,
  Check,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
} from '@/lib/notificationService'
import { toast } from 'sonner'

export default function NotificationsPage() {
  const agentName = useAppStore((s) => s.agentConfig.name) || 'Kyro'
  const { notifications, markAllAsRead, clearAll, removeNotification, toggleRead } =
    useNotificationStore()

  const [filter, setFilter] = useState<'all' | 'unread' | 'habit'>('all')
  const [notifPermission, setNotifPermission] = useState<string>('default')

  React.useEffect(() => {
    setNotifPermission(getNotificationPermission())
  }, [])

  const handleEnablePermissions = async () => {
    const perm = await requestNotificationPermission()
    setNotifPermission(perm)
    if (perm === 'granted') {
      toast.success('System notifications enabled! You will receive timely alerts.')
    } else if (perm === 'denied') {
      toast.error('Permission blocked. Please allow notifications in site settings.')
    }
  }

  const handleTestAlert = async () => {
    await sendTestNotification()
    toast.success('System transmission test dispatched with sound and haptics.')
  }

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead
    if (filter === 'habit') return n.type === 'habit'
    return true
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-gradient-gold">
            Sanctuary Transmissions
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Real-time logs, habit timing alerts, and broadcasts from {agentName}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 hover:border-amber-400/40 text-stone-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 text-amber-400" />
              <span>Mark all read</span>
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 hover:border-rose-400/40 text-stone-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear inbox</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Device Hardware Alert Status Bar ─── */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-stone-900/90 via-stone-950 to-stone-900/60 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-400/10 text-amber-400 shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">Phone & Desktop Push Relay</span>
              {notifPermission === 'granted' ? (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-bold flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-2.5 h-2.5" /> Hardware Linked
                </span>
              ) : notifPermission === 'denied' ? (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-400/20 text-rose-300 text-[10px] font-bold font-mono">
                  Blocked in Browser
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold font-mono">
                  Permission Pending
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-400">
              {notifPermission === 'granted'
                ? 'Push notifications and haptic vibrations are active on this device.'
                : notifPermission === 'denied'
                ? 'Notifications are blocked. Tap the lock icon in your URL bar to allow alerts.'
                : 'Grant permission to receive hardware push alerts when habit timing windows open.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
          {notifPermission !== 'granted' && (
            <button
              onClick={handleEnablePermissions}
              className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(212,168,83,0.3)] transition-all cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Allow Phone Alerts</span>
            </button>
          )}

          <button
            onClick={handleTestAlert}
            className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-amber-400 text-amber-300 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Dispatch a test alert with sound, vibration, and inbox transmission"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Test Phone System</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-stone-800/80 pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-amber-400 text-stone-950 font-bold shadow'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          All Transmissions ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            filter === 'unread'
              ? 'bg-amber-400 text-stone-950 font-bold shadow'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('habit')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
            filter === 'habit'
              ? 'bg-amber-400 text-stone-950 font-bold shadow'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Habit Alerts ({notifications.filter((n) => n.type === 'habit').length})</span>
        </button>
      </div>

      {/* Notifications List */}
      <div className="world-deck p-4 sm:p-6 space-y-3">
        {filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Bell className="w-10 h-10 text-stone-600 mx-auto" />
            <h3 className="text-base font-bold text-foreground">Inbox is tranquil</h3>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              No pending transmissions from your habit schedules or {agentName}.
            </p>
          </div>
        ) : (
          filtered.map((n) => {
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
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                  !n.isRead
                    ? 'bg-stone-900/80 border-amber-400/40 shadow-sm ring-1 ring-amber-400/20'
                    : 'bg-stone-950/40 border-stone-800/60 opacity-80'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    onClick={() => toggleRead(n.id)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 cursor-pointer ${
                      n.type === 'habit'
                        ? 'bg-amber-400/10 text-amber-400'
                        : n.type === 'kyro'
                        ? 'bg-purple-400/10 text-purple-400'
                        : n.type === 'focus'
                        ? 'bg-emerald-400/10 text-emerald-400'
                        : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        onClick={() => toggleRead(n.id)}
                        className={`text-sm font-bold cursor-pointer ${
                          !n.isRead ? 'text-foreground' : 'text-stone-300'
                        }`}
                      >
                        {n.title}
                      </h4>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                      )}
                      <span className="text-[11px] text-stone-500 font-mono" suppressHydrationWarning>
                        {format(new Date(n.timestamp), 'MMM d, HH:mm')}
                      </span>
                    </div>

                    <p
                      onClick={() => toggleRead(n.id)}
                      className="text-xs text-stone-400 leading-relaxed cursor-pointer"
                    >
                      {n.message}
                    </p>

                    {n.link && (
                      <div className="pt-1">
                        <Link
                          href={n.link}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300"
                        >
                          <span>Open Workspace</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleRead(n.id)}
                    className="p-1.5 rounded-lg text-stone-500 hover:text-amber-400 hover:bg-stone-800/60 transition-colors cursor-pointer"
                    title={n.isRead ? 'Mark unread' : 'Mark read'}
                  >
                    <Check className={`w-3.5 h-3.5 ${n.isRead ? 'opacity-40' : 'text-amber-400'}`} />
                  </button>
                  <button
                    onClick={() => removeNotification(n.id)}
                    className="p-1.5 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-stone-800/60 transition-colors cursor-pointer"
                    title="Delete notification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
