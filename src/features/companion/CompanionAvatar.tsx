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
        {/* Base Body - Chibi style with neck and shoulders */}
        {config.body === 'boy' ? (
          <g id="boy-base">
            {/* Shoulders / Torso */}
            <path d="M25,96 L25,75 Q25,65 35,62 L61,62 Q71,65 71,75 L71,96 Z" fill="#E8C39E" />
            {/* Neck */}
            <rect x="42" y="52" width="12" height="15" fill="#E8C39E" />
            <path d="M42,52 L54,52 L54,58 C54,62 42,62 42,58 Z" fill="#D3A982" opacity="0.6" />
            {/* Ears */}
            <circle cx="26" cy="46" r="5" fill="#E8C39E" />
            <circle cx="70" cy="46" r="5" fill="#E8C39E" />
            {/* Head */}
            <path d="M22,42 C22,18 74,18 74,42 C74,62 62,68 48,68 C34,68 22,62 22,42 Z" fill="#F5D0A9" />
          </g>
        ) : (
          <g id="girl-base">
            {/* Shoulders / Torso */}
            <path d="M30,96 L30,78 Q30,68 38,65 L58,65 Q66,68 66,78 L66,96 Z" fill="#E8C39E" />
            {/* Neck */}
            <rect x="44" y="52" width="8" height="14" fill="#E8C39E" />
            <path d="M44,52 L52,52 L52,58 C52,62 44,62 44,58 Z" fill="#D3A982" opacity="0.6" />
            {/* Ears */}
            <circle cx="27" cy="45" r="4.5" fill="#E8C39E" />
            <circle cx="69" cy="45" r="4.5" fill="#E8C39E" />
            {/* Head */}
            <path d="M24,40 C24,18 72,18 72,40 C72,58 60,66 48,66 C36,66 24,58 24,40 Z" fill="#F5D0A9" />
            {/* Blush */}
            <circle cx="34" cy="52" r="3.5" fill="#FF9999" opacity="0.5" />
            <circle cx="62" cy="52" r="3.5" fill="#FF9999" opacity="0.5" />
          </g>
        )}

        {/* Hair */}
        <path d={hairPaths[config.hair] || hairPaths.short_01} fill={config.hairColor} opacity="0.95" />

        {/* Eyes */}
        <path d={eyes.left} fill="#1C1917" />
        <path d={eyes.right} fill="#1C1917" />
        
        {/* Eye Highlights */}
        {expr !== 'focused' && expr !== 'thinking' && (
           <g fill="#FFFFFF" opacity="0.8">
             <circle cx="38" cy="42" r="1.5" />
             <circle cx="58" cy="42" r="1.5" />
           </g>
        )}

        {/* Mouth */}
        <path d={eyes.mouth} fill="none" stroke="#1C1917" strokeWidth="1.5" strokeLinecap="round" />

        {/* Glasses */}
        {config.glasses !== 'none' && (
          <g opacity="0.8">
            {config.glasses === 'round_01' && (
              <>
                <circle cx="38" cy="44" r="7" fill="rgba(255,255,255,0.2)" stroke="#1C1917" strokeWidth="1.5" />
                <circle cx="58" cy="44" r="7" fill="rgba(255,255,255,0.2)" stroke="#1C1917" strokeWidth="1.5" />
                <line x1="45" y1="44" x2="51" y2="44" stroke="#1C1917" strokeWidth="1.5" />
              </>
            )}
            {config.glasses === 'square_01' && (
              <>
                <rect x="31" y="39" width="14" height="10" rx="2" fill="rgba(255,255,255,0.2)" stroke="#1C1917" strokeWidth="1.5" />
                <rect x="51" y="39" width="14" height="10" rx="2" fill="rgba(255,255,255,0.2)" stroke="#1C1917" strokeWidth="1.5" />
                <line x1="45" y1="44" x2="51" y2="44" stroke="#1C1917" strokeWidth="1.5" />
              </>
            )}
            {config.glasses === 'aviator_01' && (
              <>
                <path d="M31,42 Q31,37 38,37 Q45,37 45,42 Q45,49 38,49 Q31,49 31,42" fill="rgba(255,255,255,0.2)" stroke="#1C1917" strokeWidth="1.5" />
                <path d="M51,42 Q51,37 58,37 Q65,37 65,42 Q65,49 58,49 Q51,49 51,42" fill="rgba(255,255,255,0.2)" stroke="#1C1917" strokeWidth="1.5" />
                <line x1="45" y1="40" x2="51" y2="40" stroke="#1C1917" strokeWidth="1.5" />
              </>
            )}
          </g>
        )}

        {/* Outfit */}
        <g id="outfit">
          {config.outfit === 'casual_01' && (
             <path d="M25,96 L25,75 Q25,65 35,62 L61,62 Q71,65 71,75 L71,96 Z" fill={config.outfitColor} opacity="0.95" />
          )}
          {config.outfit === 'formal_01' && (
             <g>
               <path d="M25,96 L25,75 Q25,65 35,62 L61,62 Q71,65 71,75 L71,96 Z" fill={config.outfitColor} />
               {/* Shirt */}
               <path d="M40,62 L48,74 L56,62 Z" fill="#FFFFFF" />
               {/* Tie */}
               <path d="M46,68 L50,68 L52,86 L48,90 L44,86 Z" fill="#DC2626" />
               {/* Lapels */}
               <path d="M35,62 L40,84 L46,62 Z" fill="rgba(0,0,0,0.15)" />
               <path d="M61,62 L56,84 L50,62 Z" fill="rgba(0,0,0,0.15)" />
             </g>
          )}
          {config.outfit === 'hoodie_01' && (
             <g>
               <path d="M23,96 L23,73 Q23,63 35,60 L61,60 Q73,63 73,73 L73,96 Z" fill={config.outfitColor} />
               <path d="M35,60 Q48,68 61,60 Q48,54 35,60 Z" fill="rgba(0,0,0,0.2)" />
               <line x1="42" y1="65" x2="42" y2="75" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
               <line x1="54" y1="65" x2="54" y2="75" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
               <path d="M30,85 Q48,75 66,85 L66,96 L30,96 Z" fill="rgba(0,0,0,0.1)" />
             </g>
          )}
          {config.outfit === 'jacket_01' && (
             <g>
               <path d="M25,96 L25,75 Q25,65 35,62 L61,62 Q71,65 71,75 L71,96 Z" fill="#333333" />
               <path d="M38,62 L48,96 L58,62 Z" fill={config.outfitColor} />
               <line x1="48" y1="62" x2="48" y2="96" stroke="rgba(0,0,0,0.2)" strokeWidth="2" />
               <rect x="30" y="80" width="6" height="8" rx="1" fill="rgba(255,255,255,0.1)" />
               <rect x="60" y="80" width="6" height="8" rx="1" fill="rgba(255,255,255,0.1)" />
             </g>
          )}
          {config.outfit === 'athletic_01' && (
             <g>
               <path d="M27,96 L27,75 Q27,65 35,62 L61,62 Q69,65 69,75 L69,96 Z" fill={config.outfitColor} />
               <path d="M35,62 Q48,72 61,62 L61,96 L35,96 Z" fill="rgba(255,255,255,0.1)" />
               <path d="M32,65 L32,96 M64,65 L64,96" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="4 4" />
             </g>
          )}
          {config.outfit === 'tuxedo' && (
             <g>
               <path d="M25,96 L25,75 Q25,65 35,62 L61,62 Q71,65 71,75 L71,96 Z" fill="#1C1917" />
               {/* Shirt */}
               <path d="M42,62 L48,80 L54,62 Z" fill="#FFFFFF" />
               {/* Bowtie */}
               <path d="M44,66 L48,68 L44,70 Z M52,66 L48,68 L52,70 Z" fill="#000000" />
               <circle cx="48" cy="68" r="1.5" fill="#000000" />
               {/* Lapels */}
               <path d="M35,62 L42,75 L46,62 Z" fill="#333333" />
               <path d="M61,62 L54,75 L50,62 Z" fill="#333333" />
             </g>
          )}
          {config.outfit === 'superhero' && (
             <g>
               <path d="M25,96 L25,75 Q25,65 35,62 L61,62 Q71,65 71,75 L71,96 Z" fill="#2563EB" />
               {/* Cape */}
               <path d="M25,75 Q15,85 20,96 L25,96 Z" fill="#DC2626" />
               <path d="M71,75 Q81,85 76,96 L71,96 Z" fill="#DC2626" />
               {/* Chest Logo */}
               <polygon points="48,70 43,76 48,84 53,76" fill="#FBBF24" />
               <path d="M46,74 L50,74 L48,80 Z" fill="#DC2626" />
               {/* Belt */}
               <rect x="25" y="90" width="46" height="6" fill="#FBBF24" />
             </g>
          )}
          {config.outfit === 'astronaut' && (
             <g>
               <path d="M23,96 L23,73 Q23,63 35,60 L61,60 Q73,63 73,73 L73,96 Z" fill="#FFFFFF" stroke="#D4D4D8" strokeWidth="2" />
               {/* Suit details */}
               <rect x="35" y="70" width="26" height="18" rx="2" fill="#F4F4F5" stroke="#A1A1AA" strokeWidth="1" />
               <circle cx="40" cy="75" r="2" fill="#3B82F6" />
               <circle cx="45" cy="75" r="2" fill="#EF4444" />
               <rect x="52" y="73" width="6" height="4" fill="#10B981" />
               <line x1="35" y1="80" x2="61" y2="80" stroke="#A1A1AA" strokeWidth="1" />
               {/* Hose */}
               <path d="M30,80 Q25,85 30,90" fill="none" stroke="#71717A" strokeWidth="2" />
             </g>
          )}
        </g>

        {/* Accessory - Headphones */}
        {config.accessory === 'headphones_01' && (
          <g opacity="0.85">
            <path d="M24,40 Q24,20 48,20 Q72,20 72,40" fill="none" stroke="#44403C" strokeWidth="3" />
            <rect x="20" y="34" width="8" height="14" rx="4" fill="#44403C" />
            <rect x="68" y="34" width="8" height="14" rx="4" fill="#44403C" />
          </g>
        )}

        {/* Accessory - Hat */}
        {config.accessory === 'hat_01' && (
          <g>
            <path d="M26,30 L70,30 L66,20 Q48,12 30,20 Z" fill="#44403C" />
            <rect x="20" y="28" width="56" height="5" rx="2.5" fill="#1C1917" />
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
