'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const nameSchema = z.string().trim().min(2, 'Name must be at least 2 characters.').max(50)

export default function Home() {
  const router = useRouter()
  const [step, setStep] = useState<'landing' | 'onboarding'>('landing')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
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
    return <div className="min-h-screen bg-[#0C0A09]" />
  }

  return (
    <div className="min-h-screen bg-[#0C0A09] text-white flex flex-col items-center justify-center p-4 selection:bg-[#A16207]/30">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 via-[#0C0A09] to-[#0C0A09]" />
      
      <main className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center text-center">
        {step === 'landing' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="w-2 h-2 rounded-full bg-[#A16207] animate-pulse" />
              <span className="text-sm font-medium text-white/80">Nexora 2.0</span>
            </div>
            
            <h1 className="text-5xl sm:text-7xl font-serif font-semibold tracking-tight text-white leading-tight">
              Your work,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white/90 to-white/40">
                without the friction.
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-white/60 max-w-xl mx-auto font-light leading-relaxed">
              Organize your tasks, projects and goals in one focused workspace. 
              Designed for speed, clarity, and deep work.
            </p>
            
            <div className="pt-8">
              <Button 
                onClick={() => setStep('onboarding')}
                className="h-14 px-10 rounded-xl bg-accent text-white hover:bg-accent/90 shadow-[0_4px_14px_0_rgba(161,98,7,0.39)] hover:shadow-[0_6px_20px_rgba(161,98,7,0.23)] hover:-translate-y-0.5 font-medium text-lg transition-all duration-300"
              >
                Enter Nexora
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500 ease-out">
            <div className="space-y-4 text-center">
              <h2 className="text-4xl font-serif font-bold tracking-tight text-white">Welcome to Nexora.</h2>
              <p className="text-white/60 text-lg">What should we call you?</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setError('')
                  }}
                  className="h-16 px-6 text-xl bg-white/5 border-white/10 focus-visible:ring-[#A16207] rounded-2xl text-center text-white placeholder:text-white/30 backdrop-blur-md transition-all hover:bg-white/10"
                  autoFocus
                />
                {error && (
                  <p className="absolute -bottom-8 left-0 right-0 text-sm text-red-400 font-medium">{error}</p>
                )}
              </div>
              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full h-14 rounded-xl bg-accent text-white hover:bg-accent/90 shadow-[0_4px_14px_0_rgba(161,98,7,0.39)] hover:shadow-[0_6px_20px_rgba(161,98,7,0.23)] hover:-translate-y-0.5 font-medium text-lg transition-all duration-300"
                >
                  Continue
                </Button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}
