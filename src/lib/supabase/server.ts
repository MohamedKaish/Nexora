import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.types'
import { cache } from 'react'
import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/supabase/config'

/**
 * Resilient fetch that gracefully handles transient cloud clock-skew ("JWT issued at future")
 * between Supabase Gotrue Auth and PostgREST containers.
 */
async function clockSkewResilientFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const res = await fetch(input, init)
  if (res.status === 401) {
    try {
      const clone = res.clone()
      const text = await clone.text()
      if (text.includes('JWT issued at future')) {
        // Wait 600ms for PostgREST server clock to catch up with Gotrue JWT iat timestamp
        await new Promise((resolve) => setTimeout(resolve, 600))
        return await fetch(input, init)
      }
    } catch {
      // Return original response if cloning/reading fails
    }
  }
  return res
}

export const createClient = cache(async () => {
  const cookieStore = await cookies()

  const supabaseUrl = getSupabaseUrl()
  const supabaseAnonKey = getSupabaseAnonKey()

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
      global: {
        fetch: clockSkewResilientFetch,
      },
    }
  )
})

export const getUser = cache(async () => {
  try {
    const supabase = await createClient()
    return await supabase.auth.getUser()
  } catch (error: unknown) {
    // Let Next.js internal control-flow exceptions (dynamic bailout, redirects, not-found) propagate
    const errObj = error as { digest?: string } | null | undefined
    if (
      errObj &&
      typeof errObj === 'object' &&
      (errObj.digest === 'DYNAMIC_SERVER_USAGE' ||
        (typeof errObj.digest === 'string' && errObj.digest.startsWith('NEXT_')))
    ) {
      throw error
    }
    console.error('Failed to get user in getUser():', error)
    return { data: { user: null }, error }
  }
})
