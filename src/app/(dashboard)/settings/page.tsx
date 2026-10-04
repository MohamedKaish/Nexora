'use client'

import React, { useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { useTaskStore } from '@/store/useTaskStore'
import { useHabitStore } from '@/store/useHabitStore'
import { useGoalStore } from '@/store/useGoalStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useFocusStore } from '@/store/useFocusStore'
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

  // Handle Profile Save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) setDisplayName(name.trim())
    if (agent.trim()) setAgentName(agent.trim())
    setIsSaved(true)
    toast.success('Sanctuary preferences updated.')
    setTimeout(() => setIsSaved(false), 2000)
  }

  // Reset database with warning
  const handleResetData = () => {
    if (window.confirm('Are you sure you want to reset all local tasks, habits, and focus logs? This action cannot be undone.')) {
      localStorage.clear()
      window.location.reload()
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

        {/* Web App Installation (PWA) */}
        <div className="world-surface p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-stone-800">
            <Smartphone className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-foreground">Web App Installation (PC & Mobile)</h3>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-stone-900/60 border border-stone-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-foreground">
                  Standalone Desktop & Mobile App
                </h4>
                {isInstalled ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Installed
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold">
                    PWA Ready
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400">
                Install Nexora directly to your PC, Mac, Android, or iOS device for offline caching, windowed desktop mode, and zero browser toolbar distraction.
              </p>
            </div>

            <div className="shrink-0">
              {isInstalled ? (
                <span className="text-xs text-emerald-300 font-semibold flex items-center gap-1">
                  <Check className="w-4 h-4" /> Active in Standalone Mode
                </span>
              ) : (
                <button
                  onClick={openInstallGuide}
                  className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(212,168,83,0.3)] transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Install Web App</span>
                </button>
              )}
            </div>
          </div>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleExportData}
              className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 hover:border-amber-400/40 text-left transition-all cursor-pointer flex items-center gap-3"
            >
              <div className="p-2.5 rounded-lg bg-amber-400/10 text-amber-400">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Export Backup</h4>
                <p className="text-[11px] text-stone-400">Download complete workspace as JSON.</p>
              </div>
            </button>

            <button
              onClick={handleResetData}
              className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 hover:border-rose-400/40 text-left transition-all cursor-pointer flex items-center gap-3"
            >
              <div className="p-2.5 rounded-lg bg-rose-400/10 text-rose-400">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-rose-300">Reset Local Storage</h4>
                <p className="text-[11px] text-stone-400">Clear cache and restart with defaults.</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
