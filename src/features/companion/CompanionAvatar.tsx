'use client'

import { useCharacterStore } from '@/store/characterStore'
import { useEffect, useState } from 'react'

interface CompanionAvatarProps {
  size?: number
  className?: string
  expression?: string
  animate?: boolean
  state?: CompanionState
  showGlow?: boolean
  showPlatform?: boolean
}

export type CompanionState =
  | 'idle' | 'greeting' | 'celebrating' | 'focused'
  | 'thinking' | 'happy' | 'sleepy' | 'working'
  | 'waving' | 'reading' | 'resting'

const SKIN_TONES: Record<string, { base: string; shadow: string; blush: string }> = {
  light: { base: '#F5D0A9', shadow: '#E8B888', blush: '#FFBABA' },
  warm: { base: '#E8C39E', shadow: '#D3A982', blush: '#FF9999' },
}

/**
 * Premium SVG companion avatar with layered rendering,
 * animated state system, and deep customization support.
 */
export function CompanionAvatar({
  size = 120,
  className = '',
  expression: expressionOverride,
  animate = true,
  state = 'idle',
  showGlow = false,
  showPlatform = false,
}: CompanionAvatarProps) {
  const config = useCharacterStore((s) => s.config)
  const [blinkPhase, setBlinkPhase] = useState(false)

  // Blink cycle
  useEffect(() => {
    if (!animate || config.isReducedMotion) return
    const interval = setInterval(() => {
      setBlinkPhase(true)
      setTimeout(() => setBlinkPhase(false), 150)
    }, 3000 + Math.random() * 2000)
    return () => clearInterval(interval)
  }, [animate, config.isReducedMotion])

  if (!config.isCompanionEnabled) return null

  const expr = expressionOverride || config.expression
  const reducedMotion = config.isReducedMotion
  const skin = SKIN_TONES.warm
  const isGirl = config.body === 'girl'

  // Dynamic expression mapping
  const eyeMap: Record<string, { left: string; right: string; mouth: string; brow?: string }> = {
    neutral: {
      left: 'M36,44 a2.5,3 0 1,0 5,0 a2.5,3 0 1,0 -5,0',
      right: 'M55,44 a2.5,3 0 1,0 5,0 a2.5,3 0 1,0 -5,0',
      mouth: 'M42,60 Q48,64 54,60',
    },
    happy: {
      left: 'M36,44 Q38.5,41 41,44',
      right: 'M55,44 Q57.5,41 60,44',
      mouth: 'M39,58 Q48,67 57,58',
      brow: 'M34,38 Q38,35 42,37 M54,37 Q58,35 62,38',
    },
    focused: {
      left: 'M37,44 a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0',
      right: 'M56,44 a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0',
      mouth: 'M43,61 L53,61',
      brow: 'M34,38 L42,37 M54,37 L62,38',
    },
    celebrating: {
      left: 'M35,43 Q38.5,39 42,43',
      right: 'M54,43 Q57.5,39 61,43',
      mouth: 'M37,56 Q48,69 59,56',
      brow: 'M33,36 Q38,32 43,35 M53,35 Q58,32 63,36',
    },
    thinking: {
      left: 'M37,44 a2.5,3 0 1,0 4,0 a2.5,3 0 1,0 -4,0',
      right: 'M56,44 a2.5,3 0 1,0 4,0 a2.5,3 0 1,0 -4,0',
      mouth: 'M44,62 Q48,59 52,62',
      brow: 'M35,37 Q38,34 41,38 M55,37 Q58,35 61,37',
    },
    sleepy: {
      left: 'M37,44 Q39,43 41,44',
      right: 'M56,44 Q58,43 60,44',
      mouth: 'M44,61 Q48,63 52,61',
    },
  }

  const eyes = eyeMap[expr] || eyeMap.neutral

  // Blink state
  const blinkEyes = {
    left: 'M36,44 Q38.5,44 41,44',
    right: 'M55,44 Q57.5,44 60,44',
  }

  const currentEyes = blinkPhase && expr !== 'sleepy' && expr !== 'focused'
    ? blinkEyes
    : { left: eyes.left, right: eyes.right }

  // Hair paths with improved shapes
  const hairPaths: Record<string, string> = {
    short_01: 'M28,32 Q48,16 68,32 L68,38 Q58,28 48,28 Q38,28 28,38 Z',
    short_02: 'M26,34 Q48,12 70,34 L70,40 Q60,24 40,24 Q28,28 26,40 Z M64,24 Q72,20 70,32',
    medium_01: 'M26,30 Q48,10 70,30 L72,50 Q70,38 66,32 Q48,18 30,32 Q26,38 24,50 Z',
    long_01: 'M26,28 Q48,8 70,28 L72,65 Q70,46 68,36 Q48,16 28,36 Q26,46 24,65 Z',
    curly_01: 'M26,30 Q30,12 48,12 Q66,12 70,30 M24,36 Q22,28 28,22 M72,36 Q74,28 68,22 M26,40 Q22,38 24,44 M70,40 Q74,38 72,44',
    bun_01: 'M28,32 Q48,16 68,32 L68,38 Q58,28 28,38 Z M38,14 Q48,4 58,14 Q60,24 48,22 Q36,24 38,14',
  }

  // Outfit rendering
  const outfitPaths: Record<string, string> = {
    casual_01: 'M24,96 L24,75 Q24,64 35,60 L61,60 Q72,64 72,75 L72,96 Z',
    formal_01: 'M24,96 L24,75 Q24,64 35,60 L61,60 Q72,64 72,75 L72,96 Z',
    hoodie_01: 'M22,96 L22,72 Q22,62 34,58 L62,58 Q74,62 74,72 L74,96 Z',
    jacket_01: 'M24,96 L24,75 Q24,64 35,60 L61,60 Q72,64 72,75 L72,96 Z',
    athletic_01: 'M26,96 L26,75 Q26,64 36,60 L60,60 Q70,64 70,75 L70,96 Z',
    tuxedo: 'M24,96 L24,75 Q24,64 35,60 L61,60 Q72,64 72,75 L72,96 Z',
    superhero: 'M24,96 L24,75 Q24,64 35,60 L61,60 Q72,64 72,75 L72,96 Z',
    astronaut: 'M22,96 L22,72 Q22,62 34,58 L62,58 Q74,62 74,72 L74,96 Z',
  }

  // Animation class based on state
  const getAnimationClass = () => {
    if (reducedMotion || !animate) return ''
    switch (state) {
      case 'celebrating': return 'companion-bounce-anim'
      case 'waving': return 'companion-wave-anim'
      case 'greeting': return 'companion-bounce-anim'
      default: return 'companion-breathe-anim'
    }
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Ambient glow */}
      {showGlow && (
        <div
          className="absolute inset-0 rounded-full opacity-50"
          style={{
            background: 'radial-gradient(circle, rgba(212,168,83,0.12), transparent 70%)',
            transform: 'scale(1.5)',
          }}
        />
      )}

      <svg
        viewBox="0 0 96 96"
        width={size}
        height={size}
        className="select-none"
        role="img"
        aria-label="Your digital companion"
      >
        {/* Animation styles */}
        {animate && !reducedMotion && (
          <style>{`
            @keyframes cb { 0%,100%{transform:scale(1) translateY(0)} 50%{transform:scale(1.015) translateY(-3px)} }
            @keyframes cbounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
            @keyframes cwave { 0%,100%{transform:rotate(0)} 25%{transform:rotate(10deg)} 75%{transform:rotate(-6deg)} }
            .companion-breathe-anim { animation: cb 4s ease-in-out infinite; transform-origin: 48px 96px; }
            .companion-bounce-anim { animation: cbounce 0.6s ease-out 3; transform-origin: 48px 96px; }
            .companion-wave-anim { animation: cwave 0.8s ease-in-out 2; transform-origin: 48px 60px; }
          `}</style>
        )}

        {/* Platform/shadow */}
        {showPlatform && (
          <ellipse cx="48" cy="94" rx="22" ry="3" fill="rgba(0,0,0,0.08)" />
        )}

        <g className={getAnimationClass()}>
          {/* Body base */}
          {isGirl ? (
            <g id="girl-base">
              <path d="M30,96 L30,78 Q30,67 38,64 L58,64 Q66,67 66,78 L66,96 Z" fill={skin.base} />
              <rect x="44" y="52" width="8" height="14" rx="1" fill={skin.base} />
              <path d="M44,52 L52,52 L52,58 C52,62 44,62 44,58 Z" fill={skin.shadow} opacity="0.5" />
              <circle cx="27" cy="45" r="4.5" fill={skin.base} />
              <circle cx="69" cy="45" r="4.5" fill={skin.base} />
              <path d="M24,40 C24,17 72,17 72,40 C72,58 60,66 48,66 C36,66 24,58 24,40 Z" fill={skin.base} />
              <circle cx="34" cy="53" r="4" fill={skin.blush} opacity="0.35" />
              <circle cx="62" cy="53" r="4" fill={skin.blush} opacity="0.35" />
            </g>
          ) : (
            <g id="boy-base">
              <path d="M25,96 L25,75 Q25,64 35,60 L61,60 Q71,64 71,75 L71,96 Z" fill={skin.base} />
              <rect x="42" y="52" width="12" height="15" rx="1" fill={skin.base} />
              <path d="M42,52 L54,52 L54,58 C54,62 42,62 42,58 Z" fill={skin.shadow} opacity="0.5" />
              <circle cx="26" cy="46" r="5" fill={skin.base} />
              <circle cx="70" cy="46" r="5" fill={skin.base} />
              <path d="M22,42 C22,17 74,17 74,42 C74,62 62,68 48,68 C34,68 22,62 22,42 Z" fill={skin.base} />
            </g>
          )}

          {/* Hair */}
          <path
            d={hairPaths[config.hair] || hairPaths.short_01}
            fill={config.hairColor}
            opacity="0.95"
          />

          {/* Face - Eyebrows */}
          {eyes.brow && (
            <path d={eyes.brow} fill="none" stroke={config.hairColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
          )}

          {/* Face - Eyes */}
          <path d={currentEyes.left} fill="#1C1917" />
          <path d={currentEyes.right} fill="#1C1917" />

          {/* Eye highlights */}
          {!blinkPhase && expr !== 'sleepy' && (
            <g fill="#FFFFFF" opacity="0.85">
              <circle cx="38.5" cy="42.5" r="1.5" />
              <circle cx="57.5" cy="42.5" r="1.5" />
              <circle cx="39.5" cy="44.5" r="0.7" opacity="0.5" />
              <circle cx="58.5" cy="44.5" r="0.7" opacity="0.5" />
            </g>
          )}

          {/* Mouth */}
          <path d={eyes.mouth} fill="none" stroke="#1C1917" strokeWidth="1.5" strokeLinecap="round" />

          {/* Nose hint */}
          <path d="M47.5,50 Q48,52 48.5,50" fill="none" stroke={skin.shadow} strokeWidth="0.8" strokeLinecap="round" opacity="0.4" />

          {/* Glasses */}
          {config.glasses !== 'none' && (
            <g opacity="0.8">
              {config.glasses === 'round_01' && (
                <>
                  <circle cx="38.5" cy="44" r="7.5" fill="rgba(255,255,255,0.15)" stroke="#44403C" strokeWidth="1.3" />
                  <circle cx="57.5" cy="44" r="7.5" fill="rgba(255,255,255,0.15)" stroke="#44403C" strokeWidth="1.3" />
                  <line x1="46" y1="44" x2="50" y2="44" stroke="#44403C" strokeWidth="1.3" />
                </>
              )}
              {config.glasses === 'square_01' && (
                <>
                  <rect x="31" y="39" width="15" height="11" rx="2.5" fill="rgba(255,255,255,0.15)" stroke="#44403C" strokeWidth="1.3" />
                  <rect x="50" y="39" width="15" height="11" rx="2.5" fill="rgba(255,255,255,0.15)" stroke="#44403C" strokeWidth="1.3" />
                  <line x1="46" y1="44" x2="50" y2="44" stroke="#44403C" strokeWidth="1.3" />
                </>
              )}
              {config.glasses === 'aviator_01' && (
                <>
                  <path d="M31,43 Q31,37 38.5,37 Q46,37 46,43 Q46,50 38.5,50 Q31,50 31,43" fill="rgba(255,255,255,0.15)" stroke="#44403C" strokeWidth="1.3" />
                  <path d="M50,43 Q50,37 57.5,37 Q65,37 65,43 Q65,50 57.5,50 Q50,50 50,43" fill="rgba(255,255,255,0.15)" stroke="#44403C" strokeWidth="1.3" />
                  <line x1="46" y1="40" x2="50" y2="40" stroke="#44403C" strokeWidth="1.3" />
                </>
              )}
            </g>
          )}

          {/* Outfit */}
          <g id="outfit">
            {config.outfit === 'casual_01' && (
              <path d={outfitPaths.casual_01} fill={config.outfitColor} opacity="0.95" />
            )}
            {config.outfit === 'formal_01' && (
              <g>
                <path d={outfitPaths.formal_01} fill={config.outfitColor} />
                <path d="M40,60 L48,74 L56,60 Z" fill="#FFFFFF" />
                <path d="M46,67 L50,67 L52,86 L48,90 L44,86 Z" fill="#DC2626" opacity="0.9" />
                <path d="M35,60 L40,82 L46,60 Z" fill="rgba(0,0,0,0.12)" />
                <path d="M61,60 L56,82 L50,60 Z" fill="rgba(0,0,0,0.12)" />
              </g>
            )}
            {config.outfit === 'hoodie_01' && (
              <g>
                <path d={outfitPaths.hoodie_01} fill={config.outfitColor} />
                <path d="M34,58 Q48,68 62,58 Q48,52 34,58 Z" fill="rgba(0,0,0,0.15)" />
                <line x1="42" y1="64" x2="42" y2="74" stroke="#FBBF24" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="54" y1="64" x2="54" y2="74" stroke="#FBBF24" strokeWidth="1.8" strokeLinecap="round" />
              </g>
            )}
            {config.outfit === 'jacket_01' && (
              <g>
                <path d={outfitPaths.jacket_01} fill="#333333" />
                <path d="M38,60 L48,96 L58,60 Z" fill={config.outfitColor} />
                <line x1="48" y1="60" x2="48" y2="96" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
              </g>
            )}
            {config.outfit === 'athletic_01' && (
              <g>
                <path d={outfitPaths.athletic_01} fill={config.outfitColor} />
                <path d="M36,60 Q48,70 60,60 L60,96 L36,96 Z" fill="rgba(255,255,255,0.08)" />
                <path d="M32,64 L32,96 M64,64 L64,96" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="4 3" />
              </g>
            )}
            {config.outfit === 'tuxedo' && (
              <g>
                <path d={outfitPaths.tuxedo} fill="#1C1917" />
                <path d="M42,60 L48,78 L54,60 Z" fill="#FFFFFF" />
                <path d="M44,64 L48,66 L44,68 Z M52,64 L48,66 L52,68 Z" fill="#000000" />
                <circle cx="48" cy="66" r="1.5" fill="#000000" />
              </g>
            )}
            {config.outfit === 'superhero' && (
              <g>
                <path d={outfitPaths.superhero} fill="#2563EB" />
                <path d="M24,75 Q14,85 20,96 L24,96 Z" fill="#DC2626" opacity="0.9" />
                <path d="M72,75 Q82,85 76,96 L72,96 Z" fill="#DC2626" opacity="0.9" />
                <polygon points="48,68 43,75 48,83 53,75" fill="#FBBF24" />
              </g>
            )}
            {config.outfit === 'astronaut' && (
              <g>
                <path d={outfitPaths.astronaut} fill="#F4F4F5" stroke="#D4D4D8" strokeWidth="1.5" />
                <rect x="36" y="68" width="24" height="16" rx="3" fill="#E4E4E7" stroke="#A1A1AA" strokeWidth="0.8" />
                <circle cx="41" cy="73" r="2" fill="#3B82F6" />
                <circle cx="47" cy="73" r="2" fill="#EF4444" />
                <rect x="52" y="71" width="5" height="4" rx="1" fill="#10B981" />
              </g>
            )}
          </g>

          {/* Accessory - Headphones */}
          {config.accessory === 'headphones_01' && (
            <g opacity="0.85">
              <path d="M24,40 Q24,18 48,18 Q72,18 72,40" fill="none" stroke="#44403C" strokeWidth="2.5" />
              <rect x="20" y="34" width="7" height="13" rx="3.5" fill="#44403C" />
              <rect x="69" y="34" width="7" height="13" rx="3.5" fill="#44403C" />
              <rect x="21" y="37" width="5" height="7" rx="2.5" fill="#D4A853" opacity="0.6" />
              <rect x="70" y="37" width="5" height="7" rx="2.5" fill="#D4A853" opacity="0.6" />
            </g>
          )}

          {/* Accessory - Cap */}
          {config.accessory === 'hat_01' && (
            <g>
              <path d="M26,30 L70,30 L66,18 Q48,10 30,18 Z" fill="#44403C" />
              <rect x="20" y="28" width="56" height="5" rx="2.5" fill="#1C1917" />
              <rect x="20" y="28" width="30" height="5" rx="2.5" fill="#D4A853" opacity="0.3" />
            </g>
          )}

          {/* Accessory - Watch */}
          {config.accessory === 'watch_01' && (
            <g>
              <rect x="23" y="82" width="6" height="4" rx="1.5" fill="#D4A853" stroke="#B8860B" strokeWidth="0.5" />
              <rect x="24.5" y="83" width="3" height="2" rx="0.5" fill="#1C1917" />
            </g>
          )}

          {/* Accessory - Backpack (subtle hint behind body) */}
          {config.accessory === 'bag_01' && (
            <g opacity="0.7">
              <rect x="18" y="65" width="8" height="14" rx="3" fill="#92400E" />
              <rect x="70" y="65" width="8" height="14" rx="3" fill="#92400E" />
              <path d="M22,65 Q22,58 26,58 M74,65 Q74,58 70,58" fill="none" stroke="#92400E" strokeWidth="1.5" />
            </g>
          )}
        </g>
      </svg>
    </div>
  )
}
