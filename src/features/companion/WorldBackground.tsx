'use client'

import React, { useEffect, useRef } from 'react'
import { useCharacterStore } from '@/store/characterStore'

export function WorldBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isReducedMotion = useCharacterStore((s) => s.config.isReducedMotion)

  useEffect(() => {
    if (isReducedMotion) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    // Minimalistic atmospheric cosmic dust particles
    const PARTICLE_COUNT = 18
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.35 + 0.1,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -Math.random() * 0.3 - 0.1,
    }))

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy

        if (p.y < 0) {
          p.y = height
          p.x = Math.random() * width
        }
        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(212, 168, 83, ${p.alpha})`
        ctx.fill()
      })

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [isReducedMotion])

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* Environmental cosmic/sanctuary adaptive gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#F8F6F3] via-[#FAF8F5] to-[#EFECE6] dark:from-stone-950 dark:via-[#0C0A09] dark:to-[#120F0D] transition-colors duration-500" />

      {/* Atmospheric lighting accents */}
      <div
        className="absolute top-[-10%] left-[20%] w-[650px] h-[650px] rounded-full blur-[130px] opacity-20 dark:opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #D4A853 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-[-10%] right-[15%] w-[600px] h-[600px] rounded-full blur-[140px] opacity-15 dark:opacity-12 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #3B82F6 0%, transparent 70%)' }}
      />

      {/* Particle Canvas */}
      {!isReducedMotion && <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60" />}
    </div>
  )
}
