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

  let accentColor = '#6366f1'
  
  if (user) {
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('accent_color')
      .eq('id', user.id)
      .single()
      
    if (prefs?.accent_color) {
      accentColor = prefs.accent_color
    }
  }

  return (
    <AppShell accentColor={accentColor} header={<Header userEmail={user?.email} />}>
      {children}
      <GlobalTimer />
    </AppShell>
  )
}
