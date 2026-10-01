'use client'

import { useEffect, useRef } from 'react'
import { useCharacterStore } from '@/store/characterStore'

interface WorldBackgroundProps {
  variant?: 'default' | 'focus' | 'dashboard' | 'calm'
  children?: React.ReactNode
}

/**
 * Atmospheric animated background for the Nexora World.
 * Renders floating particles and soft gradients via canvas.
 * Respects reduced motion preferences.
 */
export function WorldBackground({ variant = 'default', children }: WorldBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reducedMotion = useCharacterStore((s) => s.config.isReducedMotion)
  const animRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || reducedMotion) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Particle system
    interface Particle {
      x: number
      y: number
      vx: number
      vy: number
      size: number
      opacity: number
      maxOpacity: number
      phase: number
      speed: number
    }

    const particleCount = variant === 'focus' ? 12 : variant === 'dashboard' ? 20 : 15
    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.2 - 0.1,
      size: Math.random() * 2.5 + 0.5,
      opacity: 0,
      maxOpacity: Math.random() * 0.15 + 0.05,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.008 + 0.003,
    }))

    const colors = variant === 'focus'
      ? ['rgba(96,165,250,', 'rgba(167,139,250,', 'rgba(212,168,83,']
      : variant === 'calm'
      ? ['rgba(52,211,153,', 'rgba(96,165,250,', 'rgba(212,168,83,']
      : ['rgba(212,168,83,', 'rgba(96,165,250,', 'rgba(167,139,250,']

    let time = 0

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      time += 0.01

      particles.forEach((p, i) => {
        p.phase += p.speed
        p.opacity = p.maxOpacity * (0.5 + 0.5 * Math.sin(p.phase))
        p.x += p.vx + Math.sin(time + i) * 0.1
        p.y += p.vy + Math.cos(time + i * 0.7) * 0.05

        // Wrap around
        if (p.x < -10) p.x = canvas.width + 10
        if (p.x > canvas.width + 10) p.x = -10
        if (p.y < -10) p.y = canvas.height + 10
        if (p.y > canvas.height + 10) p.y = -10

        const color = colors[i % colors.length]
        
        // Glow
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 8)
        gradient.addColorStop(0, `${color}${p.opacity})`)
        gradient.addColorStop(1, `${color}0)`)
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 8, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        // Core
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `${color}${Math.min(p.opacity * 2, 0.3)})`
        ctx.fill()
      })

      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [reducedMotion, variant])

  return (
    <div className="relative min-h-screen">
      {/* Static gradient background */}
      <div className="fixed inset-0 world-bg -z-20" />
      
      {/* Animated particle canvas */}
      {!reducedMotion && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 -z-10 pointer-events-none"
          style={{ opacity: 0.6 }}
        />
      )}

      {children}
    </div>
  )
}
