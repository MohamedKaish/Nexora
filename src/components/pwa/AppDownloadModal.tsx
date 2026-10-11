'use client'

import React, { useState } from 'react'
import { NexoraLogo } from '@/components/brand/NexoraLogo'
import {
  X,
  Smartphone,
  Monitor,
  Zap,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Laptop,
} from 'lucide-react'
import { usePwa } from './PwaProvider'
import { toast } from 'sonner'

interface AppDownloadModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AppDownloadModal({ isOpen, onClose }: AppDownloadModalProps) {
  const { installApp, isInstalled } = usePwa()
  const [installingDevice, setInstallingDevice] = useState(false)

  // Direct 1-Click Native App Installation on Desktop / Mobile
  const handleDirectInstall = async () => {
    setInstallingDevice(true)
    const success = await installApp()
    setInstallingDevice(false)
    if (success) {
      toast.success('Nexora installed on your device!')
      onClose()
    }
  }

  const liveAppUrl = 'https://nexora-nine-kappa.vercel.app'
  const apkPackageUrl = `https://www.pwabuilder.com?url=${encodeURIComponent(liveAppUrl)}`

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/85 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg world-deck p-6 sm:p-8 bg-stone-950/98 border border-amber-400/40 shadow-[0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden">
        {/* Ambient Gold Glow */}
        <div className="absolute top-0 right-1/4 w-72 h-72 rounded-full blur-[100px] bg-amber-500/15 pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <NexoraLogo size={36} />
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-foreground">
                Install Nexora on PC & Phone
              </h3>
              <p className="text-xs text-stone-400">
                Standalone desktop window & mobile app without errors
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800/80 transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="py-5 space-y-4">
          {/* ─── 1. PC: 1-Click Desktop App (Like Chrome / Slack / Spotify) ─── */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-stone-900/80 to-stone-900/50 border border-amber-400/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-400/20 text-amber-300 shrink-0">
                  <Monitor className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span>PC Desktop App (Windows & Mac)</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold">
                      Official Desktop
                    </span>
                  </h4>
                  <p className="text-xs text-stone-400">
                    Runs in its own window, taskbar icon, and desktop shortcut
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleDirectInstall}
              disabled={installingDevice}
              className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(212,168,83,0.35)] transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>
                {installingDevice
                  ? 'Installing to PC...'
                  : '1-Click Install App on This PC / Mac'}
              </span>
            </button>

            <div className="text-[11px] text-stone-400 bg-stone-950/80 p-2.5 rounded-xl border border-stone-800/80">
              <p className="font-semibold text-stone-300">How PC Install Works:</p>
              <p>In Chrome or Edge, click the <strong>Install Icon (⊕)</strong> on the right side of the URL bar (or click the button above). It installs Nexora immediately without running third-party .exe files.</p>
            </div>
          </div>

          {/* ─── 2. Android: Real Phone App Installation ─── */}
          <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 hover:border-amber-400/40 transition-colors space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-stone-800 text-stone-300 shrink-0">
                  <Smartphone className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span>Android Phone & Tablet App</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300 text-[10px] font-mono font-bold">
                      Native Android
                    </span>
                  </h4>
                  <p className="text-xs text-stone-400">
                    Installs directly to your Android home screen & app drawer
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                onClick={handleDirectInstall}
                className="flex-1 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-amber-400/50 hover:border-amber-400 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Zap className="w-4 h-4" />
                <span>1-Click Install on Phone</span>
              </button>

              <a
                href={apkPackageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                title="Download signed APK package from Google PWABuilder"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                <span>Signed APK Builder ↗</span>
              </a>
            </div>

            <div className="text-[11px] text-stone-400 bg-stone-950/80 p-2.5 rounded-xl border border-stone-800/80">
              <p className="font-semibold text-stone-300">Why &quot;Problem Parsing Package&quot; happens on Android:</p>
              <p>Android requires cryptographic keys to parse raw APK files. Instead of an unsigned file, tap <strong>&quot;Install app&quot;</strong> in your mobile Chrome menu (⋮) to install Nexora instantly with zero errors, or use the signed APK builder above!</p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
          <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5" />
            Official Web App Installation • Verified Safe
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
