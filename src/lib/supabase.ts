import { createClient, SupabaseClient, User, Session, AuthChangeEvent } from '@supabase/supabase-js'

export const DEFAULT_SUPABASE_URL = 'https://rruavarqxdotdsbbjvck.supabase.co'
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJydWF2YXJxeGRvdGRzYmJqdmNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NzM5MjQsImV4cCI6MjEwMTE0OTkyNH0.3SLbaEOaOWxnSqgiSXvLNwiSt6OJPdAzVQMyk2wmpKA'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY

let cachedClient: SupabaseClient | null = null

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseUrl.startsWith('https://') &&
    supabaseAnonKey &&
    supabaseAnonKey.length > 20
  )
}

export function getSupabaseProjectRef(): string {
  try {
    const url = new URL(supabaseUrl)
    return url.hostname.split('.')[0] || 'rruavarqxdotdsbbjvck'
  } catch {
    return 'rruavarqxdotdsbbjvck'
  }
}

export function getSupabaseClient(): SupabaseClient {
  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'nexora_supabase_auth_token',
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

  try {
    const origin = window.location.origin
    // Determine redirect URL: if running inside Android APK webview or web app
    const isNativeApk = typeof window !== 'undefined' && Boolean((window as unknown as { NexoraNativeBridge?: unknown }).NexoraNativeBridge)
    const redirectTo = isNativeApk ? `${origin}/auth/callback` : `${origin}/auth/callback`

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

  try {
    const { data, error } = await client.auth.getSession()
    if (error || !data.session) return { user: null, session: null }
    return { user: data.session.user, session: data.session }
  } catch {
    return { user: null, session: null }
  }
}

/**
 * Subscribes to real-time auth changes
 */
export function onSupabaseAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
) {
  const client = getSupabaseClient()
  const { data: { subscription } } = client.auth.onAuthStateChange(callback)
  return subscription
}
