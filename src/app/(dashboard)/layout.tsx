import { AppShell } from '@/components/layout/AppShell'
import { Header } from '@/components/layout/Header'
import { createClient, getUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GlobalTimer } from '@/features/focus/components/GlobalTimer'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('accent_color')
    .eq('id', user.id)
    .single()

  const accentColor = prefs?.accent_color || '#6366f1'

  return (
    <AppShell accentColor={accentColor} header={<Header userEmail={user.email} />}>
      {children}
      <GlobalTimer />
    </AppShell>
  )
}
