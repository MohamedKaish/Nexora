'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Info, Trophy, CheckCheck, BrainCircuit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, Notification } from '../actions'

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'kyro' | 'reminder' | 'system'>('all')
  const menuRef = useRef<HTMLDivElement>(null)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    
    async function load() {
      try {
        const data = await getNotifications()
        setNotifications(data)
      } catch (e) {
        console.error("Failed to load notifications", e)
      }
    }
    load()

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const unreadCount = notifications.filter(n => !n.is_read).length

  const handleRead = async (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n))
    await markNotificationAsRead(id)
  }

  const handleMarkAllRead = async () => {
    setNotifications(notifications.map(n => ({ ...n, is_read: true })))
    await markAllNotificationsAsRead()
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'system': return <Info className="h-4 w-4 text-blue-500" />
      case 'reminder': return <Bell className="h-4 w-4 text-amber-500" />
      case 'achievement': return <Trophy className="h-4 w-4 text-emerald-500" />
      case 'kyro': return <BrainCircuit className="h-4 w-4 text-primary" />
      default: return <Info className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="relative hover:bg-secondary/80 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-full transition-colors">
        <Bell className="h-[20px] w-[20px] text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-rose shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.24)] z-50 overflow-hidden transform origin-top-right transition-all animate-in fade-in zoom-in-95">
          <div className="p-4 border-b border-border bg-secondary/30 flex items-center justify-between backdrop-blur-sm">
            <h3 className="font-semibold text-foreground">Notifications</h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-primary font-medium px-2 py-0.5 rounded-full bg-primary/10">{unreadCount} new</span>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  <CheckCheck className="h-3 w-3" /> Mark all read
                </button>
              )}
            </div>
          </div>
          <div className="flex border-b border-border/50 bg-card px-2">
            <button onClick={() => setFilter('all')} className={`text-xs px-3 py-2 font-medium border-b-2 ${filter === 'all' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}>All</button>
            <button onClick={() => setFilter('kyro')} className={`text-xs px-3 py-2 font-medium border-b-2 ${filter === 'kyro' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}>Kyro</button>
            <button onClick={() => setFilter('reminder')} className={`text-xs px-3 py-2 font-medium border-b-2 ${filter === 'reminder' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}>Reminders</button>
            <button onClick={() => setFilter('system')} className={`text-xs px-3 py-2 font-medium border-b-2 ${filter === 'system' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}>System</button>
          </div>
          <div className="max-h-[28rem] overflow-y-auto custom-scrollbar">
            {notifications.filter(n => filter === 'all' || n.type === filter).length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center justify-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                  <Bell className="h-5 w-5 text-muted-foreground opacity-50" />
                </div>
                <div className="text-sm text-muted-foreground">
                  You&apos;re all caught up!
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.filter(n => filter === 'all' || n.type === filter).map(notification => (
                  <div 
                    key={notification.id} 
                    className={`p-4 transition-colors hover:bg-secondary/50 cursor-pointer ${notification.is_read ? 'opacity-60 grayscale-[30%]' : 'bg-primary/5'}`}
                    onClick={() => !notification.is_read && handleRead(notification.id)}
                  >
                    <div className="flex justify-between items-start mb-1.5 gap-2">
                      <div className="flex items-center gap-2">
                        {getIcon(notification.type)}
                        <span className="font-medium text-sm text-foreground leading-tight">{notification.title}</span>
                      </div>
                      {!notification.is_read && (
                        <span className="h-2 w-2 mt-1.5 rounded-full bg-primary shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{notification.message}</p>
                    <span className="text-[10px] text-muted-foreground/60 mt-3 block font-medium tracking-wide">
                      {new Date(notification.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
