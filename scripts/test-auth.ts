import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://rruavarqxdotdsbbjvck.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJydWF2YXJxeGRvdGRzYmJqdmNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NzM5MjQsImV4cCI6MjEwMTE0OTkyNH0.3SLbaEOaOWxnSqgiSXvLNwiSt6OJPdAzVQMyk2wmpKA'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testSignup() {
  console.log('Testing signup...')
  const { data, error } = await supabase.auth.signUp({
    email: 'test.user.nexus' + Date.now() + '@gmail.com',
    password: 'password123',
    options: {
      data: {
        full_name: 'Test User'
      },
      emailRedirectTo: 'https://invalid-domain.com/auth/callback'
    }
  })

  console.log('Signup result:', { data, error })
}

testSignup()
