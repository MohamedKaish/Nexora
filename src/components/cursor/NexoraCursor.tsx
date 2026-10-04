'use client'

import React, { useEffect, useRef, useState } from 'react'

export function NexoraCursor() {
  const dotRef = useRef<HTMLDivElement | null>(null)
  const ringRef = useRef<HTMLDivElement | null>(null)

  const [isVisible, setIsVisible] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  const [isFinePointer, setIsFinePointer] = useState(false)

  useEffect(() => {
    // Only enable custom cursor on fine pointer devices (Mouse / Trackpad on PC/Mac)
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(pointer: fine)')
    if (!mediaQuery.matches) {
      return // Touchscreen/Mobile - do nothing
    }

    setIsFinePointer(true)

    let mouseX = -100
    let mouseY = -100
    let ringX = -100
    let ringY = -100
    let animId: number

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY

      if (!isVisible) setIsVisible(true)

      // Direct instant position for the center dot
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`
      }

      // Check if hovering interactive element
      const target = e.target as HTMLElement | null
      if (target) {
        const isInteractive = Boolean(
          target.closest('button') ||
          target.closest('a') ||
          target.closest('input') ||
          target.closest('select') ||
          target.closest('textarea') ||
          target.closest('[role="button"]') ||
          target.closest('.cursor-pointer') ||
          target.closest('.interactive')
        )
        setIsHovering(isInteractive)
      }
    }

    const handleMouseDown = () => setIsClicking(true)
    const handleMouseUp = () => setIsClicking(false)

    const handleMouseLeave = () => {
      setIsVisible(false)
    }

    const handleMouseEnter = () => {
      setIsVisible(true)
    }

    // Smooth physics loop for the trailing halo
    const loop = () => {
      // Linear interpolation (lerp)
      const ease = 0.22
      ringX += (mouseX - ringX) * ease
      ringY += (mouseY - ringY) * ease

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`
      }

      animId = requestAnimationFrame(loop)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('mouseenter', handleMouseEnter)

    animId = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('mouseenter', handleMouseEnter)
      cancelAnimationFrame(animId)
    }
  }, [isVisible])

  if (!isFinePointer || !isVisible) return null

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Trailing Ambient Halo / Ring */}
      <div
        ref={ringRef}
        className={`fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 rounded-full transition-[width,height,border-color,background-color,opacity] duration-200 ease-out will-change-transform flex items-center justify-center ${
          isClicking
            ? 'w-10 h-10 border-2 border-amber-300 bg-amber-400/20 shadow-[0_0_20px_rgba(212,168,83,0.6)]'
            : isHovering
            ? 'w-12 h-12 border border-amber-400/80 bg-amber-400/10 shadow-[0_0_16px_rgba(212,168,83,0.35)] backdrop-blur-[1px]'
            : 'w-7 h-7 border border-amber-400/40 bg-transparent shadow-[0_0_8px_rgba(212,168,83,0.15)]'
        }`}
      >
        {/* Subtle internal reticle crosshairs on hover */}
        {isHovering && (
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/80 animate-ping" />
        )}
      </div>

      {/* Instant Precision Core Dot */}
      <div
        ref={dotRef}
        className={`fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 rounded-full transition-[width,height,background-color] duration-150 ease-out will-change-transform ${
          isHovering
            ? 'w-1.5 h-1.5 bg-cyan-300 shadow-[0_0_8px_#38BDF8]'
            : 'w-2 h-2 bg-amber-400 shadow-[0_0_6px_#D4A853]'
        }`}
      />
    </div>
  )
}
