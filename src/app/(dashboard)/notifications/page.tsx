'use client'

import React, { useState, useEffect } from 'react'
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
  Clock,
  Droplets,
  Wallet,
  Settings2,
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import {
  getNotificationPermission,
  requestNotificationPermission,
} from '@/lib/notificationService'
import {
  NOTIFICATION_CHANNELS,
  getChannelPreferences,
  setChannelEnabled,
  getScheduledAlarms,
  openAndroidNotificationSettings,
  isAndroidNativeApp,
  NotificationChannelId,
  ScheduledAlarmRecord,
} from '@/lib/nativeNotificationScheduler'
import { toast } from 'sonner'

export default function NotificationsPage() {
  const [mounted, setMounted] = useState(false)
  const agentName = useAppStore((s) => s.agentConfig.name) || 'Kyro'
  const { notifications, markAllAsRead, clearAll, removeNotification, toggleRead } =
    useNotificationStore()

  const [filter, setFilter] = useState<'all' | 'unread' | 'habit'>('all')
  const [notifPermission, setNotifPermission] = useState<string>('default')
  const [channelPrefs, setChannelPrefs] = useState<Record<NotificationChannelId, boolean>>({
    nexora_tasks: true,
    nexora_habits: true,
    nexora_hydration: true,
    nexora_expenses: true,
  })
  const [scheduledAlarms, setScheduledAlarms] = useState<ScheduledAlarmRecord[]>([])

  useEffect(() => {
    setMounted(true)
    setNotifPermission(getNotificationPermission())
    setChannelPrefs(getChannelPreferences())
    setScheduledAlarms(getScheduledAlarms().filter((a) => a.enabled))
  }, [])

  const handleEnablePermissions = async () => {
    const perm = await requestNotificationPermission()
    setNotifPermission(perm)
    if (perm === 'granted') {
      toast.success('Android system notifications enabled! Scheduled reminders are active.')
    } else if (perm === 'denied') {
      toast.error(
        'Permission blocked. Open Android App Settings > Notifications to enable reminders.'
      )
    }
  }

  const handleToggleChannel = (channelId: NotificationChannelId, enabled: boolean) => {
    setChannelEnabled(channelId, enabled)
    setChannelPrefs(getChannelPreferences())
    setScheduledAlarms(getScheduledAlarms().filter((a) => a.enabled))
    toast.success(`${enabled ? 'Enabled' : 'Muted'} channel: ${channelId}`)
  }

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead
    if (filter === 'habit') return n.type === 'habit'
    return true
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  if (!mounted) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="h-20 rounded-2xl bg-stone-900/40 border border-stone-800/60 animate-pulse" />
        <div className="h-64 rounded-2xl bg-stone-900/40 border border-stone-800/60 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-gradient-gold">
            Android Notification &amp; Reminder Channels
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Manage Android system notification channels, scheduled alarms, and reminder logs.
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
              <span>Clear history</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Android Notification Permission Onboarding Card ─── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-stone-900/90 via-stone-950 to-stone-900/60 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-400/10 text-amber-400 shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-foreground">
                Android System Notification Permission (POST_NOTIFICATIONS)
              </span>
              {notifPermission === 'granted' ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-bold flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-3 h-3" /> Enabled
                </span>
              ) : notifPermission === 'denied' ? (
                <span className="px-2 py-0.5 rounded-full bg-rose-400/20 text-rose-300 text-[10px] font-bold font-mono">
                  Denied in System Settings
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold font-mono">
                  Permission Required
                </span>
              )}
            </div>
            <p className="text-xs text-stone-400 mt-1 leading-relaxed">
              {notifPermission === 'granted'
                ? 'Nexora can deliver task, habit, hydration, and expense reminders to your Android system notification shade and heads-up banners.'
                : notifPermission === 'denied'
                ? 'Notification permission was denied. To receive phone reminders, open Android Settings > Apps > Nexora > Notifications and enable alerts.'
                : 'Nexora requires notification permission to alert you at your scheduled task, habit, and water intake times.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {notifPermission !== 'granted' && (
            <button
              onClick={handleEnablePermissions}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(212,168,83,0.3)] transition-all cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Allow Notifications</span>
            </button>
          )}
          {isAndroidNativeApp() && (
            <button
              onClick={() => openAndroidNotificationSettings()}
              className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Android Channel Settings</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── 4 Android System Notification Channels ─── */}
      <div className="p-5 rounded-2xl bg-stone-950/80 border border-amber-500/25 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-800/80">
          <div>
            <h3 className="text-xs font-bold text-amber-300 font-mono uppercase tracking-wider">
              Android Notification Channels
            </h3>
            <p className="text-[11px] text-stone-400">
              Toggle individual reminder categories. Changes immediately update scheduled native alarms.
            </p>
          </div>
          <span className="text-[11px] font-mono text-emerald-400">
            {scheduledAlarms.length} active scheduled alarm(s)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {NOTIFICATION_CHANNELS.map((ch) => {
            const isEnabled = channelPrefs[ch.id] !== false
            const channelAlarmCount = scheduledAlarms.filter(
              (a) => a.channelId === ch.id
            ).length
            const ChannelIcon =
              ch.id === 'nexora_tasks'
                ? CheckCircle2
                : ch.id === 'nexora_habits'
                ? Flame
                : ch.id === 'nexora_hydration'
                ? Droplets
                : Wallet

            return (
              <div
                key={ch.id}
                className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800/80 flex items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-stone-950 border border-stone-800 text-amber-400 mt-0.5">
                    <ChannelIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-100">{ch.name}</span>
                      <span className="text-[10px] font-mono text-stone-400 px-1.5 py-0.2 rounded bg-stone-950 border border-stone-800">
                        {channelAlarmCount} scheduled
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 mt-0.5">{ch.description}</p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(e) => handleToggleChannel(ch.id, e.target.checked)}
                  className="accent-amber-400 w-4 h-4 cursor-pointer shrink-0"
                />
              </div>
            )
          })}
        </div>

        {/* Upcoming Scheduled Alarms Preview */}
        {scheduledAlarms.length > 0 && (
          <div className="pt-3 border-t border-stone-800/80 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block">
              Next Scheduled Device Reminders:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {scheduledAlarms
                .slice()
                .sort((a, b) => a.triggerAtMs - b.triggerAtMs)
                .slice(0, 6)
                .map((alarm) => (
                  <div
                    key={alarm.id}
                    className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-800 text-xs flex flex-col justify-between gap-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-stone-200 truncate">{alarm.title}</span>
                      <span className="text-[10px] font-mono text-amber-300 shrink-0 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {format(new Date(alarm.triggerAtMs), 'HH:mm')}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 line-clamp-1">{alarm.body}</p>
                  </div>
                ))}
            </div>
          </div>
        )}
        {/* Android OS Alarm & Battery Optimization Disclosure */}
        <div className="pt-2 border-t border-stone-800/80 text-[11px] text-stone-400 leading-relaxed">
          <span className="font-bold text-stone-300">Android OS Delivery &amp; Battery Note:</span>{' '}
          Task and habit reminders use native <span className="font-mono text-stone-300">AlarmManager</span> scheduling and persist across app closure and device reboot. On Android 12+ (API 31+), if exact alarms or unrestricted battery usage are disabled by the OS or OEM battery savers (Doze mode), Android may defer delivery by a few minutes until the next maintenance window.
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
            <h3 className="text-base font-bold text-foreground">No recent reminder logs</h3>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              Delivered task, habit, hydration, and expense reminders will be logged here.
            </p>
          </div>
        ) : (
          filtered.map((n) => {
            const Icon =
              n.type === 'kyro'
                ? Sparkles
                : n.type === 'habit'
                ? Flame
                : n.type === 'hydration'
                ? Droplets
                : n.type === 'expense'
                ? Wallet
                : n.type === 'focus'
                ? Zap
                : CheckCircle2

            const iconStyle =
              n.type === 'kyro'
                ? 'bg-amber-400/15 text-amber-300 border-amber-400/30'
                : n.type === 'habit'
                ? 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30'
                : n.type === 'hydration'
                ? 'bg-sky-400/15 text-sky-300 border-sky-400/30'
                : n.type === 'expense'
                ? 'bg-amber-400/15 text-amber-300 border-amber-400/30'
                : n.type === 'focus'
                ? 'bg-purple-400/15 text-purple-300 border-purple-400/30'
                : 'bg-sky-400/15 text-sky-300 border-sky-400/30'

            return (
              <div
                key={n.id}
                onClick={() => toggleRead(n.id)}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 cursor-pointer ${
                  !n.isRead
                    ? 'bg-stone-900/90 border-amber-400/30 shadow-[0_4px_20px_rgba(0,0,0,0.25)]'
                    : 'bg-stone-950/50 border-stone-800/70 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${iconStyle}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-foreground">{n.title}</h4>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      )}
                      <span className="text-[10px] text-stone-500 font-medium">
                        {format(new Date(n.timestamp), 'MMM d, h:mm a')}
                      </span>
                    </div>

                    <p className="text-xs text-stone-300 leading-relaxed">{n.message}</p>

                    {n.link && (
                      <div className="pt-1">
                        <Link
                          href={n.link}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300"
                        >
                          <span>Open Destination</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeNotification(n.id)
                  }}
                  className="p-1.5 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-stone-800/60 transition-colors shrink-0 cursor-pointer"
                  title="Delete log"
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
