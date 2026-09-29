import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Auth callback handler for Supabase Auth.
 * Handles: email verification, password reset, and OAuth callbacks (Google).
 * 
 * Security: Validates the `next` redirect parameter to prevent open redirect attacks.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  // SECURITY: Validate redirect target to prevent open redirect attacks.
  // Only allow relative paths starting with '/' and not '//' (protocol-relative URLs).
  const isValidRedirect =
    next.startsWith('/') &&
    !next.startsWith('//') &&
    !next.includes('://') &&
    !next.includes('\\')

  const safeRedirect = isValidRedirect ? next : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(safeRedirect, requestUrl.origin))
    }
    console.error('[Auth Callback] exchangeCodeForSession failed:', error.message)
  }

  return NextResponse.redirect(
    new URL('/login?error=Verification%20failed%20or%20link%20expired', requestUrl.origin)
  )
}
