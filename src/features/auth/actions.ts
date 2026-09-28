'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
})

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Full name must be at least 2 characters.').max(100),
  email: z.string().trim().email('Please enter a valid email address.').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
})

function getCallbackUrl(nextPath = '/dashboard'): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://nexora-on5w.vercel.app')
  return `${siteUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`
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

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { success: false, error: 'Invalid email or password. Please verify your credentials and try again.' }
    }
    if (error.message.includes('Email not confirmed')) {
      return { success: false, error: 'Email not verified. Please check your inbox (and spam folder) for the confirmation link.' }
    }
    return { success: false, error: error.message }
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
  const emailRedirectTo = getCallbackUrl('/dashboard')

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
      emailRedirectTo,
    },
  })

  if (error) {
    if (error.message.includes('already registered') || error.code === 'user_already_exists') {
      return { success: false, error: 'An account with this email already exists. Please sign in or reset your password.' }
    }
    if (error.message.includes('rate limit') || error.code === 'over_email_send_rate_limit') {
      return { 
        success: false, 
        error: 'Email rate limit exceeded by Supabase default email provider. Please configure Custom SMTP in Supabase (Project Settings -> Auth -> SMTP) to send unlimited verification emails, or toggle Confirm Email to OFF for instant signups.' 
      }
    }
    return { success: false, error: error.message }
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

  const supabase = await createClient()
  const redirectTo = getCallbackUrl('/reset-password')

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  })

  if (error) {
    if (error.message.includes('rate limit')) {
      return { success: false, error: 'Reset email rate limit exceeded. Please try again in an hour or configure custom SMTP in Supabase.' }
    }
    return { success: false, error: error.message }
  }

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
    return { success: false, error: error.message }
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
