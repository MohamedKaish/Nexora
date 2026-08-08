import { describe, it, expect, vi } from 'vitest'
import { KyroEventBus } from '../events/EventBus'

describe('KyroEventBus', () => {
  it('should implement singleton pattern', () => {
    const bus1 = KyroEventBus.getInstance()
    const bus2 = KyroEventBus.getInstance()
    expect(bus1).toBe(bus2)
  })

  it('should subscribe and publish events', () => {
    const bus = KyroEventBus.getInstance()
    const mockHandler = vi.fn()
    
    const unsubscribe = bus.subscribe('TaskCreated', mockHandler)
    bus.publish('TaskCreated', { taskId: '123' })
    
    expect(mockHandler).toHaveBeenCalledTimes(1)
    expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({
      type: 'TaskCreated',
      payload: { taskId: '123' }
    }))
    
    unsubscribe()
    bus.publish('TaskCreated', { taskId: '456' })
    expect(mockHandler).toHaveBeenCalledTimes(1) // Should not be called again
  })
})
