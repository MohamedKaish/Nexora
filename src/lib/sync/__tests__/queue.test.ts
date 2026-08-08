import { describe, it, expect, beforeEach } from 'vitest'
import { useSyncQueueStore } from '../../../store/syncQueueStore'

// Mock crypto.randomUUID for tests
if (!globalThis.crypto) {
  globalThis.crypto = {
    randomUUID: () => 'test-uuid-' + Math.random()
  } as unknown as Crypto
}

describe('SyncQueueStore Deduplication & Recovery', () => {
  beforeEach(() => {
    useSyncQueueStore.getState().clearQueue()
  })

  it('should enqueue a new item successfully', () => {
    const store = useSyncQueueStore.getState()
    store.enqueue({
      type: 'CREATE',
      entity: 'TASK',
      payload: { id: 'task1', title: 'New Task' }
    })
    
    const state = useSyncQueueStore.getState()
    expect(state.queue.length).toBe(1)
    expect(state.queue[0].status).toBe('queued')
    expect(state.queue[0].retryCount).toBe(0)
  })

  it('should deduplicate multiple UPDATE actions for the same entity', () => {
    const store = useSyncQueueStore.getState()
    
    // First update
    store.enqueue({
      type: 'UPDATE',
      entity: 'TASK',
      payload: { id: 'task1', title: 'First Update' }
    })
    
    // Second update for same task
    useSyncQueueStore.getState().enqueue({
      type: 'UPDATE',
      entity: 'TASK',
      payload: { id: 'task1', status: 'completed' }
    })
    
    const state = useSyncQueueStore.getState()
    // It should overwrite the existing UPDATE instead of pushing a new one
    expect(state.queue.length).toBe(1)
    expect(state.queue[0].payload.title).toBe('First Update')
    expect(state.queue[0].payload.status).toBe('completed')
  })

  it('should increment retryCount on failed updates', () => {
    const store = useSyncQueueStore.getState()
    store.enqueue({
      type: 'DELETE',
      entity: 'PROJECT',
      payload: { id: 'proj1' }
    })
    
    const id = useSyncQueueStore.getState().queue[0].id
    
    useSyncQueueStore.getState().updateActionStatus(id, 'failed', true)
    
    const state = useSyncQueueStore.getState()
    expect(state.queue[0].status).toBe('failed')
    expect(state.queue[0].retryCount).toBe(1)
  })
})
