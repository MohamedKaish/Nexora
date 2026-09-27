import { createClient, getUser } from '@/lib/supabase/server'
import { SettingsForm } from '@/features/settings/components/SettingsForm'

export const metadata = {
  title: 'Settings - Nexora'
}

import { Suspense } from 'react'

async function SettingsContent() {
  const supabase = await createClient()
  const { data: { user } } = await getUser()

  let prefs = null
  if (user) {
    const { data } = await supabase.from('user_preferences').select('*').eq('id', user.id).single()
    prefs = data
  }

  return <SettingsForm initialPrefs={prefs} />
}

export default function SettingsPage() {
  return (
    <div className="flex-1 space-y-8 p-8 pt-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-gray-500 mt-1">Manage your Nexora experience.</p>
      </div>
      <div className="mt-8">
        <Suspense fallback={<div className="animate-pulse h-[600px] bg-secondary/30 rounded-xl" />}>
          <SettingsContent />
        </Suspense>
      </div>
    </div>
  )
}
