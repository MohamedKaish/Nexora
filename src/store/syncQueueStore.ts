import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SyncAction {
  id: string
  type: 'CREATE' | 'UPDATE' | 'DELETE'
  entity: 'TASK' | 'PROJECT' | 'HABIT' | 'SUBTASK' | 'TIMETABLE_SLOT'
  payload: Record<string, unknown>
  timestamp: string
  retryCount: number
  status: 'queued' | 'syncing' | 'failed'
}

interface SyncQueueState {
  queue: SyncAction[]
  isSyncing: boolean
  lastSyncTime: string | null
  enqueue: (action: Omit<SyncAction, 'id' | 'timestamp' | 'retryCount' | 'status'>) => void
  dequeue: (id: string) => void
  updateActionStatus: (id: string, status: SyncAction['status'], incrementRetry?: boolean) => void
  setSyncing: (isSyncing: boolean) => void
  setLastSyncTime: (time: string) => void
  clearQueue: () => void
}

export const useSyncQueueStore = create<SyncQueueState>()(
  persist(
    (set) => ({
      queue: [],
      isSyncing: false,
      lastSyncTime: null,
      enqueue: (action) => set((state) => {
        // Deduplication Logic
        // If there's already an UPDATE action for the same entity and same payload ID, overwrite it
        if (action.type === 'UPDATE' && action.payload.id) {
          const existingIndex = state.queue.findIndex(
            a => a.type === 'UPDATE' && a.entity === action.entity && a.payload.id === action.payload.id
          )
          if (existingIndex !== -1) {
            const newQueue = [...state.queue]
            newQueue[existingIndex] = {
              ...newQueue[existingIndex],
              payload: { ...newQueue[existingIndex].payload, ...action.payload },
              timestamp: new Date().toISOString(),
              status: 'queued'
            }
            return { queue: newQueue }
          }
        }
        
        return {
          queue: [...state.queue, { ...action, id: crypto.randomUUID(), timestamp: new Date().toISOString(), retryCount: 0, status: 'queued' }]
        }
      }),
      dequeue: (id) => set((state) => ({
        queue: state.queue.filter(a => a.id !== id)
      })),
      updateActionStatus: (id, status, incrementRetry) => set((state) => ({
        queue: state.queue.map(a => {
          if (a.id === id) {
            return { ...a, status, retryCount: incrementRetry ? a.retryCount + 1 : a.retryCount }
          }
          return a
        })
      })),
      setSyncing: (isSyncing) => set({ isSyncing }),
      setLastSyncTime: (time) => set({ lastSyncTime: time }),
      clearQueue: () => set({ queue: [] }),
    }),
    {
      name: 'nexora-sync-queue'
    }
  )
)
