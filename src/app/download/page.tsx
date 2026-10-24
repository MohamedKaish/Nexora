'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { NexoraLogo } from '@/components/brand/NexoraLogo'
import { usePwa } from '@/components/pwa/PwaProvider'
import {
  Download,
  Smartphone,
  Monitor,
  Apple,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
  Info,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'

export default function DownloadPage() {
  const [mounted, setMounted] = useState(false)
  const { isInstallable, isInstalled, installApp, markAsInstalled, isIos } = usePwa()
  const [copiedSha, setCopiedSha] = useState(false)
  const [activePlatform, setActivePlatform] = useState<'android' | 'desktop' | 'ios'>('android')
  const [showReinstall, setShowReinstall] = useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const sha256Fingerprint = 'AA:41:09:2C:90:BC:E4:27:DB:15:E2:08:B1:C7:28:EF:83:2B:32:1B:C3:03:6D:CB:1B:4F:96:89:6A:AF:BA:60'
  const apkDownloadUrl = '/download/Nexora.apk'
  const liveAppUrl = 'https://nexora-nine-kappa.vercel.app'

  const handleCopySha = () => {
    navigator.clipboard.writeText(sha256Fingerprint)
    setCopiedSha(true)
    toast.success('SHA-256 fingerprint copied to clipboard')
    setTimeout(() => setCopiedSha(false), 2000)
  }

  const handleTriggerInstall = async () => {
    const success = await installApp()
    if (success) {
      markAsInstalled()
      toast.success('Nexora is installing to your device!')
    }
  }

  const handleApkDownloadClick = () => {
    markAsInstalled()
    toast.info('Starting Nexora.apk download...', {
      description: 'Check Chrome downloads to install once complete.',
    })
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-stone-950 text-foreground flex items-center justify-center p-6">
        <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-950 text-foreground selection:bg-amber-400 selection:text-stone-950 flex flex-col">
      {/* Background Atmosphere */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-amber-500/10 blur-[140px] rounded-full pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between border-b border-stone-800/80 z-10">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <NexoraLogo size={36} />
          <div>
            <span className="text-base font-bold font-serif text-stone-100 group-hover:text-amber-400 transition-colors">
              Nexora
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 ml-2 rounded bg-amber-400/20 text-amber-300 font-bold">
              Apps
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-stone-900 border border-stone-800 hover:border-amber-400/50 text-stone-300 hover:text-amber-300 text-xs font-semibold transition-colors"
          >
            <span>Back to Sanctuary</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* ─── ALREADY INSTALLED VIEW (When running inside the app or after download) ─── */}
      {isInstalled && !showReinstall ? (
        <main className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center space-y-6 z-10 flex-1 flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.25)]">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Standalone App Active • com.nexora.app</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-serif font-bold text-stone-100">
              Nexora is Already Installed
            </h1>

            <p className="text-sm text-stone-400 max-w-md mx-auto leading-relaxed">
              You are currently running the official Nexora app on this device. Your sanctuary habitat, task matrix, offline cache, and AI companion are active.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold text-sm shadow-[0_0_20px_rgba(212,168,83,0.35)] flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Launch Sanctuary Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={() => setShowReinstall(true)}
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-stone-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>Reinstall / APK Options</span>
            </button>
          </div>
        </main>
      ) : (
        /* ─── DOWNLOAD & INSTALL HUB (For new website visitors) ─── */
        <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-12 z-10 flex-1">
          {/* Hero Section */}
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Official Android &amp; Desktop Distribution</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-100 tracking-tight">
              Install Nexora on Your Devices
            </h1>
            <p className="text-sm sm:text-base text-stone-400 leading-relaxed">
              Choose your preferred install method: 1-click Chrome installation without security warnings, or direct signed APK download for sideloading.
            </p>

            {/* Platform Switcher */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setActivePlatform('android')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activePlatform === 'android'
                    ? 'bg-amber-400 text-stone-950 shadow-[0_0_15px_rgba(212,168,83,0.3)]'
                    : 'bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Android</span>
              </button>
              <button
                onClick={() => setActivePlatform('desktop')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activePlatform === 'desktop'
                    ? 'bg-amber-400 text-stone-950 shadow-[0_0_15px_rgba(212,168,83,0.3)]'
                    : 'bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>Windows &amp; Mac</span>
              </button>
              <button
                onClick={() => setActivePlatform('ios')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activePlatform === 'ios'
                    ? 'bg-amber-400 text-stone-950 shadow-[0_0_15px_rgba(212,168,83,0.3)]'
                    : 'bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800'
                }`}
              >
                <Apple className="w-4 h-4" />
                <span>iOS Safari</span>
              </button>
            </div>
          </div>

          {/* ─── ANDROID SECTION ─── */}
          {activePlatform === 'android' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* Dual Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Option 1: Chrome 1-Click Install (WebAPK) */}
                <div className="p-6 rounded-2xl bg-gradient-to-b from-amber-500/10 via-stone-900/80 to-stone-900/60 border border-amber-400/40 shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-mono font-bold flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" />
                        Recommended Method
                      </span>
                      <span className="text-xs text-emerald-400 font-mono font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4" />
                        Zero Warnings
                      </span>
                    </div>

                    <div>
                      <h2 className="text-xl font-bold font-serif text-stone-100">
                        1-Click Install via Chrome
                      </h2>
                      <p className="text-xs text-stone-400 mt-1">
                        Chrome creates an official Android WebAPK on your home screen and app drawer. Runs fullscreen with zero browser address bar.
                      </p>
                    </div>

                    <ul className="space-y-2 text-xs text-stone-300">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Automatic background updates from web</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>No &quot;Unknown sources&quot; security warning</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Works seamlessly with Google OAuth &amp; Supabase</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleTriggerInstall}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(212,168,83,0.35)] transition-all cursor-pointer"
                    >
                      <Zap className="w-4 h-4 fill-current" />
                      <span>Install Nexora Now (Chrome WebAPK)</span>
                    </button>
                    <p className="text-[11px] text-stone-500 text-center mt-2">
                      In Chrome, you can also tap the three dots (⋮) and choose &quot;Install app&quot;.
                    </p>
                  </div>
                </div>

                {/* Option 2: Direct Signed APK Download */}
                <div className="p-6 rounded-2xl bg-stone-900/70 border border-stone-800 shadow-xl flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full bg-stone-800 text-stone-300 text-[11px] font-mono font-bold flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-amber-400" />
                        Direct Package
                      </span>
                      <span className="text-xs text-stone-400 font-mono font-bold text-amber-400">
                        2.2 MB Standalone App
                      </span>
                    </div>

                    <div>
                      <h2 className="text-xl font-bold font-serif text-stone-100">
                        Download Signed APK
                      </h2>
                      <p className="text-xs text-stone-400 mt-1">
                        Direct standalone package for offline sideloading, local archival, or sharing via WhatsApp / Telegram.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-stone-950/80 border border-stone-800 space-y-1.5 text-[11px] font-mono">
                      <div className="flex justify-between text-stone-400">
                        <span>Package ID:</span>
                        <span className="text-stone-200 font-semibold">com.nexora.app</span>
                      </div>
                      <div className="flex justify-between text-stone-400">
                        <span>Version:</span>
                        <span className="text-amber-300 font-semibold">v2.0.0 (Release)</span>
                      </div>
                      <div className="flex justify-between text-stone-400">
                        <span>Min SDK:</span>
                        <span className="text-stone-200">Android 5.0+ (API 21)</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <a
                      href={apkDownloadUrl}
                      download="Nexora.apk"
                      onClick={handleApkDownloadClick}
                      className="w-full py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 border border-amber-400/50 hover:border-amber-400 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Nexora.apk File (2.2 MB)</span>
                    </a>
                    <p className="text-[11px] text-stone-500 text-center mt-2">
                      Direct download link • No third-party account required
                    </p>
                  </div>
                </div>
              </div>

              {/* Sideload Instructions */}
              <div className="p-6 rounded-2xl bg-stone-900/50 border border-stone-800 space-y-4">
                <h3 className="text-sm font-bold text-stone-200 flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-400" />
                  <span>How to Install a Sideloaded APK on Android</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-stone-400">
                  <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800/80">
                    <div className="font-bold text-stone-200 mb-1">1. Download File</div>
                    <p>Click &quot;Download Nexora.apk&quot; above. Chrome will save the 2.2 MB package to your device Downloads.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800/80">
                    <div className="font-bold text-stone-200 mb-1">2. Allow Unknown Apps</div>
                    <p>Open the file. If Android asks, tap <strong>Settings &gt; Allow from this source</strong> for your browser.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800/80">
                    <div className="font-bold text-stone-200 mb-1">3. Launch Nexora</div>
                    <p>Tap <strong>Install</strong>. Nexora will appear in your app drawer and home screen in full screen.</p>
                  </div>
                </div>
              </div>

              {/* SHA-256 Checksum Card */}
              <div className="p-4 rounded-xl bg-stone-900/40 border border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="font-mono text-stone-300 font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>SHA-256 Certificate Fingerprint</span>
                  </div>
                  <p className="text-[11px] text-stone-500 font-mono break-all">
                    {sha256Fingerprint}
                  </p>
                </div>
                <button
                  onClick={handleCopySha}
                  className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-stone-100 font-mono text-[11px] flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                >
                  {copiedSha ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSha ? 'Copied' : 'Copy Hash'}</span>
                </button>
              </div>

              {/* Native Android Notification Channels & Boot Persistence Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-stone-900 via-stone-900 to-stone-950 border border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-base">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-200">Native Android Alarm &amp; Notification Engine</h4>
                    <p className="text-[11px] text-stone-400">Includes 4 dedicated system channels (Tasks, Habits, Hydration, Expenses) &amp; BootReceiver alarm restoration.</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] font-semibold">
                  v2.0.0 Active
                </span>
              </div>
            </div>
          )}

          {/* ─── DESKTOP SECTION ─── */}
          {activePlatform === 'desktop' && (
            <div className="p-8 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-6 text-center animate-in fade-in duration-200">
              <Monitor className="w-12 h-12 text-amber-400 mx-auto" />
              <div className="max-w-md mx-auto space-y-2">
                <h2 className="text-2xl font-bold font-serif text-stone-100">
                  Desktop App (Windows, macOS &amp; Linux)
                </h2>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Nexora runs in a dedicated desktop window without browser tabs, with OS dock icon, taskbar shortcut, and offline persistence.
                </p>
              </div>

              <div className="max-w-sm mx-auto pt-2">
                <button
                  onClick={handleTriggerInstall}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(212,168,83,0.35)] transition-all cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>1-Click Install Desktop Window</span>
                </button>
                <p className="text-[11px] text-stone-500 mt-2">
                  Or click the <strong>Install Icon (⊕)</strong> on the right side of the Chrome / Edge URL address bar.
                </p>
              </div>
            </div>
          )}

          {/* ─── IOS SECTION ─── */}
          {activePlatform === 'ios' && (
            <div className="p-8 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-6 text-center animate-in fade-in duration-200">
              <Apple className="w-12 h-12 text-amber-400 mx-auto" />
              <div className="max-w-md mx-auto space-y-2">
                <h2 className="text-2xl font-bold font-serif text-stone-100">
                  Install on iPhone &amp; iPad
                </h2>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Apple iOS supports full-screen installation directly through Mobile Safari:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-stone-400 max-w-xl mx-auto text-left">
                <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800">
                  <div className="font-bold text-stone-200 mb-1">1. Open Safari</div>
                  <p>Open <code>{liveAppUrl}</code> in Mobile Safari.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800">
                  <div className="font-bold text-stone-200 mb-1">2. Tap Share</div>
                  <p>Tap the <strong>Share</strong> button (box with an arrow pointing up) at the bottom.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800">
                  <div className="font-bold text-stone-200 mb-1">3. Add to Home</div>
                  <p>Scroll down and select <strong>&quot;Add to Home Screen&quot;</strong>. Nexora will launch fullscreen.</p>
                </div>
              </div>
            </div>
          )}
        </main>
      )}

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 border-t border-stone-900 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-3 z-10">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Verified Trusted Web Activity • com.nexora.app</span>
        </span>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="hover:text-amber-400 transition-colors">Sanctuary</Link>
          <Link href="/settings" className="hover:text-amber-400 transition-colors">Settings</Link>
          <a
            href="https://www.pwabuilder.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-amber-400 transition-colors flex items-center gap-1"
          >
            <span>PWABuilder</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </footer>
    </div>
  )
}
