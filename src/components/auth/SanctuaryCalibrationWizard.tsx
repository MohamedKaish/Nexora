'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/appStore'
import { useTaskStore } from '@/store/useTaskStore'
import { useHabitStore } from '@/store/useHabitStore'
import { useNoteStore } from '@/store/useNoteStore'
import { useKyroStore } from '@/store/kyroStore'
import { playChime } from '@/utils/soundEngine'
import {
  MissionArchetype,
  Chronotype,
  CoachingTone,
} from '@/types/local'
import {
  KyroCharacterModel,
  KyroCostume,
  KyroColorTheme,
} from '@/types/kyro'
import {
  User,
  Lock,
  Mail,
  Shield,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Check,
  Zap,
  Target,
  Sun,
  Moon,
  Sunrise,
  Clock,
  Flame,
  Plus,
  Crown,
  Eye,
  EyeOff,
  Bot,
  Compass,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

const TITLE_OPTIONS = ['Boss', 'Commander', 'Architect', 'Legend', 'Captain', 'Master']

const MISSION_OPTIONS: {
  id: MissionArchetype
  title: string
  subtitle: string
  icon: string
  badge: string
}[] = [
  {
    id: 'software',
    title: 'Software Engineering & Tech Mastery',
    subtitle: 'Coding, shipping products, system architecture & sprint execution.',
    icon: '💻',
    badge: 'Tech Horizon',
  },
  {
    id: 'academic',
    title: 'Academic & Exam Excellence',
    subtitle: 'Study chambers, research deep-dives, high retention & exam mastery.',
    icon: '🎓',
    badge: 'Scholar Matrix',
  },
  {
    id: 'founder',
    title: 'Founder & Career Scaling',
    subtitle: 'High-leverage strategic decisions, milestone velocity & leadership ops.',
    icon: '🚀',
    badge: 'Venture Forge',
  },
  {
    id: 'fitness',
    title: 'Peak Mind, Fitness & Discipline',
    subtitle: 'Habit streaks, physical fitness, nutrition discipline & unbroken focus.',
    icon: '⚡',
    badge: 'Vitality Core',
  },
]

const CHRONOTYPE_OPTIONS: {
  id: Chronotype
  name: string
  window: string
  desc: string
  icon: React.ElementType
  defaultWake: string
  defaultSleep: string
}[] = [
  {
    id: 'dawn',
    name: 'Dawn Vanguard',
    window: '06:00 AM – 12:00 PM',
    desc: 'Uninterrupted sunrise flow. Peak mental clarity during morning stillness.',
    icon: Sunrise,
    defaultWake: '06:00',
    defaultSleep: '22:00',
  },
  {
    id: 'solar',
    name: 'Solar Tactician',
    window: '11:00 AM – 06:00 PM',
    desc: 'Midday executive stamina. Highest output during active collaboration hours.',
    icon: Sun,
    defaultWake: '08:00',
    defaultSleep: '23:30',
  },
  {
    id: 'midnight',
    name: 'Midnight Phantom',
    window: '06:00 PM – 01:00 AM',
    desc: 'Deep nocturnal isolation. Highest focus when the outside world powers down.',
    icon: Moon,
    defaultWake: '09:30',
    defaultSleep: '01:30',
  },
]

const STARTER_HABITS_POOL = [
  { id: 'h_deep_work', name: '90m Deep Work Sprint', icon: '🧠', period: 'morning' },
  { id: 'h_hydration', name: 'Hydration & Energy Reset (2L)', icon: '💧', period: 'morning' },
  { id: 'h_training', name: 'Physical Training / Movement (30m)', icon: '🏋️', period: 'afternoon' },
  { id: 'h_reading', name: '20m Tactical Learning / Reading', icon: '📖', period: 'evening' },
  { id: 'h_review', name: 'Evening Protocol & Note Review', icon: '📝', period: 'evening' },
]

const MODEL_OPTIONS: { id: KyroCharacterModel; name: string; tag: string; emoji: string }[] = [
  { id: 'kyro_prime', name: 'Kyro Prime', tag: 'Cyber Spirit Companion', emoji: '✨' },
  { id: 'pyro_fox', name: 'Pyro Fox', tag: 'Elemental Creature', emoji: '🦊' },
  { id: 'aegis_bot', name: 'Aegis Bot', tag: 'Armored Tactical Sentinel', emoji: '🛡️' },
]

const COSTUME_OPTIONS: { id: KyroCostume; name: string; icon: string }[] = [
  { id: 'royal_crown', name: 'Royal Crown', icon: '👑' },
  { id: 'cyber_visor', name: 'Cyber Visor', icon: '👓' },
  { id: 'samurai_crest', name: 'Samurai Crest', icon: '⚔️' },
  { id: 'wizard_hat', name: 'Wizard Hat', icon: '🧙' },
  { id: 'pro_headphones', name: 'Studio Headphones', icon: '🎧' },
  { id: 'none', name: 'Clean Minimal', icon: '💎' },
]

const THEME_OPTIONS: { id: KyroColorTheme; name: string; hex: string; desc: string }[] = [
  { id: 'obsidian_gold', name: 'Obsidian Gold', hex: '#D4A853', desc: 'Sovereign luxury' },
  { id: 'cyber_neon', name: 'Cyber Neon', hex: '#06B6D4', desc: 'Electric cyan' },
  { id: 'crimson_mecha', name: 'Crimson Mecha', hex: '#EF4444', desc: 'Aggressive drive' },
  { id: 'emerald_sage', name: 'Emerald Sage', hex: '#10B981', desc: 'Natural equilibrium' },
  { id: 'royal_amethyst', name: 'Royal Amethyst', hex: '#8B5CF6', desc: 'Imperial mystic' },
  { id: 'arctic_pearl', name: 'Arctic Pearl', hex: '#E2E8F0', desc: 'Crystalline focus' },
]

const COACHING_TONE_OPTIONS: { id: CoachingTone; name: string; tag: string; desc: string }[] = [
  {
    id: 'tactical',
    name: 'Tactical J.A.R.V.I.S.',
    tag: 'Witty, precise & protective',
    desc: 'Offers concise situational updates, tracks your focus horizons, and speaks like an elite AI butler.',
  },
  {
    id: 'hype',
    name: 'High-Energy Hype Coach',
    tag: 'Unstoppable momentum',
    desc: 'Celebrates your wins with intense energy, keeps motivation peaked, and urges you to crush inertia.',
  },
  {
    id: 'zen',
    name: 'Calm Zen Strategist',
    tag: 'Mindful & grounded',
    desc: 'Gentle pacing, breath-anchored reminders, and low-friction prioritization to avoid burnout.',
  },
]

export function SanctuaryCalibrationWizard({
  initialStep = 1,
  onComplete,
}: {
  initialStep?: number
  onComplete?: () => void
}) {
  const router = useRouter()
  const { preferences, completeOnboarding, setDisplayName: setStoreName } = useAppStore()
  const { setModel, setCostume, setColorTheme, speak, setAnimationState } = useKyroStore()

  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState(initialStep)

  useEffect(() => {
    setMounted(true)
  }, [])

  // ── Step 1 State ──
  const [email, setEmail] = useState(preferences.email || 'architect@nexora.local')
  const [password, setPassword] = useState('nexora2026')
  const [showPassword, setShowPassword] = useState(false)
  const [displayName, setDisplayName] = useState(preferences.displayName || 'Mohamed')
  const [preferredTitle, setPreferredTitle] = useState(preferences.preferredTitle || 'Commander')
  const [customTitleMode, setCustomTitleMode] = useState(false)

  // ── Step 2 State ──
  const [mission, setMission] = useState<MissionArchetype>(preferences.missionArchetype || 'software')

  // ── Step 3 State ──
  const [chronotype, setChronotype] = useState<Chronotype>(preferences.chronotype || 'dawn')
  const [wakeTime, setWakeTime] = useState(preferences.wakeTime || '06:30')
  const [sleepTime, setSleepTime] = useState(preferences.sleepTime || '22:30')

  // ── Step 4 State ──
  const [taskTitle, setTaskTitle] = useState('Launch core Nexora Sanctuary milestone')
  const [taskDueTime, setTaskDueTime] = useState('17:00')
  const [selectedHabits, setSelectedHabits] = useState<string[]>([
    '90m Deep Work Sprint',
    'Hydration & Energy Reset (2L)',
  ])
  const [customHabitText, setCustomHabitText] = useState('')

  // ── Step 5 State ──
  const [model, setSelectedModel] = useState<KyroCharacterModel>('kyro_prime')
  const [costume, setSelectedCostume] = useState<KyroCostume>('royal_crown')
  const [theme, setSelectedTheme] = useState<KyroColorTheme>('obsidian_gold')
  const [coachingTone, setCoachingTone] = useState<CoachingTone>('tactical')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Dynamic Kyro Guide Voice at each step
  useEffect(() => {
    switch (step) {
      case 1:
        speak(
          `Greetings, ${preferredTitle || 'Architect'}! Establish your secure sanctuary credentials and tell me what honorific you prefer. I answer only to you.`,
          5000
        )
        break
      case 2:
        speak(
          'Target locked. Every mission needs a primary horizon so I can filter out noise and calibrate your daily priorities.',
          5000
        )
        break
      case 3:
        speak(
          'Circadian synchronization. Tell me your peak mental velocity and sleep windows so I can alert you exactly when your mind is sharpest.',
          5000
        )
        break
      case 4:
        speak(
          'Execution begins with a single decisive quest. Lock in today\'s #1 objective and anchor at least two starter habits.',
          5000
        )
        break
      case 5:
        speak(
          'Awaken my 3D vessel! Pick my form, battle gear, and vocal persona. Together, we will conquer your sanctuary!',
          5000
        )
        break
    }
  }, [step])

  // Step 1 Validation
  const isEmailValid = email.trim().includes('@') && email.trim().includes('.')
  const isStep1Valid =
    displayName.trim().length >= 2 &&
    preferredTitle.trim().length >= 1 &&
    isEmailValid &&
    password.length >= 4

  // Step 2 Validation
  const isStep2Valid = Boolean(mission)

  // Step 3 Validation
  const isStep3Valid = Boolean(chronotype) && wakeTime.length >= 4 && sleepTime.length >= 4

  // Step 4 Validation
  const isStep4Valid = taskTitle.trim().length >= 3 && selectedHabits.length >= 2

  // Step 5 Validation
  const isStep5Valid = Boolean(model) && Boolean(costume) && Boolean(theme) && Boolean(coachingTone)

  const handleNext = () => {
    playChime('click')
    setStep((s) => Math.min(s + 1, 5))
  }

  const handleBack = () => {
    playChime('click')
    setStep((s) => Math.max(s - 1, 1))
  }

  const handleAddCustomHabit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = customHabitText.trim()
    if (!trimmed) return
    if (!selectedHabits.includes(trimmed)) {
      setSelectedHabits((prev) => [...prev, trimmed])
      toast.success(`Added custom habit: "${trimmed}"`)
    }
    setCustomHabitText('')
  }

  const toggleHabit = (habitName: string) => {
    playChime('click')
    setSelectedHabits((prev) =>
      prev.includes(habitName) ? prev.filter((h) => h !== habitName) : [...prev, habitName]
    )
  }

  const handleFinalSubmit = async () => {
    if (!isStep5Valid || isSubmitting) return
    setIsSubmitting(true)

    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd')

      // 1. Update Core App & User Profile
      setStoreName(displayName.trim())
      completeOnboarding({
        displayName: displayName.trim(),
        preferredTitle: preferredTitle.trim(),
        email: email.trim(),
        missionArchetype: mission,
        chronotype,
        wakeTime,
        sleepTime,
        coachingTone,
      })

      // 2. Add #1 Priority Quest into useTaskStore
      if (taskTitle.trim()) {
        useTaskStore.getState().addTask({
          title: `⚔️ ${taskTitle.trim()}`,
          description: `Seeded during Sanctuary Calibration as today's #1 decisive priority for ${preferredTitle} ${displayName}.`,
          priority: 'urgent',
          timeframe: 'daily',
          dueDate: todayStr,
          startTime: taskDueTime || '14:00',
          enableReminder: true,
        })
      }

      // 3. Seed Starter Habits into useHabitStore
      const habitStore = useHabitStore.getState()
      for (const habitName of selectedHabits) {
        habitStore.addHabit({
          name: habitName,
          description: `Cornerstone habit seeded in ${preferredTitle}'s sanctuary calibration.`,
          frequency: 'daily',
          hasTimeRange: true,
          startTime: chronotype === 'dawn' ? '07:30' : '09:00',
          endTime: chronotype === 'dawn' ? '11:00' : '17:00',
          enableReminder: true,
        })
      }

      // 4. Create Welcome Tactical Note into useNoteStore
      const missionLabel = MISSION_OPTIONS.find((m) => m.id === mission)?.title || 'Primary Mission'
      useNoteStore.getState().addNote({
        title: `📜 Welcome to Nexora Sanctuary, ${preferredTitle} ${displayName}`,
        content: `Your digital habitat is synchronized under the "${missionLabel}" directive. Peak focus window: ${wakeTime} - ${sleepTime}. Kyro 3D companion is active in ${coachingTone} persona mode.`,
        priority: 'urgent',
        color: 'gold',
        isPinned: true,
        remindAt: new Date(Date.now() + 15 * 60 * 1000).toISOString().slice(0, 16),
        checklist: [
          { id: 'w1', text: `Execute today's #1 quest: "${taskTitle}"`, done: false },
          { id: 'w2', text: `Verify daily habit commitments (${selectedHabits.length} active)`, done: false },
          { id: 'w3', text: 'Enable device notification bridge in Settings or top banner', done: false },
        ],
      })

      // 5. Apply Kyro 3D Model, Costume, and Theme
      setModel(model)
      setCostume(costume)
      setColorTheme(theme)
      setAnimationState('CELEBRATING', 4000)
      playChime('celebrate')

      // 6. Speak Victory Transmission
      speak(
        `Sanctuary neural link established, ${preferredTitle} ${displayName}! Your #1 quest is primed in today's task matrix. Let us make history.`,
        8000,
        undefined,
        true
      )

      toast.success(`Sanctuary calibrated! Welcome, ${preferredTitle} ${displayName}.`)

      if (onComplete) {
        onComplete()
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      console.error(err)
      toast.error('An error occurred during calibration. Please try again.')
      setIsSubmitting(false)
    }
  }

  if (!mounted) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-6">
        <div className="h-20 rounded-3xl bg-stone-900/40 border border-stone-800/60 animate-pulse" />
        <div className="h-96 rounded-3xl bg-stone-900/40 border border-stone-800/60 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* ── Segmented Glowing Progress Bar ── */}
      <div className="p-5 rounded-3xl bg-stone-950/80 border border-stone-800/80 backdrop-blur-xl shadow-2xl space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 font-mono font-bold text-[11px] tracking-wider uppercase">
              Step {step} of 5
            </span>
            <span className="text-stone-300 font-semibold hidden sm:inline">
              {step === 1 && 'Sanctuary Authentication & Identity'}
              {step === 2 && 'Primary Horizon & Directives'}
              {step === 3 && 'Chronotype & Mental Velocity'}
              {step === 4 && '#1 Decisive Quest & Starter Habits'}
              {step === 5 && 'Awaken Your 3D Kyro Companion'}
            </span>
          </div>
          <span className="font-mono text-amber-400 font-bold text-xs">
            {step * 20}% Calibrated
          </span>
        </div>

        {/* 5 Progress Segments */}
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((idx) => {
            const isCompleted = step > idx
            const isCurrent = step === idx
            return (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${
                  isCompleted
                    ? 'bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                    : isCurrent
                    ? 'bg-gradient-to-r from-amber-400 to-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.7)] animate-pulse'
                    : 'bg-stone-800/80'
                }`}
              />
            )
          })}
        </div>
      </div>

      {/* ── Step Container (Liquid Glass Obsidian) ── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-stone-950/90 border border-stone-800 backdrop-blur-2xl shadow-2xl relative overflow-hidden space-y-6">
        {/* Ambient Subtle Accent Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 blur-[100px] pointer-events-none rounded-full" />

        {/* ════════════════ STEP 1: IDENTITY & AUTH ════════════════ */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider font-mono">
                <Shield className="w-3.5 h-3.5" />
                <span>Protocol 01 • Master Credentials</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-100">
                Establish Your Sanctuary Identity
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
                Nexora is your private, local-first ecosystem. Set your authentication credentials and choose how Kyro will address you.
              </p>
            </div>

            <div className="space-y-4">
              {/* Credentials Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-300 flex items-center justify-between">
                    <span>Email / Sanctuary ID</span>
                    <span className="text-[10px] text-stone-500 font-mono">Required</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.com"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-900/90 border border-stone-800 focus:border-amber-400 text-sm text-stone-100 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-300 flex items-center justify-between">
                    <span>Password / Passcode</span>
                    <span className="text-[10px] text-stone-500 font-mono">Min 4 chars</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-stone-900/90 border border-stone-800 focus:border-amber-400 text-sm text-stone-100 outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Display Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-300 flex items-center justify-between">
                  <span>Your Display Name</span>
                  <span className="text-[10px] text-stone-500 font-mono">e.g. Mohamed, Alex</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-900/90 border border-stone-800 focus:border-amber-400 text-sm text-stone-100 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Preferred Honorific Title */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-300 block">
                  Preferred Title for Kyro to Call You:
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {TITLE_OPTIONS.map((t) => {
                    const isSelected = preferredTitle === t && !customTitleMode
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setPreferredTitle(t)
                          setCustomTitleMode(false)
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-400 text-stone-950 font-bold shadow-[0_0_12px_rgba(212,168,83,0.35)]'
                            : 'bg-stone-900/90 hover:bg-stone-800 border border-stone-800 text-stone-300'
                        }`}
                      >
                        {t}
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    onClick={() => setCustomTitleMode(true)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      customTitleMode
                        ? 'bg-amber-400 text-stone-950 font-bold shadow-[0_0_12px_rgba(212,168,83,0.35)]'
                        : 'bg-stone-900/90 hover:bg-stone-800 border border-stone-800 text-stone-400'
                    }`}
                  >
                    + Custom
                  </button>
                </div>

                {customTitleMode && (
                  <div className="pt-1">
                    <input
                      type="text"
                      value={preferredTitle}
                      onChange={(e) => setPreferredTitle(e.target.value)}
                      placeholder="Type custom title (e.g., Sensei, Sovereign)"
                      className="w-full sm:w-64 px-3.5 py-2 rounded-xl bg-stone-900 border border-amber-500/50 text-xs text-stone-100 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* 1-Click Fill Helper */}
              <div className="pt-2 flex items-center justify-between text-xs text-stone-400">
                <span>Want to test immediately?</span>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('mohamed@nexora.local')
                    setPassword('nexora2026')
                    setDisplayName('Mohamed')
                    setPreferredTitle('Commander')
                    setCustomTitleMode(false)
                    toast.success('Sanctuary test credentials filled!')
                  }}
                  className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer underline text-xs flex items-center gap-1"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>1-Click Test Credentials</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════ STEP 2: PRIMARY HORIZON ════════════════ */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider font-mono">
                <Target className="w-3.5 h-3.5" />
                <span>Protocol 02 • Core Objective</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-100">
                What is Your Primary Horizon?
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
                Kyro calibrates daily suggested tasks, habit suggestions, and timetable priorities around your primary battleground. Pick at least 1:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {MISSION_OPTIONS.map((opt) => {
                const isSelected = mission === opt.id
                return (
                  <div
                    key={opt.id}
                    onClick={() => {
                      playChime('click')
                      setMission(opt.id)
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? 'bg-amber-400/10 border-amber-400/60 shadow-[0_0_25px_rgba(212,168,83,0.15)] ring-1 ring-amber-400/40'
                        : 'bg-stone-900/60 border-stone-800/80 hover:border-stone-700 hover:bg-stone-900'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-3xl p-2 rounded-xl bg-stone-950/60 border border-stone-800">
                        {opt.icon}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          isSelected
                            ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                            : 'bg-stone-800 text-stone-400 border-stone-700'
                        }`}
                      >
                        {opt.badge}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3
                        className={`text-sm font-bold transition-colors ${
                          isSelected ? 'text-amber-300' : 'text-stone-100'
                        }`}
                      >
                        {opt.title}
                      </h3>
                      <p className="text-xs text-stone-400 leading-snug">{opt.subtitle}</p>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-400 pt-1">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-amber-400 border-amber-400 text-stone-950'
                            : 'border-stone-700'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span>{isSelected ? 'Selected Active Horizon' : 'Select Directive'}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ════════════════ STEP 3: CHRONOTYPE & REMINDERS ════════════════ */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider font-mono">
                <Clock className="w-3.5 h-3.5" />
                <span>Protocol 03 • Chrono-Sync</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-100">
                Peak Velocity &amp; Notification Windows
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
                When is your brain operating at maximum horsepower? Kyro will schedule 15m habit warnings and focus blocks around this schedule.
              </p>
            </div>

            {/* Chronotype Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CHRONOTYPE_OPTIONS.map((c) => {
                const Icon = c.icon
                const isSelected = chronotype === c.id
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      playChime('click')
                      setChronotype(c.id)
                      setWakeTime(c.defaultWake)
                      setSleepTime(c.defaultSleep)
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                      isSelected
                        ? 'bg-amber-400/10 border-amber-400/60 shadow-[0_0_20px_rgba(212,168,83,0.15)] ring-1 ring-amber-400/30'
                        : 'bg-stone-900/60 border-stone-800/80 hover:border-stone-700 hover:bg-stone-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`p-2 rounded-xl border ${
                          isSelected
                            ? 'bg-amber-400 text-stone-950 border-amber-400'
                            : 'bg-stone-800 text-stone-300 border-stone-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono text-stone-400 font-bold">
                        {c.window}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3
                        className={`text-sm font-bold ${
                          isSelected ? 'text-amber-300' : 'text-stone-100'
                        }`}
                      >
                        {c.name}
                      </h3>
                      <p className="text-[11px] text-stone-400 leading-relaxed">{c.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Daily Timing Windows */}
            <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
              <h4 className="text-xs font-bold text-stone-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Daily Notification Timing Horizon</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-stone-300 font-semibold block">
                    🌅 Wake &amp; Morning Briefing Window:
                  </label>
                  <input
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 focus:border-amber-400 text-sm text-stone-100 outline-none"
                  />
                  <p className="text-[10px] text-stone-500">Kyro issues morning mission summary.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-stone-300 font-semibold block">
                    🌙 Evening Wrap-up &amp; Ledger Check:
                  </label>
                  <input
                    type="time"
                    value={sleepTime}
                    onChange={(e) => setSleepTime(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 focus:border-amber-400 text-sm text-stone-100 outline-none"
                  />
                  <p className="text-[10px] text-stone-500">Unlocks streak ledger and nightly reflection.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════ STEP 4: SEED #1 QUEST & STARTER HABITS ════════════════ */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider font-mono">
                <Flame className="w-3.5 h-3.5" />
                <span>Protocol 04 • Decisive Seeding</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-100">
                Lock In Your #1 Objective &amp; Starter Habits
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
                Great systems start with immediate action. Enter your #1 priority task for today and select at least 2 habits to anchor your momentum.
              </p>
            </div>

            {/* Today's #1 Priority Task */}
            <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider font-mono">
                  <Target className="w-3.5 h-3.5" />
                  <span>Today&apos;s #1 Priority Quest (Urgent)</span>
                </label>
                <span className="text-[10px] text-stone-500 font-mono">Direct task matrix injection</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g., Ship core architecture milestone"
                  className="sm:col-span-2 px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 focus:border-amber-400 text-sm text-stone-100 outline-none"
                />
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-stone-400 shrink-0" />
                  <input
                    type="time"
                    value={taskDueTime}
                    onChange={(e) => setTaskDueTime(e.target.value)}
                    className="w-full px-2.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 focus:border-amber-400 text-xs text-stone-100 outline-none"
                  />
                </div>
              </div>

              {/* Suggestions */}
              <div className="space-y-1">
                <span className="text-[10px] text-stone-400 font-medium">Quick Suggestions:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Deploy core production module',
                    'Complete 45m deep study sprint',
                    'Review codebase & verify integrity',
                    'Draft strategic roadmap proposal',
                  ].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setTaskTitle(sug)}
                      className="px-2.5 py-1 rounded-lg bg-stone-800/80 hover:bg-stone-700 text-stone-300 text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Starter Habits Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-200 block uppercase tracking-wider font-mono">
                  Select at least 2 Starter Daily Habits:
                </label>
                <span className="text-[11px] font-mono text-amber-400 font-bold">
                  {selectedHabits.length} selected
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {STARTER_HABITS_POOL.map((h) => {
                  const isChecked = selectedHabits.includes(h.name)
                  return (
                    <div
                      key={h.id}
                      onClick={() => toggleHabit(h.name)}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-amber-400/10 border-amber-400/50 shadow-sm ring-1 ring-amber-400/30'
                          : 'bg-stone-900/60 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{h.icon}</span>
                        <span
                          className={`text-xs font-semibold ${
                            isChecked ? 'text-amber-300' : 'text-stone-300'
                          }`}
                        >
                          {h.name}
                        </span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                          isChecked
                            ? 'bg-amber-400 border-amber-400 text-stone-950'
                            : 'border-stone-700'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Add Custom Habit */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={customHabitText}
                  onChange={(e) => setCustomHabitText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddCustomHabit()
                    }
                  }}
                  placeholder="Or type your own custom habit (e.g. 10m morning stretch)"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-100 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => handleAddCustomHabit()}
                  disabled={!customHabitText.trim()}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-stone-200 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════ STEP 5: 3D KYRO AWAKENING ════════════════ */}
        {step === 5 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider font-mono">
                <Bot className="w-3.5 h-3.5" />
                <span>Protocol 05 • Neural Manifestation</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-100">
                Awaken Your 3D Companion Vessel
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
                Choose your companion&apos;s physical 3D form, signature gear, chromatic aura, and J.A.R.V.I.S. coaching persona.
              </p>
            </div>

            {/* 3D Model Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-200 uppercase tracking-wider font-mono block">
                1. 3D Model Archetype:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {MODEL_OPTIONS.map((m) => {
                  const isSelected = model === m.id
                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        playChime('click')
                        setSelectedModel(m.id)
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                        isSelected
                          ? 'bg-amber-400/10 border-amber-400/60 shadow-md ring-1 ring-amber-400/40'
                          : 'bg-stone-900/60 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <span className="text-2xl">{m.emoji}</span>
                      <div>
                        <h4
                          className={`text-xs font-bold ${
                            isSelected ? 'text-amber-300' : 'text-stone-200'
                          }`}
                        >
                          {m.name}
                        </h4>
                        <span className="text-[10px] text-stone-400 block">{m.tag}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Starter 3D Costume */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-200 uppercase tracking-wider font-mono block">
                2. Starter 3D Gear / Costume:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COSTUME_OPTIONS.map((c) => {
                  const isSelected = costume === c.id
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        playChime('click')
                        setSelectedCostume(c.id)
                      }}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-400/15 border-amber-400/60 text-amber-300 font-bold'
                          : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-stone-700'
                      }`}
                    >
                      <span className="text-lg">{c.icon}</span>
                      <span className="text-xs">{c.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Color Theme */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-200 uppercase tracking-wider font-mono block">
                3. Chromatic Theme:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {THEME_OPTIONS.map((th) => {
                  const isSelected = theme === th.id
                  return (
                    <div
                      key={th.id}
                      onClick={() => {
                        playChime('click')
                        setSelectedTheme(th.id)
                      }}
                      className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-400/15 border-amber-400/60 ring-1 ring-amber-400/30'
                          : 'bg-stone-900/60 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-stone-900 shrink-0 shadow-sm"
                        style={{ backgroundColor: th.hex }}
                      />
                      <div>
                        <span
                          className={`text-xs block font-semibold ${
                            isSelected ? 'text-amber-300 font-bold' : 'text-stone-300'
                          }`}
                        >
                          {th.name}
                        </span>
                        <span className="text-[9px] text-stone-500 font-mono block">
                          {th.desc}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Coaching Tone */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-200 uppercase tracking-wider font-mono block">
                4. Coaching Voice &amp; Persona:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {COACHING_TONE_OPTIONS.map((ton) => {
                  const isSelected = coachingTone === ton.id
                  return (
                    <div
                      key={ton.id}
                      onClick={() => {
                        playChime('click')
                        setCoachingTone(ton.id)
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                        isSelected
                          ? 'bg-amber-400/10 border-amber-400/60 ring-1 ring-amber-400/30 shadow-md'
                          : 'bg-stone-900/60 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <h4
                        className={`text-xs font-bold ${
                          isSelected ? 'text-amber-300' : 'text-stone-200'
                        }`}
                      >
                        {ton.name}
                      </h4>
                      <span className="text-[10px] text-amber-400/80 font-mono block font-semibold">
                        {ton.tag}
                      </span>
                      <p className="text-[11px] text-stone-400 leading-snug">{ton.desc}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Footer Navigation & Strict Validation Gate ── */}
        <div className="pt-6 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>← Back</span>
              </button>
            ) : (
              <div className="text-[11px] text-stone-500 font-mono">
                Encrypted with local AES-256 storage
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* Validation Helper Hint when disabled */}
            {step === 1 && !isStep1Valid && (
              <span className="text-[11px] text-amber-400/80 font-mono">
                ⚠️ Enter name, title, email &amp; passcode
              </span>
            )}
            {step === 2 && !isStep2Valid && (
              <span className="text-[11px] text-amber-400/80 font-mono">
                ⚠️ Select at least 1 mission
              </span>
            )}
            {step === 3 && !isStep3Valid && (
              <span className="text-[11px] text-amber-400/80 font-mono">
                ⚠️ Choose chronotype &amp; times
              </span>
            )}
            {step === 4 && !isStep4Valid && (
              <span className="text-[11px] text-amber-400/80 font-mono">
                ⚠️ Enter #1 task &amp; pick 2 habits
              </span>
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={
                  (step === 1 && !isStep1Valid) ||
                  (step === 2 && !isStep2Valid) ||
                  (step === 3 && !isStep3Valid) ||
                  (step === 4 && !isStep4Valid)
                }
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-stone-950 font-bold text-xs shadow-[0_0_20px_rgba(212,168,83,0.35)] flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Continue to Step {step + 1}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={!isStep5Valid || isSubmitting}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-stone-950 font-bold text-sm shadow-[0_0_30px_rgba(212,168,83,0.45)] flex items-center justify-center gap-2.5 transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-stone-950" />
                <span>
                  {isSubmitting
                    ? '⚡ Establishing Neural Link...'
                    : '⚡ Initialize Sanctuary & Enter Dashboard'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
