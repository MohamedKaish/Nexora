import { logout } from '@/features/auth/actions'
import { NotificationBell } from '@/features/notifications/components/NotificationBell'
import { SyncStatusIndicator } from '@/components/layout/SyncStatusIndicator'
import { MobileNav } from '@/components/layout/MobileNav'
import { HeaderUserProfile } from '@/components/layout/HeaderUserProfile'

export function Header({ userEmail }: { userEmail?: string }) {
  return (
    <header className="flex h-14 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-10 transition-all">
      <MobileNav />
      <div className="flex flex-1 items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex items-center space-x-6">
          <SyncStatusIndicator />
          <NotificationBell />
          <HeaderUserProfile userEmail={userEmail} />
        </div>
      </div>
    </header>
  )
}
