/**
 * Canonical Supabase configuration for Nexora.
 * Ensures consistent project URL and valid JWT anon key across server, client, and middleware.
 */

export const DEFAULT_SUPABASE_URL = 'https://rruavarqxdotdsbbjvck.supabase.co'
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJydWF2YXJxeGRvdGRzYmJqdmNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NzM5MjQsImV4cCI6MjEwMTE0OTkyNH0.3SLbaEOaOWxnSqgiSXvLNwiSt6OJPdAzVQMyk2wmpKA'

export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL
}

export function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  // PostgREST requires a valid JWT for the anon role; fallback if missing or publishable-only format
  if (!key || key.startsWith('sb_publishable_')) {
    return DEFAULT_SUPABASE_ANON_KEY
  }
  return key
}
