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
  Monitor,
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

type DownloadTab = 'all' | 'pc' | 'mobile'

export function AppDownloadModal({ isOpen, onClose }: AppDownloadModalProps) {
  const { isInstallable, isInstalled, installApp, isIos } = usePwa()
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<DownloadTab>('all')

  const liveAppUrl = 'https://nexora-nine-kappa.vercel.app'
  const apkBuilderUrl = `https://www.pwabuilder.com?url=${encodeURIComponent(liveAppUrl)}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(liveAppUrl)
      setCopied(true)
      toast.success('App link copied to clipboard!')
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.info(`App link: ${liveAppUrl}`)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-xl world-deck p-5 sm:p-7 bg-stone-950/98 border border-amber-400/40 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden max-h-[90vh] flex flex-col">
        {/* Ambient Gold Glow */}
        <div className="absolute top-0 right-1/4 w-72 h-72 rounded-full blur-[100px] bg-amber-500/10 pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-3">
            <NexoraLogo size={36} />
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-foreground">
                Download & Install Nexora
              </h3>
              <p className="text-xs text-stone-400">
                Official releases for Windows PC, Mac, and Android
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

        {/* Device Filter Tabs */}
        <div className="pt-3 pb-1 flex gap-1.5 shrink-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-amber-400 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 bg-stone-900/60'
            }`}
          >
            All Platforms
          </button>
          <button
            onClick={() => setActiveTab('pc')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'pc'
                ? 'bg-amber-400 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 bg-stone-900/60'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Windows & Mac PC</span>
          </button>
          <button
            onClick={() => setActiveTab('mobile')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'mobile'
                ? 'bg-amber-400 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 bg-stone-900/60'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android APK</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1">
          {/* ─── CARD 1: PC (Windows & Mac) ─── */}
          {(activeTab === 'all' || activeTab === 'pc') && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-stone-900/90 via-stone-900/50 to-stone-950 border border-stone-800 hover:border-amber-400/40 transition-colors space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-400/10 text-amber-300">
                    <Monitor className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <span>Windows PC & Mac Desktop App</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold">
                        PC Native
                      </span>
                    </h4>
                    <p className="text-xs text-stone-400">
                      Standalone desktop window with taskbar pinning and hotkeys
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  onClick={async () => {
                    const installed = await installApp()
                    if (installed) {
                      toast.success('Nexora Desktop App installed successfully!')
                      onClose()
                    }
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(212,168,83,0.3)] transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>1-Click Install to Desktop</span>
                </button>

                <a
                  href={apkBuilderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-amber-400/50 text-stone-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                  <span>Package for Windows Store ↗</span>
                </a>
              </div>

              <div className="text-[11px] text-stone-400 bg-stone-950/70 p-2.5 rounded-xl border border-stone-800/80 space-y-0.5">
                <p className="font-semibold text-stone-300">Quick PC Install (Chrome or Edge):</p>
                <p>Click the <strong>Install Icon (⊕)</strong> on the right side of your browser address bar or click the button above.</p>
              </div>
            </div>
          )}

          {/* ─── CARD 2: Android Mobile APK ─── */}
          {(activeTab === 'all' || activeTab === 'mobile') && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-stone-900/60 to-stone-900/40 border border-amber-400/35 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <span>Android APK Package (.apk)</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300 text-[10px] font-mono font-bold">
                        Standalone APK
                      </span>
                    </h4>
                    <p className="text-xs text-stone-400">
                      Download the signed Android APK package to install or distribute
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
                  title="Copy live URL to send to your phone"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>

              <div className="text-[11px] text-stone-400 bg-stone-950/70 p-2.5 rounded-xl border border-stone-800/80 space-y-0.5">
                <p className="font-semibold text-stone-300">Direct Android Chrome Install:</p>
                <p>Open on Android Chrome → tap three dots (⋮) → select <strong>"Install app"</strong>.</p>
              </div>
            </div>
          )}

          {/* ─── CARD 3: Direct Web Link ─── */}
          <div className="p-3.5 rounded-xl bg-stone-900/40 border border-stone-800/80 flex items-center justify-between gap-3 text-xs">
            <div className="min-w-0">
              <span className="text-[11px] text-stone-400 block font-mono truncate">
                Direct Web URL: {liveAppUrl}
              </span>
            </div>
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-amber-300 font-bold text-[11px] flex items-center gap-1 shrink-0 cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400 shrink-0">
          <span className="flex items-center gap-1.5 text-stone-400 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Universal Habitat v2.1
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
