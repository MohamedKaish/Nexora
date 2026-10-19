'use client'

import React, { useState, useRef } from 'react'
import { useAppStore } from '@/store/appStore'
import { useTaskStore } from '@/store/useTaskStore'
import { useHabitStore } from '@/store/useHabitStore'
import { useGoalStore } from '@/store/useGoalStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useFocusStore } from '@/store/useFocusStore'
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
} from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { preferences, agentConfig, setDisplayName, setAgentName, setTheme } = useAppStore()
  const { isInstallable, isInstalled, installApp, openInstallGuide, isIos } = usePwa()

  const [name, setName] = useState(preferences.displayName || '')
  const [agent, setAgent] = useState(agentConfig.name || 'Kyro')
  const [isSaved, setIsSaved] = useState(false)

  // Export full sanctuary data as JSON
  const handleExportData = () => {
    const backup = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      tasks: useTaskStore.getState().tasks,
      habits: useHabitStore.getState().habits,
      habitCompletions: useHabitStore.getState().completions,
      goals: useGoalStore.getState().goals,
      projects: useProjectStore.getState().projects,
      focusSessions: useFocusStore.getState().sessions,
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
        if (Array.isArray(parsed.habits)) useHabitStore.setState({ habits: parsed.habits })
        if (Array.isArray(parsed.habitCompletions)) useHabitStore.setState({ completions: parsed.habitCompletions })
        if (Array.isArray(parsed.goals)) useGoalStore.setState({ goals: parsed.goals })
        if (Array.isArray(parsed.projects)) useProjectStore.setState({ projects: parsed.projects })
        if (Array.isArray(parsed.focusSessions)) useFocusStore.setState({ sessions: parsed.focusSessions })

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
                    You are currently running the official installed Nexora habitat (v1.0.0). Automatic cloud updates and offline caching are active.
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
      </div>
    </div>
  )
}

function KyroBrainSettingsCard() {
  const { settings, setAnchor, toggleVoice, toggleMinimized, speak } = useKyroStore()
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nexora_gemini_api_key') || ''
    }
    return ''
  })
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  const isGeminiActive = Boolean(apiKey.trim().length > 20)

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault()
    if (typeof window !== 'undefined') {
      if (apiKey.trim()) {
        localStorage.setItem('nexora_gemini_api_key', apiKey.trim())
        toast.success('Gemini API key saved! Kyro is now operating with Gemini 2.5 Flash.')
        speak('Neural uplink established with Gemini 2.5 Flash. High-bandwidth intelligence online, Boss!', 5000)
      } else {
        localStorage.removeItem('nexora_gemini_api_key')
        toast.info('API key removed. Kyro switched to 0ms Local Context Engine.')
        speak('Operating in 0ms Local Context Engine mode. All sanctuary systems secure offline.', 4000)
      }
    }
  }

  const handleTestPing = async () => {
    setIsTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/kyro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Telemetry ping test.',
          userApiKey: apiKey.trim() || undefined,
          context: { userName: 'Explorer', agentName: 'Kyro' },
        }),
      })
      const data = await res.json()
      setTestResult(`${data.provider}: "${data.speechBubble || data.reply}"`)
      speak(data.speechBubble || 'Uplink test successful!', 4000)
    } catch {
      setTestResult('Ping failed. Operating in offline local engine.')
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="world-deck p-6 space-y-5 border border-amber-500/30">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-800">
        <div className="flex items-center gap-2.5">
          <Bot className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-bold text-foreground">Kyro 3D Companion &amp; AI Brain</h3>
            <p className="text-xs text-stone-400">Powered by Gemini 2.5 Flash Free Tier with 0ms Local Engine fallback.</p>
          </div>
        </div>

        <div>
          {isGeminiActive ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Gemini 2.5 Flash Active</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold font-mono">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>0ms Local Engine (Offline Ready)</span>
            </span>
          )}
        </div>
      </div>

      {/* API Key Form */}
      <form onSubmit={handleSaveKey} className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-stone-300">
              Google AI Studio API Key (Optional Free Key for Android APK)
            </label>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-amber-400 hover:text-amber-300 underline font-medium"
            >
              Get Free Gemini Key ↗
            </a>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste AIzaSy... or leave blank for 0ms local offline mode"
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 focus:border-amber-400 text-xs text-stone-100 placeholder:text-stone-500 outline-none font-mono"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs transition-colors cursor-pointer shrink-0"
            >
              Save Key
            </button>
            <button
              type="button"
              onClick={handleTestPing}
              disabled={isTesting}
              className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-200 text-xs font-semibold transition-colors cursor-pointer shrink-0"
            >
              {isTesting ? 'Pinging...' : 'Test Ping'}
            </button>
          </div>
          {testResult && (
            <p className="mt-2 text-xs font-mono text-amber-300 bg-stone-900/80 p-2 rounded-lg border border-stone-800">
              {testResult}
            </p>
          )}
          <p className="text-[11px] text-stone-500 mt-1">
            Keys are stored strictly in local device memory (`localStorage`) and never transmitted to third-party trackers.
          </p>
        </div>
      </form>

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

