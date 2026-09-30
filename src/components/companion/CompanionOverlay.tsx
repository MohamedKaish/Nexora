'use client'

import { useState, useEffect } from 'react'
import { CompanionCanvas } from '../canvas/CompanionCanvas'
import { useCompanionStore } from '@/store/companionStore'
import { useCompanionDialogue } from '@/hooks/useCompanionDialogue'
import { Button } from '@/components/ui/button'
import { Maximize2, Minimize2, MessageSquare, X } from 'lucide-react'
import { WardrobeModal } from '../customizer/WardrobeModal'
import { useTaskStore } from '@/store/useTaskStore'
import { useRouter } from 'next/navigation'

export function CompanionOverlay() {
  const [mounted, setMounted] = useState(false)
  const { isExpanded, setIsExpanded } = useCompanionStore()
  const { currentDialogue, greet, promptBreak } = useCompanionDialogue()
  const tasks = useTaskStore(s => s.tasks)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    // Initial greeting after a short delay
    setTimeout(() => {
      greet()
    }, 1500)

    // Activity awareness simulation (random breaks)
    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        promptBreak()
      }
    }, 60000 * 30) // check every 30 mins

    return () => clearInterval(interval)
  }, [greet, promptBreak])

  if (!mounted) return null

  return (
    <div 
      className={`fixed bottom-4 right-4 z-50 transition-all duration-500 ease-in-out ${
        isExpanded ? 'w-[400px] h-[500px]' : 'w-[200px] h-[250px]'
      }`}
    >
      {/* Dialogue Bubble */}
      {currentDialogue && (
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl p-4 shadow-xl animate-in slide-in-from-bottom-4 fade-in duration-300 z-10">
          <p className="text-sm font-medium text-foreground">{currentDialogue}</p>
          
          {/* Quick Actions */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 custom-scrollbar">
            <Button size="sm" variant="secondary" className="text-[10px] h-6 rounded-full px-2" onClick={() => router.push('/focus')}>
              Take a break
            </Button>
            <Button size="sm" variant="secondary" className="text-[10px] h-6 rounded-full px-2" onClick={() => router.push('/tasks')}>
              {tasks.length} Tasks
            </Button>
          </div>
          
          {/* Bubble Tail */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-background border-b border-r border-border/50 rotate-45 transform" />
        </div>
      )}

      {/* Main Container */}
      <div className="w-full h-full bg-secondary/10 backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative group">
        {/* Controls Overlay (visible on hover) */}
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <WardrobeModal />
          <Button
            variant="secondary"
            size="icon"
            className="w-8 h-8 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur-sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>

        {/* 3D Canvas */}
        <div className="w-full h-full pointer-events-auto">
          <CompanionCanvas />
        </div>
      </div>
    </div>
  )
}
