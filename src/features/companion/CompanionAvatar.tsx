'use client'

import Image from 'next/image'
import { useCharacterStore } from '@/store/characterStore'

interface CompanionAvatarProps {
  size?: number
  className?: string
  expression?: string
  animate?: boolean
}

/**
 * Image-based digital companion that renders based on character configuration.
 */
export function CompanionAvatar({
  size = 120,
  className = '',
  expression: expressionOverride,
  animate = true,
}: CompanionAvatarProps) {
  const config = useCharacterStore((s) => s.config)

  if (!config.isCompanionEnabled) return null

  const reducedMotion = config.isReducedMotion

  // Map the body and outfit to the specific image
  let imagePath = '/avatars/boy_casual.jpg'
  if (config.body === 'girl') {
    imagePath = config.outfit === 'suit' ? '/avatars/girl_suit.jpg' : '/avatars/girl_casual.jpg'
  } else {
    imagePath = config.outfit === 'suit' ? '/avatars/boy_suit.jpg' : '/avatars/boy_casual.jpg'
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative rounded-full overflow-hidden border-2 border-border/40 shadow-sm ${className}`}
    >
      {animate && !reducedMotion && (
        <style>{`
          @keyframes companion-float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-3px); }
          }
          .companion-body { animation: companion-float 3s ease-in-out infinite; }
        `}</style>
      )}

      <div className={`w-full h-full ${animate && !reducedMotion ? 'companion-body' : ''}`}>
        <Image
          src={imagePath}
          alt="Your digital companion"
          fill
          className="object-cover pointer-events-none select-none"
          sizes={`${size}px`}
          priority
        />
      </div>
    </div>
  )
}
