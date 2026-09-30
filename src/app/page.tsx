'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppStore } from '@/store/appStore'
import { useAgentStore } from '@/store/agentStore'
import { useCharacterStore, CHARACTER_HAIR, CHARACTER_OUTFITS, OUTFIT_COLORS } from '@/store/characterStore'
import { CompanionAvatar } from '@/features/companion/CompanionAvatar'
import { ArrowRight, Sparkles, User, Bot, Palette, ChevronLeft } from 'lucide-react'

const nameSchema = z.string().trim().min(1, 'Please enter your name.').max(50)
const agentNameSchema = z.string().trim().min(1, 'Give your companion a name.').max(30)

type OnboardingStep = 'welcome' | 'name' | 'agent' | 'appearance' | 'ready'

export default function Home() {
  const router = useRouter()
  const { preferences, setDisplayName, setAgentName, completeOnboarding } = useAppStore()
  const { setName: setAgentStoreName } = useAgentStore()
  const characterConfig = useCharacterStore((s) => s.config)
  const setHair = useCharacterStore((s) => s.setHair)
  const setOutfit = useCharacterStore((s) => s.setOutfit)

  const [step, setStep] = useState<OnboardingStep>('welcome')
  const [name, setName] = useState('')
  const [agentName, setAgentNameValue] = useState('Nexora')
  const [nameError, setNameError] = useState('')
  const [agentError, setAgentError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (preferences.onboardingComplete && preferences.displayName) {
      router.push('/dashboard')
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(false)
    }
  }, [preferences.onboardingComplete, preferences.displayName, router])

  const handleNameSubmit = () => {
    const parsed = nameSchema.safeParse(name)
    if (!parsed.success) {
      setNameError(parsed.error.issues[0]?.message || 'Invalid name')
      return
    }
    setDisplayName(parsed.data)
    // Migrate old localStorage name
    localStorage.setItem('nexora_guest_name', parsed.data)
    setStep('agent')
  }

  const handleAgentSubmit = () => {
    const parsed = agentNameSchema.safeParse(agentName)
    if (!parsed.success) {
      setAgentError(parsed.error.issues[0]?.message || 'Invalid name')
      return
    }
    setAgentName(parsed.data)
    setAgentStoreName(parsed.data)
    setStep('appearance')
  }

  const handleComplete = () => {
    completeOnboarding()
    router.push('/dashboard')
  }

  const handleSkipToApp = () => {
    if (name.trim()) {
      setDisplayName(name.trim())
      localStorage.setItem('nexora_guest_name', name.trim())
    } else {
      setDisplayName('Explorer')
      localStorage.setItem('nexora_guest_name', 'Explorer')
    }
    setAgentName(agentName || 'Nexora')
    setAgentStoreName(agentName || 'Nexora')
    completeOnboarding()
    router.push('/dashboard')
  }

  if (isLoading) {
    return <div className="min-h-screen bg-background" />
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 selection:bg-accent/20">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/5 via-background to-background" />

      <main className="relative z-10 w-full max-w-lg mx-auto flex flex-col items-center text-center">
        {/* Step: Welcome */}
        {step === 'welcome' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs font-semibold text-accent uppercase tracking-wider">Nexora 2.0</span>
            </div>

            <h1 className="text-5xl sm:text-6xl font-serif font-semibold tracking-tight leading-tight">
              Your workspace,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-foreground/90 to-foreground/40">
                without the friction.
              </span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-md mx-auto font-light leading-relaxed">
              Organize tasks, projects, and goals in one focused workspace.
              No account needed. Start immediately.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center">
              <Button
                onClick={() => setStep('name')}
                className="h-13 px-8 rounded-xl bg-accent text-white hover:bg-accent/90 font-medium text-base transition-all duration-300 shadow-[0_4px_14px_0_var(--accent)/25] hover:-translate-y-0.5 cursor-pointer"
              >
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                onClick={handleSkipToApp}
                className="h-13 px-8 rounded-xl border-border/60 font-medium text-base hover:bg-secondary/40 transition-all cursor-pointer"
              >
                Skip Setup
              </Button>
            </div>
          </div>
        )}

        {/* Step: Name */}
        {step === 'name' && (
          <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <button onClick={() => setStep('welcome')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 mx-auto">
              <User className="w-7 h-7 text-accent" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-serif font-bold tracking-tight">What should we call you?</h2>
              <p className="text-muted-foreground">Your display name in Nexora.</p>
            </div>
            <div className="space-y-4">
              <Input
                placeholder="Enter your name"
                value={name}
                onChange={(e) => { setName(e.target.value); setNameError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                className="h-14 px-5 text-lg bg-card border-border/60 rounded-xl text-center placeholder:text-muted-foreground/50 transition-all hover:border-accent/40 focus-visible:ring-accent/30"
                autoFocus
              />
              {nameError && <p className="text-sm text-destructive font-medium">{nameError}</p>}
              <Button onClick={handleNameSubmit} className="w-full h-13 rounded-xl bg-accent text-white hover:bg-accent/90 font-medium text-base transition-all cursor-pointer">
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Agent */}
        {step === 'agent' && (
          <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <button onClick={() => setStep('name')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 mx-auto">
              <Bot className="w-7 h-7 text-accent" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-serif font-bold tracking-tight">Meet your companion.</h2>
              <p className="text-muted-foreground">Give your productivity companion a name.</p>
            </div>
            <div className="space-y-3">
              <Input
                placeholder="e.g. Nexora, Nova, Atlas, Astra"
                value={agentName}
                onChange={(e) => { setAgentNameValue(e.target.value); setAgentError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handleAgentSubmit()}
                className="h-14 px-5 text-lg bg-card border-border/60 rounded-xl text-center placeholder:text-muted-foreground/50 transition-all hover:border-accent/40 focus-visible:ring-accent/30"
                autoFocus
              />
              <div className="flex flex-wrap gap-2 justify-center">
                {['Nexora', 'Nova', 'Atlas', 'Astra', 'Kyro', 'Orion'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setAgentNameValue(suggestion)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
                      agentName === suggestion
                        ? 'bg-accent/10 border-accent/30 text-accent'
                        : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-border'
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              {agentError && <p className="text-sm text-destructive font-medium">{agentError}</p>}
              <Button onClick={handleAgentSubmit} className="w-full h-13 rounded-xl bg-accent text-white hover:bg-accent/90 font-medium text-base transition-all cursor-pointer">
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Appearance */}
        {step === 'appearance' && (
          <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <button onClick={() => setStep('agent')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 mx-auto">
              <Palette className="w-7 h-7 text-accent" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-serif font-bold tracking-tight">Make it yours.</h2>
              <p className="text-muted-foreground">Customize your companion&apos;s look.</p>
            </div>

            {/* Live Preview */}
            <div className="flex justify-center py-4">
              <div className="relative p-4 rounded-2xl bg-card border border-border/40">
                <CompanionAvatar size={140} expression="happy" />
                <p className="text-center text-sm font-medium text-muted-foreground mt-2">{agentName}</p>
              </div>
            </div>

            {/* Quick Customization */}
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Hair Style</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {CHARACTER_HAIR.slice(0, 4).map((h) => (
                    <button
                      key={h.id}
                      onClick={() => setHair(h.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
                        characterConfig.hair === h.id
                          ? 'bg-accent/10 border-accent/30 text-accent'
                          : 'border-border/50 text-muted-foreground hover:border-border'
                      }`}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Outfit</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {CHARACTER_OUTFITS.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => setOutfit(o.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
                        characterConfig.outfit === o.id
                          ? 'bg-accent/10 border-accent/30 text-accent'
                          : 'border-border/50 text-muted-foreground hover:border-border'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Color</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {OUTFIT_COLORS.slice(0, 6).map((c) => (
                    <button
                      key={c}
                      onClick={() => setOutfit(characterConfig.outfit, c)}
                      className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${
                        characterConfig.outfitColor === c ? 'border-accent scale-110' : 'border-border/40 hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                      aria-label={`Outfit color ${c}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <Button onClick={() => setStep('ready')} className="w-full h-13 rounded-xl bg-accent text-white hover:bg-accent/90 font-medium text-base transition-all cursor-pointer">
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step: Ready */}
        {step === 'ready' && (
          <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="flex justify-center">
              <CompanionAvatar size={100} expression="celebrating" />
            </div>
            <div className="space-y-3">
              <h2 className="text-4xl font-serif font-bold tracking-tight">You&apos;re all set, {name}.</h2>
              <p className="text-muted-foreground text-lg">
                {agentName} is ready to help you stay focused and productive. No account needed — your data is saved right here.
              </p>
            </div>
            <Button
              onClick={handleComplete}
              className="w-full h-14 rounded-xl bg-accent text-white hover:bg-accent/90 font-medium text-lg transition-all shadow-[0_4px_14px_0_var(--accent)/25] hover:-translate-y-0.5 cursor-pointer"
            >
              Enter Nexora
              <Sparkles className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step indicators */}
        {step !== 'welcome' && (
          <div className="flex gap-1.5 mt-8">
            {['name', 'agent', 'appearance', 'ready'].map((s, i) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  ['name', 'agent', 'appearance', 'ready'].indexOf(step) >= i
                    ? 'bg-accent w-6'
                    : 'bg-border w-3'
                }`}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
