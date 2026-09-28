import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/supabase/config'

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
        await new Promise((resolve) => setTimeout(resolve, 600))
        return await fetch(input, init)
      }
    } catch {
      // ignore
    }
  }
  return res
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = getSupabaseUrl()
  const supabaseAnonKey = getSupabaseAnonKey()

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
        global: {
          fetch: clockSkewResilientFetch,
        },
      }
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser().
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Protected routes condition
    const pathname = request.nextUrl.pathname
    const isPublicAuthRoute = 
      pathname.startsWith('/login') || 
      pathname.startsWith('/register') || 
      pathname.startsWith('/forgot-password') ||
      pathname.startsWith('/reset-password') ||
      pathname.startsWith('/auth')
    
    if (
      !user &&
      !isPublicAuthRoute &&
      pathname !== '/' &&
      !pathname.startsWith('/api')
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      const redirectResponse = NextResponse.redirect(url)
      // Preserve cookies that may have been updated by Supabase (e.g. refreshed tokens)
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
      })
      return redirectResponse
    }

    // Only redirect authenticated users away from login, register, and forgot-password
    // (Allow /reset-password and /auth/callback so recovery flow can complete)
    const shouldRedirectLoggedIn =
      pathname.startsWith('/login') ||
      pathname.startsWith('/register') ||
      pathname.startsWith('/forgot-password')

    if (user && shouldRedirectLoggedIn) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      const redirectResponse = NextResponse.redirect(url)
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
      })
      return redirectResponse
    }
    
    if (user && request.nextUrl.pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      const redirectResponse = NextResponse.redirect(url)
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
      })
      return redirectResponse
    }
  } catch (error) {
    console.error('[Middleware/Proxy] Auth session update encountered an error:', error)
  }

  return supabaseResponse
}
