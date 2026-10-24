'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAppStore } from '@/store/appStore'
import { useTaskStore } from '@/store/useTaskStore'
import { useHabitStore } from '@/store/useHabitStore'
import { useGoalStore } from '@/store/useGoalStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useFocusStore } from '@/store/useFocusStore'
import { useFinanceStore } from '@/store/useFinanceStore'
import { useHydrationStore } from '@/store/useHydrationStore'
import { useNoteStore } from '@/store/useNoteStore'
import { useTimelineStore } from '@/store/timelineStore'
import { useKyroStore } from '@/store/kyroStore'
import { usePwa } from '@/components/pwa/PwaProvider'
import {
  Settings,
  User,
  Bot,
  Database,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  Volume2,
  Moon,
  Sun,
  Shield,
  Check,
  Smartphone,
  Laptop,
  CheckCircle2,
  Bell,
  Cloud,
  Lock,
  LogOut,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  requestPhoneNotificationPermission,
} from '@/utils/notificationBridge'
import {
  signInWithGoogle,
  signOutFromSupabase,
  getSupabaseSession,
  isSupabaseConfigured,
  getSupabaseProjectRef,
  onSupabaseAuthStateChange,
} from '@/lib/supabase'
import { pullUserDataFromSupabase } from '@/lib/supabaseSync'

export default function SettingsPage() {
  const router = useRouter()
  const { preferences, agentConfig, setDisplayName, setAgentName, setTheme, recalibrate } = useAppStore()
  const { isInstallable, isInstalled, installApp, openInstallGuide, isIos } = usePwa()

  const [mounted, setMounted] = useState(false)
  const [name, setName] = useState(preferences.displayName || '')
  const [agent, setAgent] = useState(agentConfig.name || 'Kyro')
  const [isSaved, setIsSaved] = useState(false)

  React.useEffect(() => {
    setMounted(true)
    if (preferences.displayName) setName(preferences.displayName)
    if (agentConfig.name) setAgent(agentConfig.name)
  }, [preferences.displayName, agentConfig.name])

  // Export full sanctuary data as JSON
  const handleExportData = () => {
    const financeState = useFinanceStore.getState()
    const hydrationState = useHydrationStore.getState()
    const backup = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      tasks: useTaskStore.getState().tasks,
      subtasks: useTaskStore.getState().subtasks,
      habits: useHabitStore.getState().habits,
      habitCompletions: useHabitStore.getState().completions,
      goals: useGoalStore.getState().goals,
      projects: useProjectStore.getState().projects,
      focusSessions: useFocusStore.getState().sessions,
      wallets: financeState.wallets,
      transactions: financeState.transactions,
      defaultCurrency: financeState.defaultCurrency,
      defaultWalletId: financeState.defaultWalletId,
      hydrationLogs: hydrationState.logs,
      dailyGoalMl: hydrationState.dailyGoalMl,
      hydrationReminderConfig: hydrationState.reminderConfig,
      notes: useNoteStore.getState().notes,
      timetableSlots: useTimelineStore.getState().slots,
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `nexora_sanctuary_backup_${new Date().toISOString().split('T')[0]}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    toast.success('Sanctuary backup exported successfully.')
  }

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Import and restore sanctuary data from JSON
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const parsed = JSON.parse(content)

        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Invalid JSON structure')
        }

        if (Array.isArray(parsed.tasks)) useTaskStore.setState({ tasks: parsed.tasks })
        if (Array.isArray(parsed.subtasks)) useTaskStore.setState({ subtasks: parsed.subtasks })
        if (Array.isArray(parsed.habits)) useHabitStore.setState({ habits: parsed.habits })
        if (Array.isArray(parsed.habitCompletions)) useHabitStore.setState({ completions: parsed.habitCompletions })
        if (Array.isArray(parsed.goals)) useGoalStore.setState({ goals: parsed.goals })
        if (Array.isArray(parsed.projects)) useProjectStore.setState({ projects: parsed.projects })
        if (Array.isArray(parsed.focusSessions)) useFocusStore.setState({ sessions: parsed.focusSessions })
        if (Array.isArray(parsed.wallets)) useFinanceStore.setState({ wallets: parsed.wallets })
        if (Array.isArray(parsed.transactions)) useFinanceStore.setState({ transactions: parsed.transactions })
        if (typeof parsed.defaultCurrency === 'string') {
          useFinanceStore.setState({ defaultCurrency: parsed.defaultCurrency })
        }
        if (Array.isArray(parsed.hydrationLogs)) {
          useHydrationStore.setState({ logs: parsed.hydrationLogs })
        }
        if (typeof parsed.dailyGoalMl === 'number' && parsed.dailyGoalMl > 0) {
          useHydrationStore.getState().setDailyGoalMl(parsed.dailyGoalMl)
        }
        if (Array.isArray(parsed.notes)) useNoteStore.setState({ notes: parsed.notes })
        if (Array.isArray(parsed.timetableSlots)) useTimelineStore.setState({ slots: parsed.timetableSlots })

        toast.success('Sanctuary ledger successfully restored from backup!')
      } catch (err) {
        toast.error('Failed to parse backup file. Please select a valid Nexora JSON ledger.')
      } finally {
        if (e.target) e.target.value = ''
      }
    }
    reader.readAsText(file)
  }

  // Handle Profile Save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) setDisplayName(name.trim())
    if (agent.trim()) setAgentName(agent.trim())
    setIsSaved(true)
    toast.success('Sanctuary preferences updated.')
    setTimeout(() => setIsSaved(false), 2000)
  }

  // Delete account and purge data (Google Play Policy Compliant)
  const handleDeleteAccountAndData = async () => {
    if (window.confirm('Delete Account & Purge Data?\n\nThis will permanently delete your callsign, quest ledger, companion memories, and local offline cache. This cannot be undone.')) {
      try {
        localStorage.clear()
        sessionStorage.clear()
        if ('caches' in window) {
          const keys = await caches.keys()
          await Promise.all(keys.map((k) => caches.delete(k)))
        }
        toast.success('Account and data purged. Reinitializing sanctuary...')
        window.location.href = '/setup'
      } catch {
        localStorage.clear()
        window.location.href = '/setup'
      }
    }
  }

  if (!mounted) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl">
        <div className="h-20 rounded-2xl bg-stone-900/40 border border-stone-800/60 animate-pulse" />
        <div className="h-64 rounded-2xl bg-stone-900/40 border border-stone-800/60 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-gradient-gold">
          Sanctuary Settings
        </h1>
        <p className="text-sm text-stone-400 mt-1">
          Configure your identity, companion resonance, web app installation, and local data persistence.
        </p>
      </div>

      <div className="space-y-6">
        {/* ── GOOGLE AUTHENTICATION & CLOUD SYNC CARD ── */}
        <GoogleAuthSettingsCard />

        {/* Profile & Explorer Identity */}
        <div className="world-deck p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-stone-800">
            <User className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-foreground">Explorer & Companion Identities</h3>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Explorer Callsign / Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-sm text-foreground focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Companion Name
                </label>
                <input
                  type="text"
                  value={agent}
                  onChange={(e) => setAgent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-sm text-foreground focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isSaved ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                <span>Save Identities</span>
              </button>
            </div>
          </form>
        </div>

        {/* ── Kyro AI Brain & 3D Companion Matrix ── */}
        <KyroBrainSettingsCard />

        {/* Web App Installation (PWA) & Android APK */}
        <div className="world-surface p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-stone-800">
            <Smartphone className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-foreground">App Status & Installation</h3>
          </div>

          {isInstalled ? (
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-foreground">
                    Nexora Standalone Application Active
                  </h4>
                  <p className="text-xs text-stone-400">
                    You are currently running the official installed Nexora habitat (v2.0.0). Automatic cloud updates and offline caching are active.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono font-bold text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                Installed & Active
              </span>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-stone-900/60 border border-stone-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-foreground">
                      Standalone Desktop & Mobile App
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold">
                      PWA Ready
                    </span>
                  </div>
                  <p className="text-xs text-stone-400">
                    Install Nexora directly to your device for offline caching, windowed desktop mode, and zero browser toolbar distraction.
                  </p>
                </div>

                <div className="shrink-0">
                  <button
                    onClick={openInstallGuide}
                    className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(212,168,83,0.3)] transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install Web App</span>
                  </button>
                </div>
              </div>

              {/* Windows PC & Mac Desktop App Card */}
              <div className="p-4 rounded-xl bg-stone-900/60 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
                    <span>Windows PC Desktop App</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono font-bold">
                      Desktop Native
                    </span>
                  </h4>
                  <p className="text-xs text-stone-400">
                    1-click install Nexora directly onto your PC desktop and taskbar as a standalone app.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={openInstallGuide}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>1-Click Install to Desktop</span>
                  </button>
                </div>
              </div>

              {/* Android APK Direct Export Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-stone-900/40 to-transparent border border-amber-400/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
                    <span>Android Phone & Tablet App</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-300 font-mono font-bold">
                      Direct Install
                    </span>
                  </h4>
                  <p className="text-xs text-stone-400">
                    Installs directly to your Android home screen as a native 2.2 MB app.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href="/download"
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Open Download Hub</span>
                  </a>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Habitat Aesthetics & Environment */}
        <div className="world-surface p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-stone-800">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-foreground">Habitat Environment</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-900/60 border border-stone-800">
              <div>
                <h4 className="text-xs font-bold text-foreground">Theme Palette</h4>
                <p className="text-[11px] text-stone-400">Current visual atmosphere mode.</p>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setTheme('dark')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                    preferences.theme === 'dark'
                      ? 'bg-amber-400 text-stone-950 shadow'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  Dark Deep Space
                </button>
                <button
                  onClick={() => setTheme('light')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                    preferences.theme === 'light'
                      ? 'bg-amber-400 text-stone-950 shadow'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  Light Sanctuary
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-900/60 border border-stone-800">
              <div>
                <h4 className="text-xs font-bold text-foreground">Living Background Effects</h4>
                <p className="text-[11px] text-stone-400">
                  Subtle particle nebulae and organic breathing gradients.
                </p>
              </div>
              <span className="text-xs font-semibold text-emerald-400">Active</span>
            </div>
          </div>
        </div>

        {/* Data Persistence & Sanctuary Backup */}
        <div className="world-surface p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-stone-800">
            <Database className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-foreground">Data Ledger & Backup</h3>
          </div>

          {/* Hidden File Input for JSON Backup Import */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".json,application/json"
            className="hidden"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={handleExportData}
              className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 hover:border-amber-400/40 text-left transition-all cursor-pointer flex items-center gap-3"
            >
              <div className="p-2.5 rounded-lg bg-amber-400/10 text-amber-400 shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Export Backup</h4>
                <p className="text-[11px] text-stone-400">Download complete workspace as JSON.</p>
              </div>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 hover:border-amber-400/40 text-left transition-all cursor-pointer flex items-center gap-3"
            >
              <div className="p-2.5 rounded-lg bg-amber-400/10 text-amber-400 shrink-0">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Import Backup</h4>
                <p className="text-[11px] text-stone-400">Restore ledger from previous JSON.</p>
              </div>
            </button>

            <button
              onClick={() => {
                recalibrate()
                router.push('/login?tab=setup&recalibrate=true')
              }}
              className="p-4 rounded-xl bg-amber-400/10 border border-amber-400/30 hover:border-amber-400/60 text-left transition-all cursor-pointer flex items-center gap-3"
            >
              <div className="p-2.5 rounded-lg bg-amber-400/20 text-amber-300 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-300">Recalibrate Sanctuary Onboarding</h4>
                <p className="text-[11px] text-stone-400">Step through the 5-step calibration flow to tune goals and companion.</p>
              </div>
            </button>

            <button
              onClick={handleDeleteAccountAndData}
              className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/50 hover:border-rose-500/60 text-left transition-all cursor-pointer flex items-center gap-3"
            >
              <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400 shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-rose-300">Delete Account &amp; Purge Data</h4>
                <p className="text-[11px] text-stone-400">Permanently erase identity, quests, and cache (Play compliant).</p>
              </div>
            </button>
          </div>
        </div>

        {/* ── PHONE NOTIFICATIONS & SOUND ENGINE CARD ── */}
        <PhoneNotificationSettingsCard />
      </div>
    </div>
  )
}

function PhoneNotificationSettingsCard() {
  const isNative = typeof window !== 'undefined' && Boolean((window as any).NexoraNativeBridge)

  const handlePrompt = async () => {
    await requestPhoneNotificationPermission()
    toast.success('Permission requested from device!')
  }

  return (
    <div className="world-deck p-6 space-y-4 border border-amber-500/30">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Phone Reminders &amp; Alert Engine</h3>
            <p className="text-xs text-stone-400">
              {isNative ? '⚡ Standalone Android APK Native Bridge Active' : 'Web &amp; PWA Background Reminder Service Active'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrompt}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Enable Phone Alerts</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-stone-900/60 border border-stone-800 space-y-1">
          <span className="font-bold text-amber-300 flex items-center gap-1">
            <span>Tasks</span>
            <span className="text-[10px] text-stone-400 font-normal">• 15m Horizon</span>
          </span>
          <p className="text-[11px] text-stone-400">Rings &amp; vibrates 15m before task starts and when due.</p>
        </div>

        <div className="p-3 rounded-xl bg-stone-900/60 border border-stone-800 space-y-1">
          <span className="font-bold text-amber-300 flex items-center gap-1">
            <span>Habits</span>
            <span className="text-[10px] text-stone-400 font-normal">• Window Alert</span>
          </span>
          <p className="text-[11px] text-stone-400">Warns 30m before morning, afternoon, or custom windows close.</p>
        </div>

        <div className="p-3 rounded-xl bg-stone-900/60 border border-stone-800 space-y-1">
          <span className="font-bold text-amber-300 flex items-center gap-1">
            <span>Tactical Notes</span>
            <span className="text-[10px] text-stone-400 font-normal">• Exact Minute</span>
          </span>
          <p className="text-[11px] text-stone-400">Vocalizes Kyro speech and fires native alert on remindAt timestamp.</p>
        </div>
      </div>
    </div>
  )
}

function KyroBrainSettingsCard() {
  const { settings, setAnchor, toggleVoice } = useKyroStore()
  const [serverStatus, setServerStatus] = useState<{
    checked: boolean
    configured: boolean
    message: string
  }>({
    checked: false,
    configured: false,
    message: 'Checking server neural link configuration...',
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Purge any legacy client-stored API key
      localStorage.removeItem('nexora_gemini_api_key')
    }
    fetch('/api/kyro', { method: 'GET' })
      .then((res) => res.json())
      .then((data) => {
        setServerStatus({
          checked: true,
          configured: Boolean(data.configured),
          message:
            data.message ||
            (data.configured
              ? 'Server-side GEMINI_API_KEY is configured.'
              : 'GEMINI_API_KEY is not configured in the server environment.'),
        })
      })
      .catch(() => {
        setServerStatus({
          checked: true,
          configured: false,
          message: 'Unable to verify /api/kyro server status.',
        })
      })
  }, [])

  return (
    <div className="world-deck p-6 space-y-5 border border-amber-500/30">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-800">
        <div className="flex items-center gap-2.5">
          <Bot className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-bold text-foreground">Kyro 3D Companion &amp; AI Brain</h3>
            <p className="text-xs text-stone-400">
              Powered by server-managed Gemini 2.5 Flash with validated Nexora tool execution.
            </p>
          </div>
        </div>

        <div>
          {serverStatus.configured ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Gemini 2.5 Flash Ready</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>{serverStatus.checked ? 'Server Key Unconfigured' : 'Checking Status...'}</span>
            </span>
          )}
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800 text-xs text-stone-300 space-y-1">
        <p className="font-semibold text-stone-200">{serverStatus.message}</p>
        <p className="text-[11px] text-stone-400">
          For security, Gemini API credentials are read strictly from the server environment (<code className="text-amber-300 font-mono">GEMINI_API_KEY</code>) and are never stored in browser localStorage or sent in client requests.
        </p>
      </div>

      {/* Companion Controls & Anchoring */}
      <div className="pt-2 border-t border-stone-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-stone-900/60 border border-stone-800 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-foreground">Vocal Synthesis (TTS)</h4>
            <p className="text-[11px] text-stone-400">Let Kyro speak out loud like J.A.R.V.I.S.</p>
          </div>
          <button
            onClick={toggleVoice}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              settings.voiceEnabled
                ? 'bg-amber-400 text-stone-950'
                : 'bg-stone-800 text-stone-400 hover:text-stone-200'
            }`}
          >
            {settings.voiceEnabled ? 'Enabled' : 'Muted'}
          </button>
        </div>

        <div className="p-3 rounded-xl bg-stone-900/60 border border-stone-800 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-foreground">Screen Anchor</h4>
            <p className="text-[11px] text-stone-400">Position where Kyro docks by default.</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setAnchor('bottom-right')}
              className={`px-2 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                settings.anchor === 'bottom-right'
                  ? 'bg-amber-400 text-stone-950'
                  : 'bg-stone-800 text-stone-400'
              }`}
            >
              Bottom R
            </button>
            <button
              onClick={() => setAnchor('bottom-left')}
              className={`px-2 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                settings.anchor === 'bottom-left'
                  ? 'bg-amber-400 text-stone-950'
                  : 'bg-stone-800 text-stone-400'
              }`}
            >
              Bottom L
            </button>
            <button
              onClick={() => setAnchor('top-right')}
              className={`px-2 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                settings.anchor === 'top-right'
                  ? 'bg-amber-400 text-stone-950'
                  : 'bg-stone-800 text-stone-400'
              }`}
            >
              Top R
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function GoogleAuthSettingsCard() {
  const router = useRouter()
  const { preferences, login, logout } = useAppStore()
  const [supabaseUser, setSupabaseUser] = useState<any>(null)
  const [isConfigured, setIsConfigured] = useState(false)
  const [projectRef, setProjectRef] = useState('')
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)

  React.useEffect(() => {
    const configured = isSupabaseConfigured()
    setIsConfigured(configured)
    setProjectRef(getSupabaseProjectRef())

    // Check initial session
    getSupabaseSession().then(({ user }) => {
      if (user) {
        setSupabaseUser(user)
      }
    })

    // Listen to real-time auth changes
    const subscription = onSupabaseAuthStateChange((event, session) => {
      if (session?.user) {
        setSupabaseUser(session.user)
      } else if (event === 'SIGNED_OUT') {
        setSupabaseUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    try {
      const res = await signInWithGoogle()
      if (!res.success) {
        toast.error(res.error || 'Failed to initialize Google Authentication')
        setIsGoogleLoading(false)
      }
      // Browser navigates to Google OAuth consent if redirect URL was returned
    } catch (err: any) {
      toast.error(err?.message || 'Google Sign-in failed')
      setIsGoogleLoading(false)
    }
  }

  const handleSignOut = async () => {
    setIsGoogleLoading(true)
    try {
      await signOutFromSupabase()
      setSupabaseUser(null)
      toast.success('Signed out from Google Account.')
    } catch {
      toast.error('Sign out failed')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleManualSync = async () => {
    if (!supabaseUser?.id) return
    setIsSyncing(true)
    try {
      await pullUserDataFromSupabase(supabaseUser.id)
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      toast.success('Sanctuary data successfully synchronized with Cloud Vault!')
    } catch {
      toast.error('Sync failed. Please check your network connection.')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="world-deck p-6 space-y-5 border border-amber-500/40 relative overflow-hidden shadow-[0_4px_24px_rgba(212,168,83,0.08)]">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 blur-[90px] pointer-events-none rounded-full" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-800 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/25 text-amber-400 shadow-sm">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">
                Google Authentication &amp; Cloud Sync
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold">
                Supabase OAuth
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Synchronize your tasks, habits, hydration records, and finances seamlessly across devices.
            </p>
          </div>
        </div>

        <div>
          {supabaseUser ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Cloud Connected</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900 border border-stone-700 text-stone-400 text-xs font-semibold font-mono">
              <span className="w-2 h-2 rounded-full bg-stone-500" />
              <span>Local Offline Vault</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-4 relative z-10">
        {supabaseUser ? (
          /* User is Signed In */
          <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border border-amber-300/40 flex items-center justify-center text-stone-950 font-bold text-sm shadow">
                  {(supabaseUser.user_metadata?.full_name || supabaseUser.email || 'G').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-stone-100">
                      {supabaseUser.user_metadata?.full_name || preferences.displayName || 'Google Explorer'}
                    </h4>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 font-mono">{supabaseUser.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isGoogleLoading}
                  className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-rose-950/40 hover:border-rose-800/60 border border-stone-700 text-stone-300 hover:text-rose-300 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              </div>
            </div>

            {lastSyncTime && (
              <p className="text-[11px] text-stone-500 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Last bidirectional sync completed at {lastSyncTime}</span>
              </p>
            )}
          </div>
        ) : (
          /* User is NOT Signed In */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-stone-900/90 to-stone-900/50 border border-stone-800 space-y-3">
              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-bold text-stone-100 flex items-center gap-2">
                  <span>Sign in with Google Account</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold">
                    Recommended
                  </span>
                </h4>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Connect your Google identity to back up your quests, habit streaks, water logs, and multi-currency wallets to the encrypted Supabase cloud vault.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                {/* Official Google Sign-In Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  className="flex-1 py-3 px-4 rounded-xl bg-stone-100 hover:bg-white text-stone-900 font-bold text-xs flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-60"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isGoogleLoading ? 'Connecting to Google OAuth...' : 'Sign in with Google'}</span>
                </button>

                {/* Direct Link to Login Gateway Route */}
                <Link
                  href="/login?tab=returning"
                  className="py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Open Login Page (/login)</span>
                  <ExternalLink className="w-3 h-3 text-stone-400" />
                </Link>
              </div>
            </div>

            {/* Cloud Status Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-[11px] text-stone-400 font-mono">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Supabase Cloud Gateway: {projectRef ? `Active (${projectRef})` : 'Standby'}</span>
              </span>
              <span>Need account setup? Visit <Link href="/login" className="text-amber-400 hover:underline">/login</Link></span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


