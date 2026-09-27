import { logout } from '@/features/auth/actions'
import { NotificationBell } from '@/features/notifications/components/NotificationBell'
import { SyncStatusIndicator } from '@/components/layout/SyncStatusIndicator'

export function Header({ userEmail }: { userEmail?: string }) {
  return (
    <header className="flex h-14 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-10 transition-all">
      <div className="flex flex-1 items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex items-center space-x-6">
          <SyncStatusIndicator />
          <NotificationBell />
          <div className="flex items-center gap-3 border-l border-border pl-6">
            <span className="text-sm font-medium text-muted-foreground hidden md:inline-block">
              {userEmail}
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-full border border-border bg-secondary px-4 py-1.5 text-sm font-medium text-foreground shadow-sm hover:bg-secondary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  )
}
