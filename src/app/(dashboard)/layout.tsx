import { AppShell } from '@/components/layout/AppShell'
import { Header } from '@/components/layout/Header'
import { getUser } from '@/lib/supabase/server'
import { GlobalTimer } from '@/features/focus/components/GlobalTimer'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // In local-first mode, we don't block the server layout on Supabase auth.
  // The client-side AuthProvider and HydrationProvider handle user state.
  const userEmail: string | undefined = undefined
  const accentColor = '#6366f1'

  return (
    <AppShell accentColor={accentColor} header={<Header userEmail={userEmail} />}>
      {children}
      <GlobalTimer />
    </AppShell>
  )
}
