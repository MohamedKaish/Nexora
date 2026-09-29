'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const nameSchema = z.string().trim().min(2, 'Full name must be at least 2 characters.').max(100)

export function GuestOnboarding() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // If they already have a guest name, redirect them to dashboard
    const guestName = localStorage.getItem('nexora_guest_name')
    if (guestName) {
      router.push('/dashboard')
    } else {
      setIsLoading(false)
    }
  }, [router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const parsed = nameSchema.safeParse(name)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || 'Invalid name')
      return
    }

    localStorage.setItem('nexora_guest_name', parsed.data)
    router.push('/dashboard')
  }

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center" />
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-white/10 glass-card">
        <CardHeader className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 rounded-full bg-brand-emerald flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-white" />
            </div>
            <span className="font-bold tracking-tight text-foreground">Nexora</span>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-foreground pt-4">
            Welcome to Nexora
          </CardTitle>
          <CardDescription className="text-muted-foreground text-base">
            What should we call you?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6 mt-2">
            <div className="space-y-2">
              <Input
                placeholder="Enter your name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError('')
                }}
                className="h-12 bg-secondary/50 border-white/5 focus-visible:ring-brand-emerald text-base"
                autoFocus
              />
              {error && <p className="text-sm text-destructive font-medium">{error}</p>}
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
