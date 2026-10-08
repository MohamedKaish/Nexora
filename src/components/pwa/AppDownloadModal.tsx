'use client'

import React, { useState } from 'react'
import { NexoraLogo } from '@/components/brand/NexoraLogo'
import {
  X,
  Download,
  Smartphone,
  Monitor,
  Check,
  Zap,
  ShieldCheck,
  Sparkles,
  ArrowDownToLine,
} from 'lucide-react'
import { usePwa } from './PwaProvider'
import { toast } from 'sonner'

interface AppDownloadModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AppDownloadModal({ isOpen, onClose }: AppDownloadModalProps) {
  const { installApp, isInstalled } = usePwa()
  const [downloadingPlatform, setDownloadingPlatform] = useState<string | null>(null)

  // Direct 1-Click File Download without leaving the website
  const handleDirectFileDownload = (platform: 'android' | 'pc') => {
    setDownloadingPlatform(platform)
    const fileName = platform === 'android' ? 'Nexora.apk' : 'Nexora-Setup.exe'
    const downloadUrl = `/api/download?platform=${platform}`

    // Trigger instant browser file download directly
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    a.remove()

    toast.success(`Downloading ${fileName} directly to your device!`)

    setTimeout(() => {
      setDownloadingPlatform(null)
    }, 1500)
  }

  // Direct 1-Click Native App Installation into Phone / PC
  const handleDirectInstall = async () => {
    const installed = await installApp()
    if (installed) {
      toast.success('Nexora installed directly on this device!')
      onClose()
    }
  }

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
                1-Click Direct Download
              </h3>
              <p className="text-xs text-stone-400">
                Download the app directly to your device — zero site redirection
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

        {/* Modal Body: 1-Click Downloads */}
        <div className="py-5 space-y-3.5">
          {/* ─── OPTION 1: Direct Android APK Download ─── */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-stone-900/70 to-stone-900/40 border border-amber-400/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-400/20 text-amber-300">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span>Android Phone & Tablet (.apk)</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300 text-[10px] font-mono font-bold">
                      Direct APK
                    </span>
                  </h4>
                  <p className="text-xs text-stone-400">
                    Instantly downloads Nexora.apk file right now
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleDirectFileDownload('android')}
              disabled={downloadingPlatform === 'android'}
              className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(212,168,83,0.35)] transition-all cursor-pointer"
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span>
                {downloadingPlatform === 'android'
                  ? 'Downloading Nexora.apk...'
                  : '1-Click Download Android APK (.apk)'}
              </span>
            </button>
          </div>

          {/* ─── OPTION 2: Direct PC Windows Installer Download ─── */}
          <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 hover:border-amber-400/40 transition-colors space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-stone-800 text-stone-200">
                  <Monitor className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span>Windows PC Installer (.exe)</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold">
                      Direct PC
                    </span>
                  </h4>
                  <p className="text-xs text-stone-400">
                    Instantly downloads Nexora-Setup.exe installer file
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleDirectFileDownload('pc')}
              disabled={downloadingPlatform === 'pc'}
              className="w-full px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-amber-400/60 text-stone-100 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <ArrowDownToLine className="w-4 h-4 text-amber-400" />
              <span>
                {downloadingPlatform === 'pc'
                  ? 'Downloading Nexora-Setup.exe...'
                  : '1-Click Download PC Installer (.exe)'}
              </span>
            </button>
          </div>

          {/* ─── OPTION 3: Instant Device App Installation (No files needed) ─── */}
          <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Install Directly on This Screen</span>
              </h5>
              <p className="text-[11px] text-stone-400">
                Adds Nexora app icon directly to your phone/desktop home screen
              </p>
            </div>

            <button
              onClick={handleDirectInstall}
              className="px-3.5 py-1.5 rounded-lg bg-amber-400/15 border border-amber-400/40 hover:bg-amber-400/25 text-amber-300 font-bold text-xs shrink-0 cursor-pointer transition-colors"
            >
              Install App
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
          <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5" />
            Direct Download Verified • No Third-Party Redirects
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
