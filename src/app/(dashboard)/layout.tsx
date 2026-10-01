import { AppShell } from '@/components/layout/AppShell'
import { GlobalTimer } from '@/features/focus/components/GlobalTimer'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppShell>
      {children}
      <GlobalTimer />
    </AppShell>
  )
}
