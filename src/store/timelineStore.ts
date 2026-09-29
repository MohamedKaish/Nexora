import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TimelineBlock } from '@/types/timeline'
import { eventBus } from '@/features/kyro/events/EventBus'

interface TimelineState {
  blocks: TimelineBlock[]
  currentDate: Date
  view: 'day' | 'week' | 'month'
  setBlocks: (blocks: TimelineBlock[]) => void
  addBlock: (block: TimelineBlock) => void
  updateBlock: (id: string, updates: Partial<TimelineBlock>) => void
  removeBlock: (id: string) => void
  setCurrentDate: (date: Date) => void
  setView: (view: 'day' | 'week' | 'month') => void
}

export const useTimelineStore = create<TimelineState>()(
  persist(
    (set) => ({
      blocks: [],
      currentDate: new Date(),
      view: 'week',
      setBlocks: (blocks) => set({ blocks }),
      addBlock: (block) => set((state) => {
        const newBlocks = [...state.blocks, block]
        eventBus.publish('KyroReflowRequested')
        return { blocks: newBlocks }
      }),
      updateBlock: (id, updates) => set((state) => {
        const newBlocks = state.blocks.map(b => b.id === id ? { ...b, ...updates } as TimelineBlock : b)
        eventBus.publish('KyroReflowRequested')
        return { blocks: newBlocks }
      }),
      removeBlock: (id) => set((state) => {
        const newBlocks = state.blocks.filter(b => b.id !== id)
        eventBus.publish('KyroReflowRequested')
        return { blocks: newBlocks }
      }),
      setCurrentDate: (date) => set({ currentDate: date }),
      setView: (view) => set({ view }),
    }),
    {
      name: 'nexora_guest_timeline',
      partialize: (state) => ({ blocks: state.blocks }),
    }
  )
)
