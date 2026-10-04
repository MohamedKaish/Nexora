'use client'

import React, { useState, useMemo } from 'react'
import { useAppStore } from '@/store/appStore'
import { useTaskStore } from '@/store/useTaskStore'
import { useHabitStore } from '@/store/useHabitStore'
import { useGoalStore } from '@/store/useGoalStore'
import { useFocusStore } from '@/store/useFocusStore'
import { useCharacterStore } from '@/store/characterStore'
import { Companion } from '@/components/companion/Companion'
import { CompanionSelector } from '@/components/companion/CompanionSelector'
import { calculateProductivityLevel, getProductivityBadges } from '@/lib/gamification'
import {
  User,
  Calendar,
  Sparkles,
  Trophy,
  Zap,
  CheckCircle2,
  Flame,
  Target,
  Clock,
  Shield,
  Edit3,
  Save,
  Check,
  Award,
  Crown,
  Lock,
} from 'lucide-react'

const GENDER_OPTIONS = [
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-Binary' },
  { value: 'other', label: 'Other' },
]

export default function AccountPage() {
  const { preferences, updatePreferences } = useAppStore()
  const agentName = useAppStore((s) => s.agentConfig.name) || 'Kyro'
  const charConfig = useCharacterStore((s) => s.config)

  const tasks = useTaskStore((s) => s.tasks)
  const habits = useHabitStore((s) => s.habits)
  const completions = useHabitStore((s) => s.completions)
  const goals = useGoalStore((s) => s.goals)
  const focusSessions = useFocusStore((s) => s.sessions)

  // Real-time calculated gamification statistics
  const levelInfo = useMemo(() => {
    return calculateProductivityLevel(tasks, habits, completions, focusSessions, goals)
  }, [tasks, habits, completions, focusSessions, goals])

  const badges = useMemo(() => {
    return getProductivityBadges(tasks, habits, completions, focusSessions, goals)
  }, [tasks, habits, completions, focusSessions, goals])

  // Form edit states
  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState(preferences.displayName || 'Explorer')
  const [dateOfBirth, setDateOfBirth] = useState(preferences.dateOfBirth || '')
  const [gender, setGender] = useState(preferences.gender || 'prefer-not-to-say')
  const [title, setTitle] = useState(preferences.title || levelInfo.title)
  const [bio, setBio] = useState(preferences.bio || '')
  const [savedSuccess, setSavedSuccess] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    updatePreferences({
      displayName: displayName.trim() || 'Explorer',
      dateOfBirth,
      gender,
      title: title.trim() || levelInfo.title,
      bio: bio.trim(),
    })
    setIsEditing(false)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3000)
  }

  const completedTasksCount = tasks.filter((t) => t.status === 'done').length
  const totalFocusMinutes = Math.round(
    focusSessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0) / 60
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-5xl mx-auto pb-12">
      {/* Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-gradient-gold">
            Explorer Profile & Rank
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Manage your personal identity and view your productivity level progression.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-400/10 border border-emerald-400/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>Profile Saved</span>
            </div>
          )}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 rounded-xl bg-stone-900 border border-stone-800 hover:border-amber-400/40 text-stone-200 hover:text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {isEditing ? <Save className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
          </button>
        </div>
      </div>

      {/* ─── HERO PROFILE & LEVEL DECK ─── */}
      <div className="world-deck p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full blur-[100px] bg-amber-500/10 pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Avatar & Basic Info */}
          <div className="lg:col-span-4 flex flex-col items-center text-center space-y-3">
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 p-1 shadow-[0_0_30px_rgba(212,168,83,0.35)] flex items-center justify-center">
                <div className="w-full h-full rounded-[22px] bg-stone-950 flex items-center justify-center text-3xl sm:text-4xl font-serif font-bold text-amber-300">
                  {preferences.displayName?.charAt(0).toUpperCase() || 'E'}
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-amber-400 text-stone-950 text-xs font-extrabold shadow flex items-center gap-1">
                <Crown className="w-3 h-3" />
                <span>Lv. {levelInfo.level}</span>
              </div>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-foreground">
                {preferences.displayName || 'Explorer'}
              </h2>
              <p className="text-xs font-semibold text-amber-400 tracking-wide uppercase mt-0.5">
                {preferences.title || levelInfo.title}
              </p>
              <p className="text-xs text-stone-400 max-w-xs mt-2 italic leading-relaxed">
                &ldquo;{preferences.bio || 'Navigating daily quests and mastering focus inside Nexora.'}&rdquo;
              </p>
            </div>
          </div>

          {/* Real-time Level Progress & XP Meter */}
          <div className="lg:col-span-8 space-y-4 lg:pl-6 lg:border-l border-stone-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  Productivity Mastery
                </span>
                <h3 className="text-lg sm:text-xl font-bold font-serif text-foreground mt-0.5">
                  Level {levelInfo.level} · {levelInfo.title}
                </h3>
              </div>
              <div className="text-right sm:text-right">
                <span className="text-xs font-mono font-bold text-amber-300">
                  {levelInfo.totalXp} XP Total
                </span>
                <span className="block text-[11px] text-stone-400">
                  {levelInfo.currentLevelXp} / {levelInfo.nextLevelXpThreshold} XP to Level {levelInfo.level + 1}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-3.5 rounded-full bg-stone-900 border border-stone-800 overflow-hidden p-0.5 shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 transition-all duration-500 shadow-[0_0_12px_rgba(212,168,83,0.5)]"
                  style={{ width: `${Math.max(levelInfo.progressPercent, 4)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-stone-500 font-mono">
                <span>Rank: {levelInfo.rank}</span>
                <span>{levelInfo.progressPercent}% of next level</span>
              </div>
            </div>

            {/* XP Contribution Pods */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <div className="p-2.5 rounded-xl bg-stone-900/60 border border-stone-800/80">
                <span className="text-[10px] text-stone-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-blue-400" /> Tasks
                </span>
                <span className="text-sm font-bold font-mono text-foreground mt-0.5 block">
                  +{levelInfo.xpBreakdown.tasksXp} XP
                </span>
                <span className="text-[10px] text-stone-500">{completedTasksCount} done</span>
              </div>

              <div className="p-2.5 rounded-xl bg-stone-900/60 border border-stone-800/80">
                <span className="text-[10px] text-stone-400 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-orange-400" /> Habits
                </span>
                <span className="text-sm font-bold font-mono text-foreground mt-0.5 block">
                  +{levelInfo.xpBreakdown.habitsXp} XP
                </span>
                <span className="text-[10px] text-stone-500">{completions.length} checks</span>
              </div>

              <div className="p-2.5 rounded-xl bg-stone-900/60 border border-stone-800/80">
                <span className="text-[10px] text-stone-400 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" /> Focus
                </span>
                <span className="text-sm font-bold font-mono text-foreground mt-0.5 block">
                  +{levelInfo.xpBreakdown.focusXp} XP
                </span>
                <span className="text-[10px] text-stone-500">{totalFocusMinutes} mins</span>
              </div>

              <div className="p-2.5 rounded-xl bg-stone-900/60 border border-stone-800/80">
                <span className="text-[10px] text-stone-400 flex items-center gap-1">
                  <Target className="w-3 h-3 text-emerald-400" /> Goals
                </span>
                <span className="text-sm font-bold font-mono text-foreground mt-0.5 block">
                  +{levelInfo.xpBreakdown.goalsXp} XP
                </span>
                <span className="text-[10px] text-stone-500">{goals.length} horizons</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── EDIT PROFILE MODAL / FORM (WHEN ACTIVE) ─── */}
      {isEditing && (
        <div className="world-deck p-6 sm:p-8 animate-in slide-in-from-top-4 duration-300 border-amber-400/40">
          <div className="flex items-center gap-2 mb-6">
            <Edit3 className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-bold text-foreground font-serif">
              Personal Information & Attributes
            </h3>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Display Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  Full Name / Explorer Callsign
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Mohamed Kaish"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-sm text-foreground focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              {/* Title / Honorific */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  Custom Rank / Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Architect of Flow"
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-sm text-foreground focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  Date of Birth (DOB)
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-sm text-foreground focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-sm text-foreground focus:outline-none focus:border-amber-400 transition-colors"
                >
                  {GENDER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-stone-900 text-foreground">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bio / Directive */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Personal Directive / Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="What is your primary mission in the sanctuary?"
                className="w-full px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-sm text-foreground focus:outline-none focus:border-amber-400 transition-colors resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-stone-100 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(212,168,83,0.3)] cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Save Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── ALLY BOND & ACCOUNTS DETAILS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Active Companion Bond */}
        <div className="lg:col-span-5 world-deck p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Active Sanctuary Ally
            </h3>
            <span className="text-xs font-mono font-bold text-amber-300">
              {agentName}
            </span>
          </div>

          <div className="flex flex-col items-center p-4 rounded-2xl bg-stone-900/50 border border-stone-800/80">
            <Companion size={130} showPlatform={true} showGlow={true} />
            <div className="mt-3 text-center">
              <span className="text-xs font-bold text-stone-200">
                Partnered with {charConfig.archetype?.toUpperCase() || 'NYXEN'}
              </span>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Earn XP together by completing daily quests & focus sessions.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-stone-800/80">
            <span className="text-xs font-semibold text-stone-400 block mb-2">Switch Ally:</span>
            <CompanionSelector variant="pills" />
          </div>
        </div>

        {/* Right: Unlocked Achievements & Badges Matrix */}
        <div className="lg:col-span-7 world-deck p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Productivity Badges ({badges.filter((b) => b.isUnlocked).length}/{badges.length})
              </h3>
            </div>
            <span className="text-xs text-stone-400 font-medium">Auto-unlocked via progress</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                  badge.isUnlocked
                    ? 'bg-amber-400/10 border-amber-400/40 shadow-sm'
                    : 'bg-stone-900/40 border-stone-800/60 opacity-60'
                }`}
              >
                <div className="text-2xl shrink-0 p-1.5 rounded-xl bg-stone-900/80 border border-stone-800">
                  {badge.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-foreground font-serif">{badge.title}</h4>
                    {badge.isUnlocked ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300 font-bold">
                        Unlocked
                      </span>
                    ) : (
                      <Lock className="w-3 h-3 text-stone-500" />
                    )}
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5 leading-snug">
                    {badge.description}
                  </p>
                  <span className="text-[10px] text-amber-300/70 font-mono mt-1 block">
                    {badge.progressText}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
