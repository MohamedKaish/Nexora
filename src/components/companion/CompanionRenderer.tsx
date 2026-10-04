'use client'

import React, { useEffect, useState } from 'react'
import {
  CompanionRendererProps,
  EyeExpression,
  MouthExpression,
  RendererKind,
  normalizeArchetype,
} from './CompanionState'
import { ORIGINAL_CREATURES } from './companion-data'
import { resolveExpressions } from './CompanionController'

export function CompanionRenderer({
  config,
  size = 150,
  moodOverride,
  showPlatform = true,
  showGlow = true,
  speechBubbleText,
  className = '',
  interactive = true,
  onClick,
  renderer = '2d',
}: CompanionRendererProps & { renderer?: RendererKind }) {
  const activeMood = moodOverride || config.mood || 'idle'
  const archetype = normalizeArchetype(config.archetype)
  const creatureMeta = ORIGINAL_CREATURES[archetype] || ORIGINAL_CREATURES.nyxen

  // Internal Blink Cycle
  const [isBlinking, setIsBlinking] = useState(false)
  const isReducedMotion = config.isReducedMotion || false

  useEffect(() => {
    if (activeMood === 'sleeping') return
    const blinkInterval = setInterval(() => {
      setIsBlinking(true)
      setTimeout(() => setIsBlinking(false), 180)
    }, 4000 + Math.random() * 2500)

    return () => clearInterval(blinkInterval)
  }, [activeMood])

  const { eye, mouth } = resolveExpressions(activeMood, isBlinking)

  // Future 3D plug-in stub
  if (renderer === '3d') {
    return (
      <div
        className={`relative flex items-center justify-center ${className}`}
        style={{ width: size, height: size * 1.15 }}
      >
        <span className="text-xs text-stone-500 font-mono">3D Renderer Plug-in Reserved</span>
      </div>
    )
  }

  // Animation CSS classes
  const getBodyAnimationClass = () => {
    if (isReducedMotion) return ''
    switch (activeMood) {
      case 'celebrating':
        return 'animate-celebrate'
      case 'speaking':
        return 'animate-speaking'
      case 'thinking':
        return 'animate-pulse'
      case 'listening':
        return 'transition-transform duration-300 scale-[1.02]'
      case 'focused':
        return 'transition-all duration-500 opacity-95'
      case 'sleeping':
        return 'opacity-80 scale-95'
      default:
        return 'animate-breathing'
    }
  }

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex flex-col items-center select-none ${
        interactive ? 'cursor-pointer group' : ''
      } ${className}`}
      style={{ width: size, height: size * 1.15 }}
      role="img"
      aria-label={`${creatureMeta.name} in ${activeMood} state`}
    >
      {/* ── SPEECH BUBBLE ── */}
      {speechBubbleText && (
        <div className="absolute -top-16 z-30 max-w-[240px] px-3.5 py-2 rounded-2xl bg-stone-950/95 border border-amber-400/40 text-amber-200 text-xs font-medium text-center shadow-[0_8px_24px_rgba(0,0,0,0.6)] backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
          <p className="line-clamp-3 leading-snug">{speechBubbleText}</p>
          {/* Arrow Pointer */}
          <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-2.5 h-2.5 bg-stone-950 border-r border-b border-amber-400/40 rotate-45" />
        </div>
      )}

      {/* ── ATMOSPHERIC GLOW AURA ── */}
      {showGlow && (
        <div
          className={`absolute inset-0 rounded-full blur-2xl pointer-events-none transition-all duration-700 ${
            activeMood === 'speaking' || activeMood === 'celebrating'
              ? 'opacity-60 scale-110'
              : 'opacity-35 scale-100'
          }`}
          style={{
            background: `radial-gradient(circle, ${creatureMeta.accentColor} 0%, transparent 70%)`,
          }}
        />
      )}

      {/* ── LIVING 2D VECTOR CREATURE ── */}
      <div className={`relative z-10 w-full h-full flex items-center justify-center ${getBodyAnimationClass()}`}>
        <svg
          viewBox="0 0 120 135"
          className="w-full h-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.45)] overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Nyxen Gradients */}
            <linearGradient id="nyxenBodyGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1E1B4B" />
              <stop offset="60%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#09090B" />
            </linearGradient>
            <linearGradient id="nyxenScarfGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="50%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#67E8F9" />
            </linearGradient>
            <linearGradient id="nyxenGlowGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>

            {/* Aerix Gradients */}
            <linearGradient id="aerixBodyGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#F0FDFA" />
              <stop offset="50%" stopColor="#2DD4BF" />
              <stop offset="100%" stopColor="#0F766E" />
            </linearGradient>
            <linearGradient id="aerixWingGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#CCFBF1" />
              <stop offset="70%" stopColor="#5EEAD4" />
              <stop offset="100%" stopColor="#0D9488" />
            </linearGradient>

            {/* Vayron Gradients */}
            <linearGradient id="vayronPlateGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#292524" />
              <stop offset="50%" stopColor="#1C1917" />
              <stop offset="100%" stopColor="#0C0A09" />
            </linearGradient>
            <linearGradient id="goldCoreGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="50%" stopColor="#D4A853" />
              <stop offset="100%" stopColor="#B07D2F" />
            </linearGradient>
          </defs>

          {/* ══════════════════════════════════════════════════════════
              CREATURE A: NYXEN — THE AGILE NINJA CREATURE
          ══════════════════════════════════════════════════════════ */}
          {archetype === 'nyxen' && (
            <g className="transition-all duration-300">
              {/* Floating Energy Particles for Thinking */}
              {activeMood === 'thinking' && (
                <g className="animate-pulse">
                  <circle cx="35" cy="20" r="2" fill="#38BDF8" opacity="0.8" />
                  <circle cx="85" cy="18" r="1.5" fill="#67E8F9" opacity="0.9" />
                  <circle cx="60" cy="12" r="2.5" fill="#38BDF8" opacity="0.7" />
                </g>
              )}

              {/* Trailing Energy Scarf (Back Tail Layer) */}
              <path
                d="M 68 84 C 92 88 108 102 114 118 C 102 116 86 102 68 94 Z"
                fill="url(#nyxenScarfGrad)"
                opacity="0.85"
                className={activeMood === 'speaking' ? 'animate-pulse' : ''}
              />
              <path
                d="M 52 86 C 24 94 8 108 2 120 C 14 114 36 98 52 92 Z"
                fill="url(#nyxenScarfGrad)"
                opacity="0.8"
              />

              {/* Sleek Feline/Ninja Silhouette Body */}
              <path
                d="M 38 68 C 38 56 82 56 82 68 C 84 88 78 108 60 110 C 42 108 36 88 38 68 Z"
                fill="url(#nyxenBodyGrad)"
                stroke="#38BDF8"
                strokeWidth="1.8"
              />

              {/* Cyber Shoulder Markings */}
              <path d="M 40 76 L 46 84" stroke="#67E8F9" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M 80 76 L 74 84" stroke="#67E8F9" strokeWidth="1.5" strokeLinecap="round" />

              {/* Glowing Chest Emblem: Speed Rune */}
              <polygon
                points="60,78 64,86 59,87 63,94 56,87 60,86"
                fill="url(#nyxenGlowGrad)"
                filter="drop-shadow(0 0 4px #38BDF8)"
              />

              {/* Scarf Collar (Foreground Wrap) */}
              <path
                d="M 34 60 C 44 68 76 68 86 60 C 82 72 38 72 34 60 Z"
                fill="url(#nyxenScarfGrad)"
                stroke="#0284C7"
                strokeWidth="1"
              />

              {/* Sleek Ninja Head */}
              <path
                d="M 32 46 C 30 24 44 14 60 14 C 76 14 90 24 88 46 C 88 58 74 64 60 64 C 46 64 32 58 32 46 Z"
                fill="url(#nyxenBodyGrad)"
                stroke="#38BDF8"
                strokeWidth="1.8"
              />

              {/* Ninja Stealth Ears */}
              <polygon points="36,24 46,6 48,22" fill="#1E1B4B" stroke="#38BDF8" strokeWidth="1.4" />
              <polygon points="84,24 74,6 72,22" fill="#1E1B4B" stroke="#38BDF8" strokeWidth="1.4" />
              {/* Inner ear glow */}
              <polygon points="39,21 46,10 47,20" fill="#38BDF8" opacity="0.6" />
              <polygon points="81,21 74,10 73,20" fill="#38BDF8" opacity="0.6" />

              {/* Forehead Energy Crest */}
              <polygon points="60,20 63,26 60,30 57,26" fill="#67E8F9" />

              {/* ── NYXEN EYES ── */}
              {eye === 'blink' ? (
                // Blinking slit
                <g stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="43" y1="42" x2="53" y2="42" />
                  <line x1="67" y1="42" x2="77" y2="42" />
                </g>
              ) : eye === 'sleepy_line' ? (
                // Sleepy peaceful lines
                <g stroke="#38BDF8" strokeWidth="2" strokeLinecap="round">
                  <line x1="43" y1="43" x2="52" y2="43" />
                  <line x1="68" y1="43" x2="77" y2="43" />
                  <text x="82" y="24" fill="#67E8F9" fontSize="9" fontWeight="bold">z</text>
                  <text x="88" y="16" fill="#38BDF8" fontSize="12" fontWeight="bold">Z</text>
                </g>
              ) : eye === 'joyful_arch' ? (
                // Happy curved eyes (^ ^)
                <g stroke="#67E8F9" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M 43 43 Q 48 37 53 43" fill="none" />
                  <path d="M 67 43 Q 72 37 77 43" fill="none" />
                  {/* Energy blush sparks */}
                  <circle cx="39" cy="46" r="2" fill="#38BDF8" opacity="0.6" />
                  <circle cx="81" cy="46" r="2" fill="#38BDF8" opacity="0.6" />
                </g>
              ) : eye === 'focused' ? (
                // Sharp focused gaze
                <g>
                  <polygon points="42,39 54,41 53,44 43,43" fill="#67E8F9" />
                  <polygon points="78,39 66,41 67,44 77,43" fill="#67E8F9" />
                  <circle cx="48" cy="42" r="1.5" fill="#09090B" />
                  <circle cx="72" cy="42" r="1.5" fill="#09090B" />
                </g>
              ) : eye === 'thinking_up' ? (
                // Looking upward thoughtfully
                <g>
                  <ellipse cx="48" cy="38" rx="5" ry="4" fill="#38BDF8" />
                  <ellipse cx="72" cy="38" rx="5" ry="4" fill="#38BDF8" />
                  <circle cx="49" cy="37" r="2" fill="#09090B" />
                  <circle cx="73" cy="37" r="2" fill="#09090B" />
                  <circle cx="50" cy="36" r="1" fill="#FFFFFF" />
                  <circle cx="74" cy="36" r="1" fill="#FFFFFF" />
                </g>
              ) : eye === 'wide_surprised' ? (
                // Surprised wide eyes
                <g>
                  <circle cx="48" cy="40" r="6.5" fill="#67E8F9" />
                  <circle cx="72" cy="40" r="6.5" fill="#67E8F9" />
                  <circle cx="48" cy="40" r="3.5" fill="#09090B" />
                  <circle cx="72" cy="40" r="3.5" fill="#09090B" />
                  <circle cx="50" cy="38" r="1.5" fill="#FFFFFF" />
                  <circle cx="74" cy="38" r="1.5" fill="#FFFFFF" />
                </g>
              ) : (
                // Normal luminous ninja gaze
                <g>
                  <ellipse cx="48" cy="41" rx="5.5" ry="4.5" fill="#38BDF8" />
                  <ellipse cx="72" cy="41" rx="5.5" ry="4.5" fill="#38BDF8" />
                  <circle cx="48" cy="41" r="2.5" fill="#09090B" />
                  <circle cx="72" cy="41" r="2.5" fill="#09090B" />
                  <circle cx="50" cy="39.5" r="1.2" fill="#FFFFFF" />
                  <circle cx="74" cy="39.5" r="1.2" fill="#FFFFFF" />
                </g>
              )}

              {/* ── NYXEN MOUTH ── */}
              {mouth === 'speaking_pulse' ? (
                // Animated speaking mouth
                <g>
                  <ellipse cx="60" cy="52" rx="4" ry="3" fill="#67E8F9" />
                  <ellipse cx="60" cy="52" rx="2.5" ry="1.8" fill="#09090B" />
                </g>
              ) : mouth === 'smile_open' ? (
                <path d="M 54 50 Q 60 56 66 50" stroke="#67E8F9" strokeWidth="2" strokeLinecap="round" fill="none" />
              ) : mouth === 'thinking_smirk' ? (
                <path d="M 56 52 Q 62 50 65 53" stroke="#38BDF8" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              ) : mouth === 'surprised_o' ? (
                <ellipse cx="60" cy="52" rx="3" ry="3.5" fill="#67E8F9" />
              ) : (
                // Sleek closed curve
                <path d="M 56 51 Q 60 53 64 51" stroke="#38BDF8" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              )}
            </g>
          )}

          {/* ══════════════════════════════════════════════════════════
              CREATURE B: AERIX — THE ICE SKY GUARDIAN
          ══════════════════════════════════════════════════════════ */}
          {archetype === 'aerix' && (
            <g className="transition-all duration-300">
              {/* Crystalline Wings Fluttering */}
              <polygon points="32,60 4,36 18,30 34,48" fill="url(#aerixWingGrad)" opacity="0.9" />
              <polygon points="88,60 116,36 102,30 86,48" fill="url(#aerixWingGrad)" opacity="0.9" />

              {/* Secondary Wing Shimmer */}
              <polygon points="30,70 10,54 22,50 32,62" fill="#CCFBF1" opacity="0.6" />
              <polygon points="90,70 110,54 98,50 88,62" fill="#CCFBF1" opacity="0.6" />

              {/* Body Pod */}
              <ellipse cx="60" cy="80" rx="22" ry="28" fill="url(#aerixBodyGrad)" stroke="#2DD4BF" strokeWidth="1.8" />

              {/* Tail Crystal Feather */}
              <polygon points="60,108 55,124 60,130 65,124" fill="#2DD4BF" />

              {/* Head */}
              <circle cx="60" cy="42" r="22" fill="#0F172A" stroke="#2DD4BF" strokeWidth="1.8" />

              {/* Frosted Crest Horns */}
              <polygon points="50,22 42,4 54,16" fill="#2DD4BF" />
              <polygon points="70,22 78,4 66,16" fill="#2DD4BF" />
              <polygon points="60,18 60,2 62,14" fill="#A78BFA" />

              {/* Eyes */}
              {eye === 'blink' ? (
                <line x1="50" y1="42" x2="70" y2="42" stroke="#2DD4BF" strokeWidth="2.5" strokeLinecap="round" />
              ) : (
                <g>
                  <circle cx="51" cy="42" r="4.5" fill="#2DD4BF" />
                  <circle cx="69" cy="42" r="4.5" fill="#2DD4BF" />
                  <circle cx="52" cy="41" r="1.5" fill="#FFFFFF" />
                  <circle cx="70" cy="41" r="1.5" fill="#FFFFFF" />
                </g>
              )}

              {/* Beak / Mouth */}
              {mouth === 'speaking_pulse' ? (
                <polygon points="57,48 63,48 60,55" fill="#A78BFA" />
              ) : (
                <polygon points="58,49 62,49 60,53" fill="#2DD4BF" />
              )}
            </g>
          )}

          {/* ══════════════════════════════════════════════════════════
              CREATURE C: VAYRON — THE HEROIC GUARDIAN
          ══════════════════════════════════════════════════════════ */}
          {archetype === 'vayron' && (
            <g className="transition-all duration-300">
              {/* Bastion Shoulder Plate Mantles */}
              <rect x="20" y="62" width="18" height="28" rx="6" fill="url(#vayronPlateGrad)" stroke="#D4A853" strokeWidth="1.8" />
              <rect x="82" y="62" width="18" height="28" rx="6" fill="url(#vayronPlateGrad)" stroke="#D4A853" strokeWidth="1.8" />

              {/* Armored Torso */}
              <path
                d="M 36 64 C 36 54 84 54 84 64 L 86 104 C 86 110 34 110 34 104 Z"
                fill="url(#vayronPlateGrad)"
                stroke="#D4A853"
                strokeWidth="2"
              />

              {/* Solar Core Heart Star */}
              <polygon
                points="60,74 64,82 72,83 66,88 68,96 60,91 52,96 54,88 48,83 56,82"
                fill="url(#goldCoreGrad)"
                stroke="#FBBF24"
                strokeWidth="0.8"
                filter="drop-shadow(0 0 6px #FBBF24)"
              />

              {/* Noble Sentinel Helm / Head */}
              <path
                d="M 34 44 C 34 22 86 22 86 44 C 86 60 34 60 34 44 Z"
                fill="url(#vayronPlateGrad)"
                stroke="#D4A853"
                strokeWidth="2"
              />

              {/* Helm Wing Crests */}
              <polygon points="34,32 22,18 36,24" fill="#D4A853" />
              <polygon points="86,32 98,18 84,24" fill="#D4A853" />

              {/* Visor / Eyes */}
              {eye === 'blink' ? (
                <line x1="46" y1="42" x2="74" y2="42" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
              ) : (
                <g>
                  <rect x="44" y="38" width="32" height="8" rx="4" fill="#0C0A09" stroke="#D4A853" strokeWidth="1" />
                  <ellipse cx="52" cy="42" rx="3.5" ry="2.5" fill="#FBBF24" />
                  <ellipse cx="68" cy="42" rx="3.5" ry="2.5" fill="#FBBF24" />
                </g>
              )}

              {/* Resolute Mouth */}
              {mouth === 'speaking_pulse' ? (
                <ellipse cx="60" cy="52" rx="4" ry="2.5" fill="#FBBF24" />
              ) : (
                <line x1="55" y1="52" x2="65" y2="52" stroke="#D4A853" strokeWidth="2" strokeLinecap="round" />
              )}
            </g>
          )}
        </svg>
      </div>

      {/* ── GROUNDING PEDESTAL & DAIS ── */}
      {showPlatform && (
        <div className="relative -mt-4 w-4/5 flex flex-col items-center">
          {/* Luminous Core Ring */}
          <div
            className="w-full h-3.5 rounded-[100%] border border-amber-400/50 shadow-[0_0_15px_rgba(212,168,83,0.35)]"
            style={{
              background: `radial-gradient(ellipse at center, ${creatureMeta.accentColor}40 0%, transparent 80%)`,
            }}
          />
          {/* Spatial Ground Shadow */}
          <div className="w-2/3 h-2 rounded-[100%] bg-black/50 blur-[3px] mt-0.5" />
        </div>
      )}
    </div>
  )
}
