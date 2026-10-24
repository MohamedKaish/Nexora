import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

let cachedClient: SupabaseClient | null = null

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseUrl.startsWith('https://') &&
    supabaseAnonKey &&
    supabaseAnonKey.length > 20
  )
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null
  }

  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }

  return cachedClient
}

/**
 * Initiates Google OAuth Sign-in via Supabase
 */
export async function signInWithGoogle(): Promise<{
  success: boolean
  error?: string
  url?: string
}> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Cannot authenticate during server render.' }
  }

  const client = getSupabaseClient()
  if (!client) {
    return {
      success: false,
      error: 'Supabase credentials not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your AI Studio Secrets panel.',
    }
  }

  try {
    const origin = window.location.origin
    const redirectTo = `${origin}/auth/callback`

    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (data?.url) {
      window.location.href = data.url
      return { success: true, url: data.url }
    }

    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Google OAuth failed'
    return { success: false, error: msg }
  }
}

/**
 * Signs out from Supabase Auth session
 */
export async function signOutFromSupabase(): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient()
  if (!client) return { success: true }

  try {
    const { error } = await client.auth.signOut()
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Sign out failed'
    return { success: false, error: msg }
  }
}

/**
 * Returns active Supabase user session if logged in
 */
export async function getSupabaseSession(): Promise<{ user: User | null; session: Session | null }> {
  const client = getSupabaseClient()
  if (!client) return { user: null, session: null }

  try {
    const { data, error } = await client.auth.getSession()
    if (error || !data.session) return { user: null, session: null }
    return { user: data.session.user, session: data.session }
  } catch {
    return { user: null, session: null }
  }
}
