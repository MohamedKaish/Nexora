'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { rateLimits } from '@/lib/rate-limit'

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
})

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Full name must be at least 2 characters.').max(100),
  email: z.string().trim().email('Please enter a valid email address.').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
})

/**
 * Builds the correct callback URL for email verification and password reset.
 * Uses NEXT_PUBLIC_SITE_URL (must be set in Vercel for production).
 */
function getCallbackUrl(nextPath = '/dashboard'): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  return `${siteUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`
}

/**
 * Sanitizes Supabase Auth error messages for safe display to end users.
 * Prevents leaking internal implementation details.
 */
function sanitizeAuthError(error: { message: string; code?: string; status?: number }): string {
  // Log the raw error on the server for debugging
  console.error('[Auth Error]', error)

  const msg = error.message?.toLowerCase() || ''
  const code = error.code || ''

  if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
    return 'Invalid email or password. Please verify your credentials and try again.'
  }
  if (msg.includes('email not confirmed')) {
    return 'Email not verified. Please check your inbox (and spam folder) for the confirmation link.'
  }
  if (msg.includes('already registered') || code === 'user_already_exists') {
    return 'An account with this email already exists. Please sign in or reset your password.'
  }
  if (msg.includes('rate limit') || code === 'over_email_send_rate_limit' || msg.includes('too many requests') || error.status === 429) {
    return 'Too many attempts (Supabase Limit). Please wait a few minutes and try again.'
  }
  if (msg.includes('email_address_invalid') || msg.includes('invalid email') || msg.includes('disposable email')) {
    return 'Please enter a valid, non-disposable email address.'
  }
  if (msg.includes('weak_password') || msg.includes('password') || msg.includes('should contain at least')) {
    return 'Password does not meet requirements. Please use at least 6 characters.'
  }
  if (msg.includes('captcha') || msg.includes('turnstile')) {
    return 'CAPTCHA verification failed. Please try again.'
  }
  if (msg.includes('signup_disabled') || msg.includes('signups not allowed')) {
    return 'New account registration is currently disabled.'
  }
  if (msg.includes('database error') || msg.includes('saving new user')) {
    return 'There was a system error setting up your account. Please try again later.'
  }
  if (msg.includes('validation_failed')) {
    return 'Invalid information provided. Please check your details and try again.'
  }
  if (msg.includes('provider is not enabled')) {
    return 'This sign-in method is currently disabled.'
  }
  
  // Generic safe fallback — never expose raw Supabase error internals
  return 'An unexpected error occurred. Please try again.'
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || 'Invalid form data'
    return { success: false, error: firstError }
  }

  const { email, password } = parsed.data

  const rateLimit = rateLimits.auth(email)
  if (!rateLimit.allowed) {
    return { success: false, error: 'Too many attempts (App Limit). Please wait a few minutes and try again.' }
  }

  // Build sign-in options with optional CAPTCHA token
  const captchaToken = formData.get('captchaToken') as string | null
  const signInOptions: Record<string, unknown> = {}
  if (captchaToken) {
    signInOptions.captchaToken = captchaToken
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: signInOptions,
  })

  if (error) {
    return { success: false, error: sanitizeAuthError(error) }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function register(formData: FormData) {
  const supabase = await createClient()

  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || 'Invalid form data'
    return { success: false, error: firstError }
  }

  const { email, password, name } = parsed.data

  const rateLimit = rateLimits.auth(email)
  if (!rateLimit.allowed) {
    return { success: false, error: 'Too many attempts (App Limit). Please wait a few minutes and try again.' }
  }

  const emailRedirectTo = getCallbackUrl('/dashboard')

  // Build sign-up options with optional CAPTCHA token
  const captchaToken = formData.get('captchaToken') as string | null

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
      emailRedirectTo,
      ...(captchaToken ? { captchaToken } : {}),
    },
  })

  if (error) {
    return { success: false, error: sanitizeAuthError(error) }
  }

  // If Supabase returned an active session (e.g. email confirmations disabled or auto-confirmed)
  if (data?.session) {
    revalidatePath('/', 'layout')
    redirect('/dashboard')
  }

  // If email confirmation is required, notify user to verify their inbox
  return {
    success: true,
    requiresVerification: true,
    message: 'Account created! Please check your email to verify your account before logging in.',
  }
}

export async function forgotPassword(formData: FormData) {
  const email = (formData.get('email') as string || '').trim().toLowerCase()
  if (!email || !email.includes('@')) {
    return { success: false, error: 'Please enter a valid email address.' }
  }

  const rateLimit = rateLimits.passwordReset(email)
  if (!rateLimit.allowed) {
    return { success: false, error: 'Too many reset attempts. Please wait a few minutes and try again.' }
  }

  const supabase = await createClient()
  const redirectTo = getCallbackUrl('/reset-password')

  // Build options with optional CAPTCHA token
  const captchaToken = formData.get('captchaToken') as string | null

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
    ...(captchaToken ? { captchaToken } : {}),
  })

  if (error) {
    if (error.message.includes('rate limit') || error.message.includes('too many')) {
      return { success: false, error: 'Too many reset attempts. Please wait a few minutes and try again.' }
    }
    // Don't reveal whether an email exists in the system
    console.error('[ForgotPassword] Error:', error.message)
  }

  // Always return success to prevent email enumeration
  return {
    success: true,
    message: 'If an account exists for this email, a password reset link has been sent. Please check your inbox.',
  }
}

export async function resetPassword(formData: FormData) {
  const password = formData.get('password') as string
  if (!password || password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { success: false, error: sanitizeAuthError(error) }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

/**
 * Initiates Google OAuth sign-in via Supabase Auth.
 * Returns the OAuth URL for the client to redirect to.
 */
export async function signInWithGoogle() {
  const supabase = await createClient()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  const redirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent('/dashboard')}`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
      // Only request minimal identity scopes — no Gmail access
      scopes: 'openid email profile',
    },
  })

  if (error) {
    return { success: false, error: 'Unable to initiate Google sign-in. Please try again.' }
  }

  if (data?.url) {
    return { success: true, url: data.url }
  }

  return { success: false, error: 'Unable to initiate Google sign-in. Please try again.' }
}

/**
 * Developer-only anonymous sign-in for local development.
 * Strictly gated to NODE_ENV === 'development'.
 */
export async function loginAsDeveloper() {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Development login is only available in development mode')
  }

  const supabase = await createClient()
  
  // Try anonymous sign in for dev
  const { data, error } = await supabase.auth.signInAnonymously()
  
  if (error || !data.user) {
    console.error('Anonymous sign-in failed:', error)
    return { success: false, error: error?.message || 'Failed to create developer session. Ensure Anonymous Sign-ins are enabled in Supabase.' }
  }

  revalidatePath('/', 'layout')
  redirect('/api/seed-dev-data')
}
