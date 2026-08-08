import { getNotifications } from '@/features/notifications/actions'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Bell, Info, Trophy, BrainCircuit } from 'lucide-react'

export const metadata = {
  title: 'Notifications - Nexora',
}

export default async function NotificationsPage() {
  const notifications = await getNotifications()

  const getIcon = (type: string) => {
    switch (type) {
      case 'system': return <Info className="h-5 w-5 text-blue-500" />
      case 'reminder': return <Bell className="h-5 w-5 text-amber-500" />
      case 'achievement': return <Trophy className="h-5 w-5 text-emerald-500" />
      case 'kyro': return <BrainCircuit className="h-5 w-5 text-primary" />
      default: return <Info className="h-5 w-5 text-muted-foreground" />
    }
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight">Inbox</h2>
          <p className="text-muted-foreground font-medium">Review your system alerts and Kyro scheduling insights.</p>
        </div>
      </div>
      
      <Card className="glass-card rounded-[20px]">
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="text-lg font-bold">All Notifications</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {notifications.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center justify-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
                  <Bell className="h-8 w-8 text-muted-foreground opacity-50" />
                </div>
                <div className="text-muted-foreground font-medium text-lg">
                  You&apos;re all caught up!
                </div>
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`p-6 transition-colors hover:bg-secondary/30 ${notification.is_read ? 'opacity-70' : 'bg-primary/5'}`}
                >
                  <div className="flex gap-4">
                    <div className="mt-1 flex-shrink-0">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-foreground text-[15px]">{notification.title}</span>
                        {!notification.is_read && (
                          <span className="h-2.5 w-2.5 rounded-full bg-primary shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{notification.message}</p>
                      <span className="text-xs text-muted-foreground/70 font-semibold block pt-2">
                        {new Date(notification.created_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
