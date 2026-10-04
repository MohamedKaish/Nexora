'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/appStore'
import { useCharacterStore } from '@/store/characterStore'
import { Companion } from '@/components/companion/Companion'
import { CompanionSelector } from '@/components/companion/CompanionSelector'
import { ORIGINAL_CREATURES } from '@/components/companion/companion-data'
import { CreatureArchetype, normalizeArchetype } from '@/components/companion/CompanionState'
import {
  User,
  Calendar,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Shield,
  CheckCircle2,
  Cpu,
  Crown,
  Bot,
  Target,
  Check,
  Zap,
} from 'lucide-react'

const GENDER_OPTIONS = [
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-Binary' },
  { value: 'other', label: 'Other' },
]

const COMPANION_NAME_SUGGESTIONS = ['Kyro', 'Aero', 'Nyx', 'Vex', 'Sol', 'Nova', 'Aegis', 'Orion']

const FOCUS_TRACKS = [
  { id: 'tech', label: 'Software & Technology', icon: '💻', desc: 'Coding, system design & sprint execution' },
  { id: 'study', label: 'Academic & Deep Study', icon: '📚', desc: 'Research, reading, exams & knowledge synthesis' },
  { id: 'creative', label: 'Creative & Visual Arts', icon: '🎨', desc: 'Design, writing, audio & media production' },
  { id: 'career', label: 'Business & Leadership', icon: '📈', desc: 'Strategic planning, milestones & team ops' },
  { id: 'habits', label: 'Habit & Daily Mastery', icon: '⚡', desc: 'Physical fitness, mindfulness & unbroken streaks' },
]

export default function SetupPage() {
  const router = useRouter()
  const { preferences, updatePreferences, agentConfig, setAgentName } = useAppStore()
  const setArchetype = useCharacterStore((s) => s.setArchetype)
  const rawArch = useCharacterStore((s) => s.config.archetype)
  const currentArchetype = normalizeArchetype(rawArch)
  const creatureMeta = ORIGINAL_CREATURES[currentArchetype] || ORIGINAL_CREATURES.nyxen

  // Questionnaire Steps: 1: Name, 2: DOB & Gender, 3: Companion, 4: Companion Name, 5: Focus Track, 6: Calibration, 7: Ready
  const [currentQuestion, setCurrentQuestion] = useState(1)
  const [displayName, setDisplayName] = useState(preferences.displayName || '')
  const [dateOfBirth, setDateOfBirth] = useState(preferences.dateOfBirth || '')
  const [gender, setGender] = useState(preferences.gender || 'prefer-not-to-say')
  const [companionCallsign, setCompanionCallsign] = useState(agentConfig.name || 'Kyro')
  const [selectedFocus, setSelectedFocus] = useState('tech')
  const [syncProgress, setSyncProgress] = useState(0)

  // Step 1: Submit Name
  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) return
    setCurrentQuestion(2)
  }

  // Step 2: Submit DOB & Gender
  const handleDobSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentQuestion(3)
  }

  // Step 3: Companion Chosen -> Move to Companion Name
  const handleCompanionNext = () => {
    setCurrentQuestion(4)
  }

  // Step 4: Companion Name Submitted -> Move to Focus Track
  const handleCompanionNameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setAgentName(companionCallsign.trim() || 'Kyro')
    setCurrentQuestion(5)
  }

  // Step 5: Focus Selected -> Start Calibration
  const handleFocusSubmit = () => {
    // Save all profile preferences
    updatePreferences({
      displayName: displayName.trim() || 'Explorer',
      dateOfBirth,
      gender,
      onboardingComplete: true,
    })
    setAgentName(companionCallsign.trim() || 'Kyro')

    setCurrentQuestion(6) // Calibration sync
    setSyncProgress(15)

    const t1 = setTimeout(() => setSyncProgress(45), 500)
    const t2 = setTimeout(() => setSyncProgress(80), 1000)
    const t3 = setTimeout(() => {
      setSyncProgress(100)
      setCurrentQuestion(7) // Final Complete
    }, 1600)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }

  const handleFinishAndEnter = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-2xl world-deck p-6 sm:p-10 relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.4)] border-amber-400/35">
        <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full blur-[110px] bg-amber-500/10 pointer-events-none" />

        {/* Progress Pill Bar (Questions 1 to 5) */}
        {currentQuestion <= 5 && (
          <div className="mb-8 space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-400 font-semibold">
              <span className="flex items-center gap-1 text-amber-400 font-mono">
                <Crown className="w-3.5 h-3.5" />
                Question {currentQuestion} of 5
              </span>
              <span>Sanctuary Initiation</span>
            </div>
            <div className="w-full h-2 rounded-full bg-stone-900/60 border border-stone-800 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300 shadow-[0_0_8px_rgba(212,168,83,0.5)]"
                style={{ width: `${(currentQuestion / 5) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* ─── QUESTION 1: EXPLORER NAME ─── */}
        {currentQuestion === 1 && (
          <form onSubmit={handleNameSubmit} className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-sm">
                <User className="w-6 h-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
                What should we call you?
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 max-w-sm mx-auto">
                Enter your name or preferred explorer callsign to begin calibrating your sanctuary.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-300 uppercase tracking-wider block">
                Your Full Name / Callsign
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Mohamed Kaish"
                required
                autoFocus
                className="w-full px-4 py-3.5 rounded-xl bg-stone-900 border border-stone-800 text-base text-foreground focus:outline-none focus:border-amber-400 transition-colors shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={!displayName.trim()}
              className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed text-stone-950 font-bold text-sm transition-all shadow-[0_0_20px_rgba(212,168,83,0.3)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue to Next Question</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ─── QUESTION 2: DATE OF BIRTH & GENDER ─── */}
        {currentQuestion === 2 && (
          <form onSubmit={handleDobSubmit} className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-sm">
                <Calendar className="w-6 h-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
                When is your birthday?
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 max-w-sm mx-auto">
                We use this to celebrate your sanctuary milestones and personalize your profile.
              </p>
            </div>

            <div className="space-y-4">
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

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCurrentQuestion(1)}
                className="px-4 py-3 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-stone-100 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                className="flex-1 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-sm transition-all shadow-[0_0_20px_rgba(212,168,83,0.3)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Select Your Companion</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ─── QUESTION 3: CHOOSE COMPANION ALLY ─── */}
        {currentQuestion === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-sm">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
                Choose your Living Companion
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 max-w-md mx-auto">
                Pick the ally that resonates with your focus style. You can switch anytime.
              </p>
            </div>

            {/* Dais Live Display */}
            <div className="flex flex-col items-center p-4 rounded-2xl bg-stone-900/50 border border-stone-800/80">
              <Companion
                size={135}
                showPlatform={true}
                showGlow={true}
                speechTextOverride={creatureMeta.speechGreeting}
              />
              <span className="text-xs font-bold text-amber-300 mt-2 font-serif">
                {creatureMeta.name} — {creatureMeta.title}
              </span>
            </div>

            {/* 3 Companion Cards */}
            <CompanionSelector variant="cards" />

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCurrentQuestion(2)}
                className="px-4 py-3 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleCompanionNext}
                className="flex-1 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-sm transition-all shadow-[0_0_20px_rgba(212,168,83,0.3)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Name Your Companion</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ─── QUESTION 4: NAME COMPANION ─── */}
        {currentQuestion === 4 && (
          <form onSubmit={handleCompanionNameSubmit} className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-sm">
                <Bot className="w-6 h-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
                What will you name your companion?
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 max-w-sm mx-auto">
                Give your {creatureMeta.name} a personalized callsign to seal your neural bond.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-stone-300 uppercase tracking-wider block">
                Companion Callsign
              </label>
              <input
                type="text"
                value={companionCallsign}
                onChange={(e) => setCompanionCallsign(e.target.value)}
                placeholder="e.g. Kyro"
                required
                autoFocus
                className="w-full px-4 py-3.5 rounded-xl bg-stone-900 border border-stone-800 text-base text-foreground focus:outline-none focus:border-amber-400 transition-colors shadow-inner font-bold"
              />

              {/* Quick suggestions */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] text-stone-500 font-semibold block">Quick Suggestions:</span>
                <div className="flex flex-wrap gap-1.5">
                  {COMPANION_NAME_SUGGESTIONS.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setCompanionCallsign(sug)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        companionCallsign === sug
                          ? 'bg-amber-400 text-stone-950 font-bold'
                          : 'bg-stone-900 border border-stone-800 text-stone-300 hover:text-stone-100 hover:border-stone-700'
                      }`}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCurrentQuestion(3)}
                className="px-4 py-3 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={!companionCallsign.trim()}
                className="flex-1 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-stone-950 font-bold text-sm transition-all shadow-[0_0_20px_rgba(212,168,83,0.3)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Select Primary Focus</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ─── QUESTION 5: PRIMARY FOCUS TRACK ─── */}
        {currentQuestion === 5 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-sm">
                <Target className="w-6 h-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
                What is your primary focus?
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 max-w-sm mx-auto">
                Select your main quest domain so your ally can tune focus chamber suggestions.
              </p>
            </div>

            <div className="space-y-2.5">
              {FOCUS_TRACKS.map((track) => {
                const isSelected = selectedFocus === track.id
                return (
                  <div
                    key={track.id}
                    onClick={() => setSelectedFocus(track.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? 'bg-amber-400/10 border-amber-400 shadow-[0_0_15px_rgba(212,168,83,0.25)]'
                        : 'bg-stone-900/60 border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{track.icon}</span>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-foreground">{track.label}</h4>
                        <p className="text-[11px] text-stone-400">{track.desc}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCurrentQuestion(4)}
                className="px-4 py-3 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleFocusSubmit}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold text-sm transition-all shadow-[0_0_25px_rgba(212,168,83,0.4)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Complete Setup & Ingress</span>
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 6: CALIBRATION & SYNCHRONIZATION ─── */}
        {currentQuestion === 6 && (
          <div className="space-y-6 text-center py-8 animate-in fade-in duration-300">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 animate-pulse shadow-[0_0_30px_rgba(212,168,83,0.3)]">
              <Cpu className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-foreground">
                Calibrating Sanctuary Link...
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 max-w-sm mx-auto leading-relaxed">
                Forging neural telemetry between <strong>{displayName || 'Explorer'}</strong> and your companion <strong>{companionCallsign || 'Kyro'}</strong> ({creatureMeta.name}).
              </p>
            </div>

            <div className="space-y-2 max-w-xs mx-auto">
              <div className="w-full h-3 rounded-full bg-stone-900 border border-stone-800 overflow-hidden p-0.5 shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300 shadow-[0_0_10px_rgba(212,168,83,0.6)]"
                  style={{ width: `${syncProgress}%` }}
                />
              </div>
              <span className="text-xs text-amber-300 font-mono font-bold block">
                {syncProgress}% Synchronized
              </span>
            </div>
          </div>
        )}

        {/* ─── STEP 7: SANCTUARY ONLINE & READY ─── */}
        {currentQuestion === 7 && (
          <div className="space-y-6 text-center py-4 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-semibold">
                <Crown className="w-3.5 h-3.5" />
                <span>Level 1 · Novice Explorer Unlocked</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif text-foreground">
                Welcome to Nexora, {displayName || 'Explorer'}!
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 max-w-md mx-auto leading-relaxed">
                Your neural link with <strong>{companionCallsign}</strong> ({creatureMeta.name}) is fully active. Your quest matrix is primed and ready.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 flex items-center justify-center gap-4 max-w-md mx-auto">
              <Companion size={72} showPlatform={false} showGlow={false} interactive={false} />
              <div className="text-left text-xs">
                <span className="font-bold text-foreground block font-serif">{companionCallsign}</span>
                <span className="text-[11px] text-amber-400 font-semibold block">{creatureMeta.title}</span>
                <span className="text-[11px] text-stone-400 italic mt-0.5 block">&ldquo;{creatureMeta.speechGreeting}&rdquo;</span>
              </div>
            </div>

            <button
              onClick={handleFinishAndEnter}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold text-sm transition-all shadow-[0_0_30px_rgba(212,168,83,0.4)] flex items-center justify-center gap-2 cursor-pointer"
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
