'use client'

import React from 'react'

interface NexoraLogoProps {
  size?: number
  className?: string
  showText?: boolean
  showBadge?: boolean
}

export function NexoraLogo({
  size = 36,
  className = '',
  showText = false,
  showBadge = false,
}: NexoraLogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Scalable Vector Emblem */}
      <div
        style={{ width: size, height: size }}
        className="relative shrink-0 flex items-center justify-center group"
      >
        <svg
          viewBox="0 0 512 512"
          width="100%"
          height="100%"
          className="w-full h-full drop-shadow-[0_4px_12px_rgba(212,168,83,0.3)] transition-opacity duration-300"
        >
          <defs>
            <radialGradient id="logoBgGrad" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stop-color="#1E1B18" />
              <stop offset="70%" stop-color="#0C0A09" />
              <stop offset="100%" stop-color="#050504" />
            </radialGradient>
            <linearGradient id="logoGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#FFF8E7" />
              <stop offset="25%" stop-color="#F3DC9B" />
              <stop offset="60%" stop-color="#D4A853" />
              <stop offset="85%" stop-color="#B07D2F" />
              <stop offset="100%" stop-color="#6E440E" />
            </linearGradient>
            <linearGradient id="logoGoldAccent" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#FDE8B3" />
              <stop offset="50%" stop-color="#D4A853" />
              <stop offset="100%" stop-color="#8C5D1E" />
            </linearGradient>
            <radialGradient id="logoCoreGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.9" />
              <stop offset="45%" stop-color="#0284C7" stop-opacity="0.4" />
              <stop offset="100%" stop-color="#0C0A09" stop-opacity="0" />
            </radialGradient>
          </defs>

          {/* Shield Background */}
          <rect width="512" height="512" rx="120" fill="url(#logoBgGrad)" />
          <rect
            x="16"
            y="16"
            width="480"
            height="480"
            rx="104"
            fill="none"
            stroke="url(#logoGoldGrad)"
            strokeWidth="4"
            strokeOpacity="0.4"
          />

          {/* Core Energy Glow */}
          <circle cx="256" cy="256" r="150" fill="url(#logoCoreGlow)" />

          {/* 8-Point Compass & Lattice */}
          <g transform="translate(256, 256)">
            <polygon
              points="0,-180 22,-120 80,-80 120,-22 180,0 120,22 80,80 22,120 0,180 -22,120 -80,80 -120,22 -180,0 -120,-22 -80,-80 -22,-120"
              fill="none"
              stroke="url(#logoGoldAccent)"
              strokeWidth="2"
              strokeOpacity="0.35"
            />
            <circle
              cx="0"
              cy="0"
              r="124"
              fill="none"
              stroke="url(#logoGoldGrad)"
              strokeWidth="1.5"
              strokeOpacity="0.25"
              strokeDasharray="4 6"
            />
            <circle
              cx="0"
              cy="0"
              r="94"
              fill="#14110F"
              stroke="url(#logoGoldGrad)"
              strokeWidth="2"
              strokeOpacity="0.6"
            />

            {/* Futuristic 'N' Glyph */}
            <path d="M-62,-70 L-36,-70 L-36,70 L-62,70 Z" fill="url(#logoGoldGrad)" />
            <path d="M-62,-70 L-48,-70 L-48,70 L-62,70 Z" fill="#FFF8E7" opacity="0.6" />
            <path d="M-40,-70 L-10,-70 L42,70 L12,70 Z" fill="url(#logoGoldAccent)" />
            <path d="M-26,-70 L-12,-70 L34,70 L20,70 Z" fill="#FFFDF8" opacity="0.8" />
            <path d="M36,-70 L62,-70 L62,70 L36,70 Z" fill="url(#logoGoldGrad)" />
            <path d="M48,-70 L62,-70 L62,70 L48,70 Z" fill="#6E440E" opacity="0.5" />

            {/* Neural Spark */}
            <circle cx="0" cy="0" r="14" fill="#38BDF8" />
            <circle cx="0" cy="0" r="7" fill="#FFFFFF" />
            <circle
              cx="0"
              cy="0"
              r="22"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="2"
              strokeOpacity="0.75"
            />
          </g>
        </svg>
      </div>

      {/* Typography Brand Name */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold font-serif tracking-tight text-gradient-gold">
              NEXORA
            </span>
            {showBadge && (
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 font-mono font-bold tracking-widest uppercase">
                OS
              </span>
            )}
          </div>
          <span className="text-[9px] font-mono uppercase tracking-widest text-stone-400 -mt-0.5">
            Autonomic Sanctuary
          </span>
        </div>
      )}
    </div>
  )
}
