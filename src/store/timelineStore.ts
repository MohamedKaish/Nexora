import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { LocalTimetableSlot } from '@/types/local'

interface TimelineState {
  slots: LocalTimetableSlot[]
  addSlot: (slot: Omit<LocalTimetableSlot, 'id' | 'createdAt' | 'updatedAt'>) => void
  removeSlot: (id: string) => void
  updateSlot: (id: string, partial: Partial<LocalTimetableSlot>) => void
}

const INITIAL_SLOTS: LocalTimetableSlot[] = []

export const useTimelineStore = create<TimelineState>()(
  persist(
    (set) => ({
      slots: INITIAL_SLOTS,
      addSlot: (params) => {
        const newSlot: LocalTimetableSlot = {
          ...params,
          id: 'slot_' + Math.random().toString(36).substring(2, 9),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({ slots: [...state.slots, newSlot] }))
      },
      removeSlot: (id) =>
        set((state) => ({ slots: state.slots.filter((s) => s.id !== id) })),
      updateSlot: (id, partial) =>
        set((state) => ({
          slots: state.slots.map((s) =>
            s.id === id ? { ...s, ...partial, updatedAt: new Date().toISOString() } : s
          ),
        })),
    }),
    { name: 'nexora_timeline_storage' }
  )
)
