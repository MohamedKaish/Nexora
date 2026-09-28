import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'

export default async function Home() {
  const { data: { user } } = await getUser()

  if (user) {
    redirect('/dashboard')
  }

  redirect('/login')
}
