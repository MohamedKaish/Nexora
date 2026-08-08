'use client'

import { useFocusStore } from '@/store/useFocusStore'
import { Sidebar } from './Sidebar'
export function AppShell({ children, header, accentColor }: { children: React.ReactNode, header: React.ReactNode, accentColor: string }) {
  const isFullScreen = useFocusStore((state) => state.isFullScreen)

  if (isFullScreen) {
    return (
      <div 
        className="min-h-screen w-full bg-background relative z-0 flex flex-col"
        style={{
          '--primary': accentColor,
          '--ring': accentColor,
        } as React.CSSProperties}
      >
        <main className="flex flex-1 flex-col relative z-0 items-center justify-center min-h-screen">
          {children}
        </main>
      </div>
    )
  }

  return (
    <div 
      className="grid min-h-screen w-full md:grid-cols-[256px_1fr]"
      style={{
        '--primary': accentColor,
        '--ring': accentColor,
        '--sidebar-primary': accentColor,
        '--sidebar-ring': accentColor,
      } as React.CSSProperties}
    >
      <Sidebar />
      <div className="flex flex-col min-w-0">
        {header}
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background relative z-0 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
