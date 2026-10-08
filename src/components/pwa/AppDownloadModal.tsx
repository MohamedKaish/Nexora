'use client'

import React, { useState } from 'react'
import { NexoraLogo } from '@/components/brand/NexoraLogo'
import {
  X,
  Download,
  Smartphone,
  Laptop,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Sparkles,
  Share2,
} from 'lucide-react'
import { usePwa } from './PwaProvider'
import { toast } from 'sonner'

interface AppDownloadModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AppDownloadModal({ isOpen, onClose }: AppDownloadModalProps) {
  const { isInstallable, isInstalled, installApp, isIos } = usePwa()
  const [copied, setCopied] = useState(false)

  const liveAppUrl = 'https://nexora-nine-kappa.vercel.app'
  const apkBuilderUrl = `https://www.pwabuilder.com?url=${encodeURIComponent(liveAppUrl)}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(liveAppUrl)
      setCopied(true)
      toast.success('App link copied! Open on your phone to install directly.')
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.info(`App link: ${liveAppUrl}`)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg world-deck p-6 sm:p-8 bg-stone-950/98 border border-amber-400/40 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Ambient Gold Glow */}
        <div className="absolute top-0 right-1/4 w-72 h-72 rounded-full blur-[100px] bg-amber-500/10 pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-5 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <NexoraLogo size={36} />
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-foreground">
                Download Nexora App
              </h3>
              <p className="text-xs text-stone-400">
                Direct installation & Android APK package
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
        <div className="py-6 space-y-4">
          {/* Card 1: Direct Android APK Download / Package */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-stone-900/60 to-stone-900/40 border border-amber-400/35 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span>Android APK (.apk)</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300 text-[10px] font-mono font-bold">
                      Direct Build
                    </span>
                  </h4>
                  <p className="text-xs text-stone-400">
                    Generate & download the standalone Android APK installer file
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <a
                href={apkBuilderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(212,168,83,0.3)] transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Android APK ↗</span>
              </a>

              <button
                onClick={handleCopyLink}
                className="px-3.5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Copy live URL to open on your Android phone"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Card 2: 1-Click Native App Install (Mobile & Desktop PWA) */}
          <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-stone-800 text-stone-300">
                <Laptop className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  Direct Device Installation (PWA)
                </h4>
                <p className="text-xs text-stone-400">
                  Installs immediately to PC, Mac, or phone without downloading files
                </p>
              </div>
            </div>

            <div className="pt-1">
              <button
                onClick={async () => {
                  const installed = await installApp()
                  if (installed) {
                    toast.success('Nexora installed successfully!')
                    onClose()
                  }
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-amber-400/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Install Directly on This Device</span>
              </button>
            </div>

            <div className="text-[11px] text-stone-400 bg-stone-950/60 p-2.5 rounded-xl border border-stone-800/80 space-y-1">
              <p className="font-semibold text-stone-300">Quick Mobile Steps:</p>
              <ul className="list-disc list-inside space-y-0.5 text-stone-400">
                <li><strong className="text-stone-300">Android Chrome:</strong> Tap menu (⋮) → tap <em>Install app</em></li>
                <li><strong className="text-stone-300">iPhone Safari:</strong> Tap Share ⎋ → tap <em>Add to Home Screen</em></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
          <span className="flex items-center gap-1.5 text-stone-400 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live at {liveAppUrl.replace('https://', '')}
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
