'use client'

import React from 'react'
import Link from 'next/link'
import { NexoraLogo } from '@/components/brand/NexoraLogo'
import { ArrowLeft, ShieldCheck, Database, KeyRound, EyeOff, Trash2 } from 'lucide-react'

export default function PrivacyPage() {
  const currentYear = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-stone-950 text-foreground selection:bg-amber-400 selection:text-stone-950 flex flex-col">
      {/* Top Header */}
      <header className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between border-b border-stone-800/80">
        <Link href="/dashboard" className="flex items-center gap-3">
          <NexoraLogo size={34} />
          <span className="text-base font-bold font-serif text-stone-100 hover:text-amber-400 transition-colors">
            Nexora
          </span>
        </Link>
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-stone-900 border border-stone-800 hover:border-amber-400/50 text-stone-300 hover:text-amber-300 text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Sanctuary</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-10 flex-1">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-300 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Google Play Data Safety &amp; Privacy Policy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-100">
            Privacy Policy &amp; Data Transparency
          </h1>
          <p className="text-sm text-stone-400">
            Applicable to Web, Chrome WebAPK, and Android Application (<code className="text-amber-300 font-mono text-xs">com.nexora.app</code>)
          </p>
        </div>

        <div className="prose prose-invert prose-stone max-w-none space-y-8 text-sm text-stone-300 leading-relaxed">
          {/* Section 1 */}
          <section className="p-6 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
            <h2 className="text-lg font-bold text-amber-300 flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-emerald-400" />
              1. Zero Third-Party Advertising &amp; Tracking
            </h2>
            <p>
              Nexora contains <strong>no third-party advertising SDKs</strong>, no analytics trackers, no fingerprinting libraries, and no commercial data brokers. Your productivity habitat is completely private to you.
            </p>
          </section>

          {/* Section 2 */}
          <section className="p-6 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
            <h2 className="text-lg font-bold text-amber-300 flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-400" />
              2. Data Collected &amp; Storage Mechanics
            </h2>
            <div className="space-y-2 text-xs text-stone-400">
              <p>
                <strong>Personal Info:</strong> Optional explorer callsign and chosen avatar archetype stored locally on your device.
              </p>
              <p>
                <strong>App Functionality Data:</strong> Tasks, habits, daily quest completions, Pomodoro focus logs, and horizon goals are saved in sandboxed local browser storage and IndexedDB.
              </p>
              <p>
                <strong>Optional Cloud Sync:</strong> If connected to Supabase backend, data transfers securely over encrypted TLS (HTTPS) solely for cross-device synchronization.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="p-6 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
            <h2 className="text-lg font-bold text-amber-300 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-400" />
              3. Android Permissions Transparency
            </h2>
            <div className="space-y-2 text-xs text-stone-400">
              <p>
                <strong>Notification Access (POST_NOTIFICATIONS):</strong> Used solely to alert you when your scheduled habit windows open and 15 minutes before task start times. Notifications are generated locally on your device.
              </p>
              <p>
                <strong>Vibration (VIBRATE):</strong> Provides brief physical haptic pulses on timer finish.
              </p>
              <p>
                <strong>Network Status:</strong> Used to show offline sanctuary status indicators when disconnected.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="p-6 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
            <h2 className="text-lg font-bold text-amber-300 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-400" />
              4. Immediate Data Purge &amp; Deletion Procedure
            </h2>
            <p>
              You maintain full sovereignty over your data. To permanently delete all accounts, quest logs, cached files, and credentials:
            </p>
            <ol className="list-decimal pl-5 space-y-1 text-xs text-stone-400">
              <li>Open the Nexora menu and navigate to <strong>Settings</strong>.</li>
              <li>Scroll down to the <strong>Data Management</strong> section.</li>
              <li>Tap <strong>Delete Account &amp; Purge Data</strong>.</li>
              <li>Confirm the prompt. All IndexedDB stores, localStorage entries, and Service Worker caches will be instantly erased.</li>
            </ol>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 border-t border-stone-900 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-3">
        <p>© {currentYear} Nexora Sanctuary OS. Privacy First.</p>
        <div className="flex items-center gap-4">
          <Link href="/terms" className="hover:text-amber-400 transition-colors">Terms of Service</Link>
          <Link href="/download" className="hover:text-amber-400 transition-colors">Download App</Link>
          <Link href="/dashboard" className="hover:text-amber-400 transition-colors">Sanctuary</Link>
        </div>
      </footer>
    </div>
  )
}
