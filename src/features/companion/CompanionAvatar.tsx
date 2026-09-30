'use client'

import { useCharacterStore } from '@/store/characterStore'

interface CompanionAvatarProps {
  size?: number
  className?: string
  expression?: string
  animate?: boolean
}

/**
 * SVG-based digital companion that renders based on character configuration.
 * Uses modular layers for body, hair, outfit, accessories, glasses.
 */
export function CompanionAvatar({
  size = 120,
  className = '',
  expression: expressionOverride,
  animate = true,
}: CompanionAvatarProps) {
  const config = useCharacterStore((s) => s.config)

  if (!config.isCompanionEnabled) return null

  const expr = expressionOverride || config.expression
  const reducedMotion = config.isReducedMotion

  // Eye expression mapping
  const eyeMap: Record<string, { left: string; right: string; mouth: string }> = {
    neutral: { left: 'M36,44 a2,2.5 0 1,0 4,0 a2,2.5 0 1,0 -4,0', right: 'M56,44 a2,2.5 0 1,0 4,0 a2,2.5 0 1,0 -4,0', mouth: 'M42,60 Q48,64 54,60' },
    happy: { left: 'M36,44 Q38,42 40,44', right: 'M56,44 Q58,42 60,44', mouth: 'M40,58 Q48,66 56,58' },
    focused: { left: 'M36,44 a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0', right: 'M56,44 a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0', mouth: 'M43,61 L53,61' },
    celebrating: { left: 'M35,43 Q38,40 41,43', right: 'M55,43 Q58,40 61,43', mouth: 'M38,57 Q48,68 58,57' },
    thinking: { left: 'M36,44 a2,2.5 0 1,0 4,0 a2,2.5 0 1,0 -4,0', right: 'M56,44 a2,2.5 0 1,0 4,0 a2,2.5 0 1,0 -4,0', mouth: 'M44,61 Q48,59 52,62' },
  }

  const eyes = eyeMap[expr] || eyeMap.neutral

  // Hair style paths
  const hairPaths: Record<string, string> = {
    short_01: 'M30,30 Q48,18 66,30 L66,36 Q48,28 30,36 Z',
    short_02: 'M28,32 Q48,14 68,32 L68,38 Q58,26 38,26 Q28,26 28,32 Z M62,26 Q70,22 68,32',
    medium_01: 'M28,30 Q48,12 68,30 L70,46 Q68,36 64,32 Q48,22 32,32 Q28,36 26,46 Z',
    long_01: 'M28,28 Q48,10 68,28 L70,60 Q68,44 66,36 Q48,20 30,36 Q28,44 26,60 Z',
    curly_01: 'M28,30 Q32,14 48,14 Q64,14 68,30 M26,34 Q24,28 30,24 M70,34 Q72,28 66,24 M28,38 Q24,36 26,42 M68,38 Q72,36 70,42',
    bun_01: 'M30,30 Q48,18 66,30 L66,36 Q48,28 30,36 Z M40,16 Q48,6 56,16 Q58,24 48,22 Q38,24 40,16',
  }

  // Outfit paths
  const outfitPaths: Record<string, string> = {
    casual_01: 'M32,68 L28,96 L68,96 L64,68 Q48,72 32,68 Z',
    formal_01: 'M30,68 L26,96 L70,96 L66,68 Q48,72 30,68 Z M48,68 L48,96 M44,72 L40,76 M52,72 L56,76',
    hoodie_01: 'M30,66 L26,96 L70,96 L66,66 Q48,72 30,66 Z M38,66 Q42,62 48,62 Q54,62 58,66',
    jacket_01: 'M30,68 L26,96 L70,96 L66,68 Q48,72 30,68 Z M48,68 L48,92 M36,74 L36,90 M60,74 L60,90',
    athletic_01: 'M32,68 L30,96 L66,96 L64,68 Q48,72 32,68 Z M38,80 L58,80',
  }

  return (
    <svg
      viewBox="0 0 96 96"
      width={size}
      height={size}
      className={`${className} select-none`}
      role="img"
      aria-label="Your digital companion"
    >
      {/* Idle float animation */}
      {animate && !reducedMotion && (
        <style>{`
          @keyframes companion-float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-3px); }
          }
          .companion-body { animation: companion-float 3s ease-in-out infinite; }
        `}</style>
      )}

      <g className={animate && !reducedMotion ? 'companion-body' : ''}>
        {/* Body/Head - Simple rounded shape */}
        <ellipse cx="48" cy="52" rx="22" ry="26" fill="#F5E6D3" stroke="#E8D5C4" strokeWidth="1" />

        {/* Hair */}
        <path d={hairPaths[config.hair] || hairPaths.short_01} fill={config.hairColor} opacity="0.95" />

        {/* Eyes */}
        <path d={eyes.left} fill="#1C1917" />
        <path d={eyes.right} fill="#1C1917" />

        {/* Mouth */}
        <path d={eyes.mouth} fill="none" stroke="#1C1917" strokeWidth="1.5" strokeLinecap="round" />

        {/* Glasses */}
        {config.glasses !== 'none' && (
          <g opacity="0.8">
            {config.glasses === 'round_01' && (
              <>
                <circle cx="38" cy="44" r="6" fill="none" stroke="#1C1917" strokeWidth="1.2" />
                <circle cx="58" cy="44" r="6" fill="none" stroke="#1C1917" strokeWidth="1.2" />
                <line x1="44" y1="44" x2="52" y2="44" stroke="#1C1917" strokeWidth="1" />
              </>
            )}
            {config.glasses === 'square_01' && (
              <>
                <rect x="32" y="40" width="12" height="8" rx="1" fill="none" stroke="#1C1917" strokeWidth="1.2" />
                <rect x="52" y="40" width="12" height="8" rx="1" fill="none" stroke="#1C1917" strokeWidth="1.2" />
                <line x1="44" y1="44" x2="52" y2="44" stroke="#1C1917" strokeWidth="1" />
              </>
            )}
            {config.glasses === 'aviator_01' && (
              <>
                <path d="M32,42 Q32,38 38,38 Q44,38 44,42 Q44,48 38,48 Q32,48 32,42" fill="none" stroke="#1C1917" strokeWidth="1.2" />
                <path d="M52,42 Q52,38 58,38 Q64,38 64,42 Q64,48 58,48 Q52,48 52,42" fill="none" stroke="#1C1917" strokeWidth="1.2" />
                <line x1="44" y1="42" x2="52" y2="42" stroke="#1C1917" strokeWidth="1" />
              </>
            )}
          </g>
        )}

        {/* Outfit */}
        <path d={outfitPaths[config.outfit] || outfitPaths.casual_01} fill={config.outfitColor} opacity="0.9" />

        {/* Accessory - Headphones */}
        {config.accessory === 'headphones_01' && (
          <g opacity="0.85">
            <path d="M26,40 Q26,24 48,24 Q70,24 70,40" fill="none" stroke="#44403C" strokeWidth="2.5" />
            <rect x="24" y="38" width="6" height="10" rx="3" fill="#44403C" />
            <rect x="66" y="38" width="6" height="10" rx="3" fill="#44403C" />
          </g>
        )}

        {/* Accessory - Hat */}
        {config.accessory === 'hat_01' && (
          <g>
            <path d="M28,30 L68,30 L64,22 Q48,16 32,22 Z" fill="#44403C" />
            <rect x="24" y="28" width="48" height="4" rx="2" fill="#44403C" />
          </g>
        )}

        {/* Accessory - Watch */}
        {config.accessory === 'watch_01' && (
          <g>
            <rect x="24" y="82" width="6" height="4" rx="1" fill="#D4AF37" stroke="#B8860B" strokeWidth="0.5" />
          </g>
        )}
      </g>
    </svg>
  )
}
