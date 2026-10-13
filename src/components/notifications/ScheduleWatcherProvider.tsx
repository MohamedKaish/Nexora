'use client'

import React, { useEffect, useState } from 'react'
import { startScheduleNotificationWatcher } from '@/lib/scheduleNotificationWatcher'
import { getNotificationPermission, requestNotificationPermission, sendTestNotification } from '@/lib/notificationService'
import { Bell, X, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

export function ScheduleWatcherProvider() {
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false)

  useEffect(() => {
    // 1. Start background schedule watcher for task & habit 15m and start alerts
    startScheduleNotificationWatcher()

    // 2. Check if we should politely prompt for phone/browser notification permission
    const perm = getNotificationPermission()
    const dismissed = sessionStorage.getItem('nexora_notif_prompt_dismissed')

    if (perm === 'default' && !dismissed) {
      // Delay prompt slightly so user gets oriented first
      const timer = setTimeout(() => {
        setShowPermissionPrompt(true)
      }, 3500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleGrant = async () => {
    setShowPermissionPrompt(false)
    const res = await requestNotificationPermission()
    if (res === 'granted') {
      toast.success('Phone alerts enabled! You will be alerted 15m before tasks and habit windows.')
      await sendTestNotification()
    } else {
      toast.info('Notification preference saved.')
    }
  }

  const handleDismiss = () => {
    setShowPermissionPrompt(false)
    sessionStorage.setItem('nexora_notif_prompt_dismissed', 'true')
  }

  if (!showPermissionPrompt) return null

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 max-w-sm w-[calc(100vw-2rem)] p-4 rounded-2xl bg-stone-900/95 border border-amber-400/40 shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-amber-400/10 text-amber-400 shrink-0">
          <Bell className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-stone-100 flex items-center gap-1.5">
              <span>Enable Phone Alerts</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-mono">
                15m Reminders
              </span>
            </h4>
            <button
              onClick={handleDismiss}
              className="text-stone-500 hover:text-stone-300 p-0.5 rounded cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-stone-400 leading-relaxed">
            Allow phone notifications so your device rings and vibrates 15 minutes before scheduled tasks and habit windows open.
          </p>
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={handleGrant}
              className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Allow Phone Alerts</span>
            </button>
            <button
              onClick={handleDismiss}
              className="py-1.5 px-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 text-xs transition-colors cursor-pointer"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
