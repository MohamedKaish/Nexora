'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updatePreferences(prefs: Record<string, unknown>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Filter out any extra keys that don't belong in the database schema
  const validColumns = [
    'theme', 'timezone', 'email_notifications', 'accent_color', 
    'strict_mode', 'ai_insights'
  ]
  
  const validPrefs = Object.keys(prefs)
    .filter(key => validColumns.includes(key))
    .reduce((obj, key) => {
      obj[key] = prefs[key]
      return obj
    }, {} as Record<string, unknown>)

  const { error, count } = await supabase
    .from('user_preferences')
    .update({ 
      ...validPrefs,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)
    .select('id')

  // If update didn't touch any rows, the row doesn't exist. Insert it.
  if (!error && (!count || count === 0)) {
    const { error: insertError } = await supabase
      .from('user_preferences')
      .insert({ 
        id: user.id, 
        ...validPrefs,
        updated_at: new Date().toISOString()
      })
    
    if (insertError) {
      // If RLS fails on insert because of missing INSERT policy, 
      // there might be a fallback or it's a critical DB issue.
      throw new Error(insertError.message)
    }
  } else if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/', 'layout')
  return { success: true }
}
