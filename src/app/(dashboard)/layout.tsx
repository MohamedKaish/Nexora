import { AppShell } from '@/components/layout/AppShell'
import { Header } from '@/components/layout/Header'
import { getUser } from '@/lib/supabase/server'
import { GlobalTimer } from '@/features/focus/components/GlobalTimer'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let userEmail: string | undefined = undefined
  let accentColor = '#6366f1'

  try {
    const { data: { user } } = await getUser()
    userEmail = user?.email ?? undefined

    if (user) {
      // Only query Supabase preferences for authenticated users
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('accent_color')
        .eq('id', user.id)
        .single()

      if (prefs?.accent_color) {
        accentColor = prefs.accent_color
      }
    }
  } catch {
    // Guest mode — no auth, no Supabase query. This is fine.
  }

  return (
    <AppShell accentColor={accentColor} header={<Header userEmail={userEmail} />}>
      {children}
      <GlobalTimer />
    </AppShell>
  )
}
