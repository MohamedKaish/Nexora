'use client'

import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { WorldBackground } from '@/features/companion/WorldBackground'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <WorldBackground variant="default">
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <main className="flex-1 flex flex-col min-h-screen overflow-hidden pb-20 md:pb-0">
          <div className="flex-1 page-enter">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        <MobileNav />
      </div>
    </WorldBackground>
  )
}
