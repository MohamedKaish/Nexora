import { AppShell } from '@/components/layout/AppShell'
import { Header } from '@/components/layout/Header'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('accent_color')
    .eq('id', user.id)
    .single()

  const accentColor = prefs?.accent_color || '#6366f1'

  // Extract HSL or OKLCH from the hex to set as CSS variables if possible, 
  // but next-themes uses OKLCH in globals.css. We can just set the CSS 
  // variable to the raw hex for now and let the browser handle it if we modify 
  // the CSS variables to accept standard colors or hex.
  // Wait, in globals.css, --primary is oklch(...). 
  // Actually, setting --primary: ${accentColor} in a style tag is valid if the CSS doesn't wrap it in an `oklch()` wrapper when consuming. 
  // Let's check how --primary is consumed. Tailwind usually consumes it directly. 
  // In `globals.css`: `@theme inline { --color-primary: var(--primary); }`. 
  // So setting `--primary: ${accentColor}` will work directly as a hex value.

  return (
    <AppShell accentColor={accentColor} header={<Header />}>
      {children}
    </AppShell>
  )
}
