'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { logout } from '@/features/auth/actions'

export function HeaderUserProfile({ userEmail }: { userEmail?: string }) {
  const [guestName, setGuestName] = useState<string | null>(null)

  useEffect(() => {
    if (!userEmail) {
      setGuestName(localStorage.getItem('nexora_guest_name'))
    }
  }, [userEmail])

  if (userEmail) {
    return (
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
    )
  }

  return (
    <div className="flex items-center gap-3 border-l border-border pl-6">
      {guestName && (
        <span className="text-sm font-medium text-muted-foreground hidden md:inline-block">
          {guestName} (Guest)
        </span>
      )}
      <Link href="/login" className="rounded-full border border-border bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">
        Save / Sign in
      </Link>
    </div>
  )
}
