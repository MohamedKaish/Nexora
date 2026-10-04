'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/appStore'
import { useCharacterStore } from '@/store/characterStore'
import { Companion } from '@/components/companion/Companion'
import { CompanionSelector } from '@/components/companion/CompanionSelector'
import { CreatureArchetype } from '@/components/companion/CompanionState'
import {
  User,
  Calendar,
  Sparkles,
  ArrowRight,
  Shield,
  CheckCircle2,
  Cpu,
  Crown,
} from 'lucide-react'

const GENDER_OPTIONS = [
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-Binary' },
  { value: 'other', label: 'Other' },
]

export default function SetupPage() {
  const router = useRouter()
  const { preferences, updatePreferences } = useAppStore()
  const setArchetype = useCharacterStore((s) => s.setArchetype)
  const currentArchetype = useCharacterStore((s) => s.config.archetype) || 'nyxen'

  const [step, setStep] = useState<'profile' | 'companion' | 'syncing' | 'complete'>('profile')
  const [displayName, setDisplayName] = useState(preferences.displayName || '')
  const [dateOfBirth, setDateOfBirth] = useState(preferences.dateOfBirth || '')
  const [gender, setGender] = useState(preferences.gender || 'prefer-not-to-say')
  const [syncProgress, setSyncProgress] = useState(0)

  const handleProfileNext = (e: React.FormEvent) => {
    e.preventDefault()
    updatePreferences({
      displayName: displayName.trim() || 'Explorer',
      dateOfBirth,
      gender,
      onboardingComplete: true,
    })
    setStep('companion')
  }

  const handleStartSync = () => {
    setStep('syncing')
    setSyncProgress(15)

    const t1 = setTimeout(() => setSyncProgress(45), 600)
    const t2 = setTimeout(() => setSyncProgress(80), 1200)
    const t3 = setTimeout(() => {
      setSyncProgress(100)
      setStep('complete')
    }, 1800)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }

  const handleFinish = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-xl world-deck p-8 relative overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.6)] border-amber-400/30">
        <div className="absolute top-0 right-1/4 w-72 h-72 rounded-full blur-[100px] bg-amber-500/10 pointer-events-none" />

        {/* STEP 1: Personal Attributes (Name, DOB, Gender) */}
        {step === 'profile' && (
          <form onSubmit={handleProfileNext} className="space-y-6 animate-in fade-in">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-semibold">
                <Crown className="w-3.5 h-3.5" />
                <span>Step 1 of 2 · Sanctuary Ingress</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-foreground">
                Explorer Identity
              </h2>
              <p className="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed">
                Initialize your personal profile to calibrate your daily XP, productivity tracking, and companion bond.
              </p>
            </div>

            <div className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  Your Name or Explorer Callsign
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Mohamed Kaish"
                  required
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-stone-900 border border-stone-800 text-sm text-foreground focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              {/* DOB */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  Date of Birth (DOB)
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-stone-900 border border-stone-800 text-sm text-foreground focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  Gender Identity
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-stone-900 border border-stone-800 text-sm text-foreground focus:outline-none focus:border-amber-400 transition-colors"
                >
                  {GENDER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-stone-900 text-foreground">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-sm transition-all shadow-[0_0_20px_rgba(212,168,83,0.3)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue to Companion Alliance</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 2: Choose Companion Alliance */}
        {step === 'companion' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Step 2 of 2 · Living Companion</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-foreground">
                Bond with your Ally
              </h2>
              <p className="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed">
                Choose the companion that best complements your rhythm and focus style.
              </p>
            </div>

            {/* Companion Stage Preview */}
            <div className="flex flex-col items-center p-4 rounded-2xl bg-stone-900/50 border border-stone-800/80">
              <Companion size={140} showPlatform={true} showGlow={true} />
              <span className="text-xs font-bold text-amber-300 mt-2">
                Selected: {currentArchetype.toUpperCase()}
              </span>
            </div>

            <CompanionSelector variant="cards" />

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('profile')}
                className="px-4 py-3 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 text-xs font-semibold cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleStartSync}
                className="flex-1 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-sm transition-all shadow-[0_0_20px_rgba(212,168,83,0.3)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Initiate Sanctuary Link</span>
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Loading & Neural Calibration Sequence */}
        {step === 'syncing' && (
          <div className="space-y-6 text-center py-6 animate-in fade-in">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 animate-pulse">
              <Cpu className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold font-serif text-foreground">
                Calibrating Sanctuary Telemetry...
              </h2>
              <p className="text-xs text-stone-400 max-w-sm mx-auto">
                Establishing neural link between {displayName || 'Explorer'} and your living companion.
              </p>
            </div>

            <div className="space-y-2 max-w-xs mx-auto">
              <div className="w-full h-2.5 rounded-full bg-stone-900 border border-stone-800 overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-300"
                  style={{ width: `${syncProgress}%` }}
                />
              </div>
              <span className="text-[11px] text-amber-300 font-mono font-bold">
                {syncProgress}% Synchronized
              </span>
            </div>
          </div>
        )}

        {/* STEP 4: Sanctuary Online */}
        {step === 'complete' && (
          <div className="space-y-6 text-center py-6 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold font-serif text-foreground">
                Sanctuary Online, {displayName || 'Explorer'}!
              </h2>
              <p className="text-xs text-stone-400 max-w-sm mx-auto">
                Your profile is active, Level 1 (Novice Explorer) unlocked, and your companion is standing by on the World Dais.
              </p>
            </div>

            <button
              onClick={handleFinish}
              className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-sm transition-all shadow-[0_0_25px_rgba(212,168,83,0.35)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Enter Sanctuary Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
