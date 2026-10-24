'use client'

import React, { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { useAppStore } from '@/store/appStore'
import { useTaskStore } from '@/store/useTaskStore'
import { useHabitStore } from '@/store/useHabitStore'
import { useGoalStore } from '@/store/useGoalStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useFocusStore } from '@/store/useFocusStore'
import { useCharacterStore } from '@/store/characterStore'
import { useKyroStore } from '@/store/kyroStore'
import { useNoteStore } from '@/store/useNoteStore'
import { useFinanceStore } from '@/store/useFinanceStore'
import { useHydrationStore } from '@/store/useHydrationStore'
import { Companion } from '@/components/companion/Companion'
import { CompanionSelector } from '@/components/companion/CompanionSelector'
import { companionController } from '@/components/companion/CompanionController'
import {
  Compass,
  CheckCircle2,
  Circle,
  Flame,
  Zap,
  Target,
  FolderKanban,
  ArrowRight,
  Plus,
  Bot,
  Sparkles,
  Calendar,
  Download,
  StickyNote,
  Clock,
  Pin,
  DollarSign,
  Droplets,
  Bell,
  Volume2,
  Vibrate,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Coffee,
  Sun,
  Moon,
  CloudSun,
  ChevronRight,
  Receipt,
  X,
  CreditCard,
} from 'lucide-react'
import { format } from 'date-fns'
import { usePwa } from '@/components/pwa/PwaProvider'
import {
  getNotificationPermission,
  requestNotificationPermission,
} from '@/lib/notificationService'
import { triggerCircadianTestAlert } from '@/lib/scheduleNotificationWatcher'
import { MultiRailIngestionModal } from '@/components/finance/MultiRailIngestionModal'
import { toast } from 'sonner'

export default function DashboardPage() {
  const userName = useAppStore((s) => s.preferences.displayName) || 'Explorer'
  const agentName = useAppStore((s) => s.agentConfig.name) || 'Kyro'
  const toggleKyro = useKyroStore((s) => s.toggleOpen)
  const speakKyro = useKyroStore((s) => s.speak)
  const { isInstalled, openDownloadModal } = usePwa()

  const tasks = useTaskStore((s) => s.tasks)
  const toggleTaskStatus = useTaskStore((s) => s.toggleStatus)
  const habits = useHabitStore((s) => s.habits)
  const completions = useHabitStore((s) => s.completions)
  const toggleHabit = useHabitStore((s) => s.toggleCompletion)
  const goals = useGoalStore((s) => s.goals)
  const projects = useProjectStore((s) => s.projects)

  const isFocusRunning = useFocusStore((s) => s.isRunning)
  const startFocusTimer = useFocusStore((s) => s.startTimer)

  // Finance Pacing Store
  const financeStore = useFinanceStore()
  const financeCalc = financeStore.getCalculations()

  // Hydration Store
  const hydrationStore = useHydrationStore()
  const hydrationCalc = hydrationStore.getCalculations()

  const [mounted, setMounted] = useState(false)
  const [notifPermission, setNotifPermission] = useState<string>('default')
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  const [isMultiRailOpen, setIsMultiRailOpen] = useState(false)
  const [expenseTitle, setExpenseTitle] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseCategory, setExpenseCategory] = useState('Food & Dining')
  const [isTestingNotif, setIsTestingNotif] = useState(false)

  useEffect(() => {
    setMounted(true)
    setNotifPermission(getNotificationPermission())
  }, [])

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const dateHeading = format(new Date(), 'EEEE, MMMM do')

  // Context calculations
  const stats = useMemo(() => {
    const activeTasks = tasks.filter((t) => t.status !== 'done')
    const completedToday = tasks.filter((t) => t.status === 'done')
    const urgentTasks = activeTasks.filter((t) => t.priority === 'urgent' || t.priority === 'high')
    const habitsDoneToday = completions.filter((c) => c.completedDate === todayStr).length
    const activeGoals = goals.filter((g) => g.status === 'active')
    const maxStreak = Math.max(...habits.map((h) => h.streak), 0)

    return {
      activeTasks,
      completedToday,
      urgentTasks,
      habitsDoneToday,
      activeGoals,
      maxStreak,
    }
  }, [tasks, habits, completions, goals, todayStr])

  // Contextual speech bubble message from Kyro
  const companionMessage = useMemo(() => {
    if (isFocusRunning) return "Chamber locked. Stay in flow. One breath, one task."
    if (financeCalc.isAtRisk) {
      return `Warning: Cash trajectory is at risk of dipping below your $${financeStore.accountFloor} floor. Let's pace our spending today.`
    }
    if (hydrationCalc.completionPercentage < 40 && new Date().getHours() >= 13) {
      return `Circadian hydration checkpoint: we need ${hydrationCalc.remainingMl}ml before evening. Grab a glass of water!`
    }
    if (stats.urgentTasks.length > 0) {
      return `Safe-to-Spend is $${financeCalc.safeToSpendDaily.toFixed(2)}. ${stats.urgentTasks.length} high-leverage objective${stats.urgentTasks.length > 1 ? 's' : ''} on the docket.`
    }
    return `Systems aligned! $${financeCalc.safeToSpendDaily.toFixed(2)} safe to spend today. Hydration at ${hydrationCalc.completionPercentage}%.`
  }, [isFocusRunning, financeCalc, hydrationCalc, stats.urgentTasks.length, financeStore.accountFloor])

  const greeting = useMemo(() => {
    if (!mounted) return `Welcome, ${userName}`
    const hour = new Date().getHours()
    if (hour < 12) return `Good morning, ${userName}`
    if (hour < 18) return `Good afternoon, ${userName}`
    return `Good evening, ${userName}`
  }, [mounted, userName])

  const handleTaskToggle = (id: string, currentStatus: string) => {
    const task = tasks.find((t) => t.id === id)
    toggleTaskStatus(id)
    if (currentStatus !== 'done') {
      companionController.onTaskCompleted(task?.title)
    }
  }

  const handleHabitToggle = (id: string) => {
    const habit = habits.find((h) => h.id === id)
    const wasCompleted = toggleHabit(id)
    if (wasCompleted) {
      companionController.onHabitChecked(habit?.name, (habit?.streak || 0) + 1)
    }
  }

  const handleEnablePermissions = async () => {
    const perm = await requestNotificationPermission()
    setNotifPermission(perm)
    if (perm === 'granted') {
      toast.success('System notifications enabled! You will receive lock-screen alerts like Amazon and Flipkart.')
    } else if (perm === 'denied') {
      toast.error('Permission blocked. Please allow notifications in site/browser settings.')
    }
  }

  const handleTestNotification = async (anchor: 'morning' | 'midday' | 'evening' | 'custom') => {
    setIsTestingNotif(true)
    try {
      await triggerCircadianTestAlert(anchor)
      toast.success(`Out-of-app notification banner dispatched with chime and vibration!`)
    } catch {
      toast.error('Failed to dispatch notification.')
    } finally {
      setIsTestingNotif(false)
    }
  }

  const handleLogExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amountNum = parseFloat(expenseAmount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid expense amount.')
      return
    }

    financeStore.logExpense(expenseTitle || 'Discretionary Expense', amountNum, expenseCategory)
    speakKyro(`Logged $${amountNum.toFixed(2)} for ${expenseTitle || 'discretionary spend'}. Safe-to-Spend updated!`, 4500)
    toast.success(`Logged $${amountNum.toFixed(2)}. New daily allowance updated.`)
    setExpenseTitle('')
    setExpenseAmount('')
    setIsExpenseModalOpen(false)
  }

  if (!mounted) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="h-64 rounded-3xl bg-stone-900/40 border border-stone-800/60 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-44 rounded-2xl bg-stone-900/40 border border-stone-800/60 animate-pulse" />
          <div className="h-44 rounded-2xl bg-stone-900/40 border border-stone-800/60 animate-pulse" />
          <div className="h-44 rounded-2xl bg-stone-900/40 border border-stone-800/60 animate-pulse" />
        </div>
      </div>
    )
  }

  // Calculate Safe-to-Spend Ring Progress (scaled against a nominal $100 ceiling or available ratio)
  const spendRingPercent = Math.min(100, Math.max(8, Math.round((financeCalc.safeToSpendDaily / 120) * 100)))

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* ─── 1. AMBIENT EXECUTIVE SYNTHESIS & WORLD STAGE ─── */}
      <section className="relative overflow-hidden rounded-3xl border border-stone-800/80 bg-gradient-to-br from-stone-900/70 via-stone-950/90 to-stone-950 p-6 sm:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full blur-[130px] bg-amber-500/10 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Left: Executive Briefing & Command State */}
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900/90 border border-stone-800 text-amber-300 text-xs font-semibold">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>{dateHeading}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-mono font-bold">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>${financeCalc.safeToSpendDaily.toFixed(2)}/day safe</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/25 text-sky-300 text-xs font-mono font-bold">
                <Droplets className="w-3.5 h-3.5 text-sky-400" />
                <span>{hydrationCalc.completionPercentage}% Hydrated</span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold tracking-tight text-foreground">
              {greeting}
            </h1>

            {/* Single-Sentence Contextual Executive Synthesis (from Blueprint) */}
            <p className="text-sm sm:text-base text-stone-300 max-w-xl leading-relaxed font-normal">
              {financeCalc.isAtRisk ? (
                <span className="text-amber-200">
                  ⚠️ Pacing Warning: Projected low balance touches your ${financeStore.accountFloor} floor in {financeStore.payPeriodDaysRemaining} days. Smooth out non-essential expenses today.
                </span>
              ) : (
                <span>
                  All committed bills (${financeCalc.totalCommittedUnpaid.toFixed(0)} unpaid) remain fully funded; you have <strong className="text-emerald-400 font-mono font-bold">${financeCalc.safeToSpendDaily.toFixed(2)}</strong> safe to spend today and <strong className="text-sky-400 font-mono font-bold">{hydrationCalc.remainingMl}ml</strong> of hydration needed to peak.
                </span>
              )}
            </p>

            {/* Quick Command Bar */}
            <div className="flex flex-wrap gap-2 sm:gap-2.5 justify-center md:justify-start pt-1">
              {!isFocusRunning ? (
                <button
                  onClick={() => startFocusTimer()}
                  className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center gap-1.5 sm:gap-2 shadow-[0_0_20px_rgba(212,168,83,0.3)] transition-all cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-stone-950" />
                  <span>Launch 25m Focus</span>
                </button>
              ) : (
                <Link
                  href="/focus"
                  className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 sm:gap-2 transition-all"
                >
                  <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 animate-pulse" />
                  <span>View Active Chamber</span>
                </Link>
              )}

              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Log Discretionary Spend</span>
              </button>

              <button
                onClick={() => {
                  hydrationStore.logDrink(250, 'water')
                  toast.success('Logged +250ml pure water.')
                  speakKyro('Replenished 250ml pure water! Circadian curve rising.', 3500)
                }}
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/35 text-sky-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(56,189,248,0.2)]"
              >
                <Droplets className="w-3.5 h-3.5 text-sky-400" />
                <span>+250ml Water</span>
              </button>

              <button
                onClick={toggleKyro}
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-800 text-amber-300 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                <span>Ask {agentName}</span>
              </button>
            </div>
          </div>

          {/* Right: Integrated Environmental Companion on Dais */}
          <div className="relative flex flex-col items-center shrink-0">
            <Companion
              size={150}
              showGlow={true}
              showPlatform={true}
              speechTextOverride={companionMessage}
              onClick={toggleKyro}
            />
            <div className="text-center mt-2 mb-3">
              <span className="text-xs font-bold text-stone-300">{agentName}</span>
              <span className="block text-[10px] text-amber-400/70 font-medium">Click to Converse</span>
            </div>

            <CompanionSelector variant="compact" />
          </div>
        </div>
      </section>

      {/* ─── 2. TRIPARTITE BENTO GRID: FINANCE PACING, HYDRATION, & OUT-OF-APP NOTIFICATIONS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TILE 1: SAFE-TO-SPEND PACING RING (EMERALD) */}
        <div className="world-deck p-6 flex flex-col justify-between space-y-5 border-emerald-500/25 bg-gradient-to-b from-stone-950 via-stone-900/40 to-stone-950 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-44 h-44 rounded-full blur-[70px] bg-emerald-500/10 pointer-events-none" />

          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-800/80">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-200 font-mono">
                    Safe-to-Spend Pacing
                  </h3>
                  <span className="text-[10px] text-stone-400">Deterministic cash-flow horizon</span>
                </div>
              </div>

              {financeCalc.isAtRisk ? (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 font-mono text-[10px] font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  <span>AT RISK</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>SAFE</span>
                </span>
              )}
            </div>

            {/* Radial SVG Pacing Ring */}
            <div className="my-5 flex items-center justify-center">
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-stone-800/60"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-emerald-400 transition-all duration-700 ease-out"
                    strokeWidth="8"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * spendRingPercent) / 100}
                    strokeLinecap="round"
                    fill="none"
                    style={{ filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.4))' }}
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-stone-400">Today&apos;s Pacing</span>
                  <span className="text-3xl font-serif font-bold text-foreground">
                    ${financeCalc.safeToSpendDaily.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-emerald-400/90 font-mono font-semibold">
                    per day safe
                  </span>
                </div>
              </div>
            </div>

            {/* Ledger Breakdown Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-stone-900/60 border border-stone-800/80">
                <span className="text-[10px] text-stone-400 block">Liquid Checking</span>
                <span className="text-sm font-bold text-stone-100">${financeStore.liquidChecking.toLocaleString()}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-900/60 border border-stone-800/80">
                <span className="text-[10px] text-stone-400 block">Unpaid Bills</span>
                <span className="text-sm font-bold text-amber-300">-${financeCalc.totalCommittedUnpaid.toLocaleString()}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-900/60 border border-stone-800/80">
                <span className="text-[10px] text-stone-400 block">Comfort Floor</span>
                <span className="text-sm font-bold text-stone-200">${financeStore.accountFloor}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-900/60 border border-stone-800/80">
                <span className="text-[10px] text-stone-400 block">Cycle Days Left</span>
                <span className="text-sm font-bold text-stone-200">{financeStore.payPeriodDaysRemaining} days</span>
              </div>
            </div>
          </div>

          {/* Quick Action Footer */}
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="flex-1 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Expense</span>
            </button>
            <button
              onClick={() => setIsMultiRailOpen(true)}
              className="py-2 px-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-emerald-500/35 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Multi-Rail Ingestion: Scan Receipt OCR or Import Bank Statement"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Receipt / CSV</span>
            </button>
            <button
              onClick={() => {
                financeStore.logExpense('Espresso Fuel', 4.5, 'Coffee')
                toast.success('Quick logged: $4.50 Coffee')
                speakKyro('Logged $4.50 coffee. Recalculating cash-flow pacing in real time.', 3500)
              }}
              className="px-2.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 font-bold text-xs transition-colors cursor-pointer"
              title="Quick Log $4.50 Coffee"
            >
              +$4.50
            </button>
          </div>
        </div>

        {/* TILE 2: DYNAMIC CIRCADIAN HYDRATION VESSEL (SKY BLUE) */}
        <div className="world-deck p-6 flex flex-col justify-between space-y-5 border-sky-500/25 bg-gradient-to-b from-stone-950 via-stone-900/40 to-stone-950 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-44 h-44 rounded-full blur-[70px] bg-sky-500/10 pointer-events-none" />

          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-800/80">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Droplets className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-200 font-mono">
                    Circadian Hydration
                  </h3>
                  <span className="text-[10px] text-stone-400">Continuous physiological model</span>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 font-mono text-[10px] font-bold">
                {hydrationCalc.completionPercentage}% GOAL
              </span>
            </div>

            {/* Vessel Cylinder & Liquid Meter */}
            <div className="my-5 flex items-center justify-center gap-6">
              <div className="relative w-24 h-36 rounded-2xl border-2 border-sky-500/40 bg-stone-950/80 overflow-hidden shadow-[inset_0_0_20px_rgba(56,189,248,0.2)]">
                {/* Dynamic Liquid Wave Fill */}
                <div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-sky-600 via-sky-500 to-sky-400 transition-all duration-700 ease-out flex items-center justify-center"
                  style={{ height: `${Math.max(8, hydrationCalc.completionPercentage)}%` }}
                >
                  <div className="w-full h-2 absolute top-0 bg-white/40 blur-[1px] animate-pulse" />
                </div>

                {/* Milestone tick at 50% */}
                <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-sky-300/40 flex justify-end pr-1">
                  <span className="text-[8px] font-mono text-sky-200/70">14:00 (50%)</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-widest text-stone-400 block">Consumed Today</span>
                <div className="text-3xl font-serif font-bold text-foreground">
                  {hydrationStore.consumedTodayMl}<span className="text-sm font-sans text-stone-400">ml</span>
                </div>
                <span className="text-xs text-sky-300 font-mono block">
                  of {hydrationCalc.targetHydrationMl}ml target
                </span>
                <span className="text-[11px] text-stone-400 block">
                  Remaining: <strong className="text-stone-200">{hydrationCalc.remainingMl}ml</strong>
                </span>
              </div>
            </div>

            {/* Physiological Dynamic Offsets Breakdown */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded-xl bg-stone-900/60 border border-stone-800/80 flex items-center gap-2">
                <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <div>
                  <span className="text-[9px] text-stone-400 block">Climate Thermal</span>
                  <span className="font-bold text-stone-200">+{hydrationCalc.weatherOffsetMl}ml ({hydrationStore.ambientTemperatureC}°C)</span>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-stone-900/60 border border-stone-800/80 flex items-center gap-2">
                <Coffee className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <div>
                  <span className="text-[9px] text-stone-400 block">Caffeine Offset</span>
                  <span className="font-bold text-stone-200">+{hydrationCalc.caffeineOffsetMl}ml ({hydrationStore.caffeineCups} cups)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Add Fluid Chips */}
          <div className="pt-2 flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => {
                hydrationStore.logDrink(250, 'water')
                toast.success('Logged +250ml water')
                speakKyro('250ml water added. Keep your hydration curve optimal!', 3500)
              }}
              className="flex-1 py-1.5 px-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <Plus className="w-3 h-3" /> 250ml
            </button>
            <button
              onClick={() => {
                hydrationStore.logDrink(500, 'water')
                toast.success('Logged +500ml water bottle')
                speakKyro('500ml bottle logged! Strong physiological momentum.', 3500)
              }}
              className="flex-1 py-1.5 px-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <Plus className="w-3 h-3" /> 500ml
            </button>
            <button
              onClick={() => {
                hydrationStore.logDrink(120, 'coffee')
                toast.success('Logged coffee (+120ml offset)')
              }}
              className="py-1.5 px-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Log Coffee (+120ml diuretic offset)"
            >
              <Coffee className="w-3 h-3 text-amber-400" />
            </button>
            <button
              onClick={() => {
                hydrationStore.resetDaily()
                toast.info('Hydration logs reset for new day.')
              }}
              className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
              title="Reset Day"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* TILE 3: SYSTEM NOTIFICATIONS OUTSIDE THE APP (AMAZON/FLIPKART STYLE) */}
        <div className="world-deck p-6 flex flex-col justify-between space-y-4 border-amber-500/25 bg-gradient-to-b from-stone-950 via-stone-900/40 to-stone-950 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-44 h-44 rounded-full blur-[70px] bg-amber-500/10 pointer-events-none" />

          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-800/80">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-200 font-mono">
                    Out-of-App System Alerts
                  </h3>
                  <span className="text-[10px] text-stone-400">Amazon &amp; Flipkart Notification Style</span>
                </div>
              </div>

              <span
                className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase ${
                  notifPermission === 'granted'
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                }`}
              >
                {notifPermission}
              </span>
            </div>

            <p className="text-xs text-stone-300 mt-3 leading-relaxed">
              Pushes live notifications directly to your device lock screen and system notification drawer (with acoustic chime and tactile vibration) even when the app is closed.
            </p>

            {/* Permission Action if not granted */}
            {notifPermission !== 'granted' && (
              <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
                <div className="text-[11px] text-amber-200">
                  Allow system permissions to receive out-of-app alerts on your phone lock screen.
                </div>
                <button
                  onClick={handleEnablePermissions}
                  className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs whitespace-nowrap cursor-pointer transition-all shadow-[0_0_12px_rgba(212,168,83,0.3)]"
                >
                  Enable OS Alerts
                </button>
              </div>
            )}

            {/* Scheduled Circadian Anchors List */}
            <div className="mt-4 space-y-2 text-xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block">
                Scheduled Circadian Push Milestones:
              </span>

              <div className="p-2.5 rounded-xl bg-stone-900/60 border border-stone-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-semibold text-stone-200">08:00 AM Morning Briefing</span>
                </div>
                <button
                  onClick={() => handleTestNotification('morning')}
                  disabled={isTestingNotif}
                  className="text-[10px] font-mono text-amber-400 hover:text-amber-300 underline cursor-pointer"
                >
                  Test Now
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-stone-900/60 border border-stone-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CloudSun className="w-3.5 h-3.5 text-sky-400" />
                  <span className="font-semibold text-stone-200">14:00 PM Midday Hydration</span>
                </div>
                <button
                  onClick={() => handleTestNotification('midday')}
                  disabled={isTestingNotif}
                  className="text-[10px] font-mono text-sky-400 hover:text-sky-300 underline cursor-pointer"
                >
                  Test Now
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-stone-900/60 border border-stone-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon className="w-3.5 h-3.5 text-purple-400" />
                  <span className="font-semibold text-stone-200">21:00 PM Evening Rebalance</span>
                </div>
                <button
                  onClick={() => handleTestNotification('evening')}
                  disabled={isTestingNotif}
                  className="text-[10px] font-mono text-purple-400 hover:text-purple-300 underline cursor-pointer"
                >
                  Test Now
                </button>
              </div>
            </div>
          </div>

          {/* Test Signal Button */}
          <div className="pt-2">
            <button
              onClick={() => handleTestNotification('custom')}
              disabled={isTestingNotif}
              className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(212,168,83,0.25)]"
            >
              <Bell className="w-3.5 h-3.5 fill-current" />
              <span>{isTestingNotif ? 'Dispatching...' : 'Fire Instant Lock-Screen Alert'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── 3. VITAL SIGNALS MATRIX (STAT PODS) ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/tasks" className="world-deck p-4 hover:border-amber-400/40 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-400">Active Tasks</span>
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-serif text-foreground mt-2">
            {stats.activeTasks.length}
          </div>
          <span className="text-[11px] text-blue-300/80 font-medium mt-1 block">
            {stats.completedToday.length} finished today
          </span>
        </Link>

        <Link href="/habits" className="world-deck p-4 hover:border-amber-400/40 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-400">Habits Locked</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-serif text-foreground mt-2">
            {stats.habitsDoneToday}/{habits.length}
          </div>
          <span className="text-[11px] text-amber-300/80 font-medium mt-1 block">
            {stats.maxStreak > 0 ? `${stats.maxStreak}-day streak active` : 'Build momentum'}
          </span>
        </Link>

        <Link href="/goals" className="world-deck p-4 hover:border-amber-400/40 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-400">Active Goals</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-serif text-foreground mt-2">
            {stats.activeGoals.length}
          </div>
          <span className="text-[11px] text-emerald-300/80 font-medium mt-1 block">
            milestones in flight
          </span>
        </Link>

        <Link href="/notifications" className="world-deck p-4 hover:border-amber-400/40 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-400">OS Transmissions</span>
            <Bell className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-serif text-foreground mt-2">
            3 Daily
          </div>
          <span className="text-[11px] text-amber-300/80 font-medium mt-1 block">
            08:00 • 14:00 • 21:00
          </span>
        </Link>
      </div>

      {/* ─── 4. TODAY'S PROTOCOL: TASKS & HABITS INTEGRATION ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Priority Task Deck */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Today&apos;s High-Leverage Tasks
              </h3>
            </div>
            <Link href="/tasks" className="text-xs font-semibold text-amber-400 hover:underline flex items-center gap-1">
              Task Matrix <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {stats.activeTasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="world-deck p-3.5 flex items-center justify-between gap-3 group hover:border-amber-400/30 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => handleTaskToggle(task.id, task.status)}
                    className="w-6 h-6 rounded-lg border border-stone-700 hover:border-amber-400 flex items-center justify-center shrink-0 cursor-pointer text-stone-500 hover:text-amber-400 transition-colors"
                  >
                    <Circle className="w-3.5 h-3.5" />
                  </button>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate group-hover:text-amber-200 transition-colors">
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-stone-400 truncate">{task.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      task.priority === 'urgent'
                        ? 'bg-rose-500/15 text-rose-300'
                        : task.priority === 'high'
                        ? 'bg-amber-500/15 text-amber-300'
                        : 'bg-blue-500/15 text-blue-300'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              </div>
            ))}

            {stats.activeTasks.length === 0 && (
              <div className="p-8 text-center world-deck border-dashed border-stone-800">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-60" />
                <h4 className="text-sm font-bold text-foreground">Clean Deck</h4>
                <p className="text-xs text-stone-400 mt-1">All prioritized tasks for today are complete.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Daily Habit Streak Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Daily Habit Streaks
              </h3>
            </div>
            <Link href="/habits" className="text-xs font-semibold text-amber-400 hover:underline flex items-center gap-1">
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {habits.slice(0, 4).map((habit) => {
              const isDone = completions.some(
                (c) => c.habitId === habit.id && c.completedDate === todayStr
              )

              return (
                <div
                  key={habit.id}
                  onClick={() => handleHabitToggle(habit.id)}
                  className={`world-deck p-3.5 flex items-center justify-between cursor-pointer transition-all ${
                    isDone
                      ? 'border-emerald-500/30 bg-emerald-950/15'
                      : 'hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        isDone
                          ? 'bg-emerald-400 border-emerald-400 text-stone-950'
                          : 'border-stone-700 text-transparent'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 fill-current" />
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${isDone ? 'line-through text-stone-500' : 'text-foreground'}`}>
                        {habit.name}
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-stone-400 capitalize">
                          {habit.frequency}
                        </span>
                        {habit.hasTimeRange && habit.startTime && (
                          <span className="text-[10px] text-amber-300 font-semibold px-1.5 py-0.2 rounded bg-amber-400/10 border border-amber-400/20">
                            {habit.startTime}–{habit.endTime}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    <span>{habit.streak}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ─── PINNED TACTICAL NOTES & REMINDERS ─── */}
      <DashboardNotesSection />

      {/* ─── QUICK LOG EXPENSE MODAL ─── */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-stone-950 border border-emerald-500/35 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Receipt className="w-5 h-5" />
                <h3 className="text-base text-stone-100 font-serif">Log Discretionary Expense</h3>
              </div>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-400">
              Updates your Safe-to-Spend pacing in real-time. Deficits are automatically smoothed across your remaining {financeStore.payPeriodDaysRemaining} cycle days.
            </p>

            <form onSubmit={handleLogExpenseSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-stone-300 font-mono uppercase mb-1">
                  Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 14.50"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 focus:border-emerald-400 text-stone-100 font-mono text-sm outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-300 font-mono uppercase mb-1">
                  Merchant / Item Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Organic Market Lunch"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 focus:border-emerald-400 text-stone-100 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-300 font-mono uppercase mb-1">
                  Category
                </label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 focus:border-emerald-400 text-stone-100 text-xs outline-none"
                >
                  <option value="Food & Dining">Food &amp; Dining</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Health & Personal">Health &amp; Personal</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  Confirm &amp; Smooth Pacing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MULTI-RAIL FINANCIAL INGESTION (OCR / CSV / BANK WEBHOOK) ─── */}
      <MultiRailIngestionModal
        isOpen={isMultiRailOpen}
        onClose={() => setIsMultiRailOpen(false)}
      />
    </div>
  )
}

function DashboardNotesSection() {
  const notes = useNoteStore((s) => s.notes)
  const pinnedOrReminders = useMemo(
    () => notes.filter((n) => n.isPinned || (n.remindAt && !n.reminderFired)).slice(0, 3),
    [notes]
  )

  if (pinnedOrReminders.length === 0) return null

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Pinned Protocols &amp; Upcoming Reminders
          </h3>
        </div>
        <Link
          href="/notes"
          className="text-xs font-semibold text-amber-400 hover:underline flex items-center gap-1"
        >
          View Vault <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {pinnedOrReminders.map((note) => (
          <div
            key={note.id}
            className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800/80 hover:border-amber-400/40 transition-all flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-foreground truncate">{note.title}</span>
                {note.isPinned && <Pin className="w-3 h-3 text-amber-400 shrink-0" />}
              </div>
              {note.content && (
                <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">{note.content}</p>
              )}
            </div>

            {note.remindAt && (
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 self-start">
                <Clock className="w-3 h-3" />
                <span>{format(new Date(note.remindAt), 'MMM d, h:mm a')}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
