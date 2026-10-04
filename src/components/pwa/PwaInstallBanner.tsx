'use client'

import React from 'react'
import { usePwa } from './PwaProvider'
import { Download, X, Laptop, Smartphone, Sparkles, Check } from 'lucide-react'

export function PwaInstallBanner() {
  const { isInstallable, isInstalled, showBanner, installApp, dismissInstallBanner, isIos } = usePwa()

  if (isInstalled || !showBanner) return null

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 max-w-md w-[calc(100%-2rem)] sm:w-auto animate-in slide-in-from-bottom-5 duration-300">
      <div className="world-deck p-4 bg-stone-950/95 border-amber-400/50 shadow-[0_12px_40px_rgba(0,0,0,0.7)] flex items-center justify-between gap-3 sm:gap-4 ring-1 ring-amber-400/30">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shrink-0 shadow-sm flex items-center justify-center">
            <div className="w-full h-full rounded-[10px] bg-stone-950 flex items-center justify-center text-amber-300 font-serif font-bold text-base">
              N
            </div>
          </div>

          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
              <span>Install Nexora App</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 text-[10px] font-mono uppercase">
                PWA
              </span>
            </h4>
            <p className="text-[11px] text-stone-400 truncate">
              {isIos ? 'Add to Home Screen for full screen' : 'Install for standalone desktop/mobile performance'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => installApp()}
            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(212,168,83,0.35)] transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>

          <button
            onClick={dismissInstallBanner}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 transition-colors cursor-pointer"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
