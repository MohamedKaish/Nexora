import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from '@/features/settings/components/SettingsForm'

export const metadata = {
  title: 'Settings - Nexora'
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let prefs = null
  if (user) {
    const { data } = await supabase.from('user_preferences').select('*').eq('id', user.id).single()
    prefs = data
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-gray-500 mt-1">Manage your Nexora experience.</p>
      </div>
      <div className="mt-8">
        <SettingsForm initialPrefs={prefs} />
      </div>
    </div>
  )
}
