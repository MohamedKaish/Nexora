'use client'

import React from 'react'
import Link from 'next/link'
import { NexoraLogo } from '@/components/brand/NexoraLogo'
import { ArrowLeft, Shield, FileText, CheckCircle2, Lock, Scale, AlertCircle } from 'lucide-react'

export default function TermsPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-medium">
            <Scale className="w-3.5 h-3.5" />
            <span>Legal &amp; Operational Standards</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-100">
            Terms of Service &amp; Application Usage
          </h1>
          <p className="text-sm text-stone-400">
            Effective Date: January 1, {currentYear} • Last Updated: October {currentYear}
          </p>
        </div>

        <div className="prose prose-invert prose-stone max-w-none space-y-8 text-sm text-stone-300 leading-relaxed">
          {/* Section 1 */}
          <section className="p-6 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
            <h2 className="text-lg font-bold text-amber-300 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing, installing, or operating the Nexora Living Productivity OS via the web, Chrome WebAPK, or standalone Android APK (<code className="text-amber-300 font-mono text-xs">com.nexora.app</code>), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may cease usage and uninstall the application at any time.
            </p>
          </section>

          {/* Section 2 */}
          <section className="p-6 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
            <h2 className="text-lg font-bold text-amber-300 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              2. User Data Ownership &amp; Privacy First
            </h2>
            <p>
              Nexora is built on a <strong>local-first architecture</strong>. Your tasks, habits, focus logs, goal horizons, and companion settings are stored directly on your device storage (LocalStorage and IndexedDB). You own 100% of your authored content. We do not sell, rent, or monetize your personal productivity logs.
            </p>
          </section>

          {/* Section 3 */}
          <section className="p-6 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
            <h2 className="text-lg font-bold text-amber-300 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              3. Device Hardware &amp; Android System Permissions
            </h2>
            <p>
              To provide habit reminders, task timing alerts, and offline productivity, the Android application requests the following system permissions under the principle of least privilege:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-stone-400">
              <li><strong className="text-stone-200">POST_NOTIFICATIONS:</strong> Allows Nexora to dispatch system tray notifications 15 minutes before scheduled tasks and when habit windows open.</li>
              <li><strong className="text-stone-200">VIBRATE:</strong> Used for haptic tactile feedback when timers complete and alerts trigger.</li>
              <li><strong className="text-stone-200">INTERNET &amp; ACCESS_NETWORK_STATE:</strong> Used to synchronize live cloud workspaces and verify online status.</li>
              <li><strong className="text-stone-200">WAKE_LOCK:</strong> Ensures timer intervals and audio ambient chimes during deep focus sessions remain uninterrupted.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="p-6 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
            <h2 className="text-lg font-bold text-amber-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              4. Account &amp; Complete Data Deletion Rights
            </h2>
            <p>
              In full compliance with Google Play Store Data Safety guidelines, users have the absolute right to purge and delete all data at any moment. You can execute this in <strong>Settings &gt; Delete Account &amp; Purge Data</strong>. This permanently purges your callsign, quest ledger, companion memories, service worker caches, and local storage from the device.
            </p>
          </section>

          {/* Section 5 */}
          <section className="p-6 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
            <h2 className="text-lg font-bold text-amber-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              5. Sideloading &amp; Distribution Integrity
            </h2>
            <p>
              Official copies of the standalone Android APK are distributed exclusively through the verified Nexora download hub. Each release is signed with our production keystore verified by Android <code className="text-amber-300 font-mono text-xs">apksigner</code> (v1, v2, and v3 schemes). You should never install unofficial copies from unknown mirrors.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 border-t border-stone-900 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-3">
        <p>© {currentYear} Nexora Sanctuary OS. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-amber-400 transition-colors">Privacy Policy</Link>
          <Link href="/download" className="hover:text-amber-400 transition-colors">Download App</Link>
          <Link href="/dashboard" className="hover:text-amber-400 transition-colors">Sanctuary</Link>
        </div>
      </footer>
    </div>
  )
}
