import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { GuestOnboarding } from '@/features/auth/components/GuestOnboarding'

export default async function Home() {
  const { data: { user } } = await getUser()

  if (user) {
    redirect('/dashboard')
  }

  return <GuestOnboarding />
}
