import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { LocalTimetableSlot } from '@/types/local'

interface TimelineState {
  slots: LocalTimetableSlot[]
  addSlot: (slot: Omit<LocalTimetableSlot, 'id' | 'createdAt' | 'updatedAt'>) => void
  removeSlot: (id: string) => void
  updateSlot: (id: string, partial: Partial<LocalTimetableSlot>) => void
}

const INITIAL_SLOTS: LocalTimetableSlot[] = [
  {
    id: 'slot-1',
    dayOfWeek: 1, // Monday
    startTime: '09:00',
    endTime: '11:30',
    title: 'Core Architecture & Deep Focus',
    category: 'Work',
    color: '#60A5FA',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'slot-2',
    dayOfWeek: 1,
    startTime: '14:00',
    endTime: '15:30',
    title: 'Research & Life Planning',
    category: 'Study',
    color: '#A78BFA',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'slot-3',
    dayOfWeek: 2, // Tuesday
    startTime: '08:30',
    endTime: '10:00',
    title: 'Sprint Execution & Tasks',
    category: 'Work',
    color: '#6366F1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'slot-4',
    dayOfWeek: 3, // Wednesday
    startTime: '17:00',
    endTime: '18:15',
    title: 'Physical Workout & Conditioning',
    category: 'Health',
    color: '#34D399',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

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
