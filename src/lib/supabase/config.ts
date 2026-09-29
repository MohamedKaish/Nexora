/**
 * Canonical Supabase configuration for Nexora.
 * 
 * In production: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 * must be set as Vercel environment variables.
 * 
 * In development: Set them in .env.local.
 */

export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (!url) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
      'Set it in .env.local for development or in Vercel for production.'
    )
  }
  return url
}

export function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. ' +
      'Set it in .env.local for development or in Vercel for production.'
    )
  }
  // Reject publishable-format keys that aren't valid JWTs
  if (key.startsWith('sb_publishable_')) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be a publishable key format. ' +
      'PostgREST requires the JWT-format anon key from Supabase Dashboard → Settings → API.'
    )
  }
  return key
}
