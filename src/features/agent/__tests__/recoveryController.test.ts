import { describe, it, expect, vi } from 'vitest'
import { RecoveryController } from '../core/RecoveryController'

describe('RecoveryController & Failure Recovery', () => {
  const controller = new RecoveryController()

  it('should distinguish transient network errors from non-transient logic/auth errors', () => {
    expect(controller.isTransientError(new Error('Network timeout after 5000ms'))).toBe(true)
    expect(controller.isTransientError(new Error('connection ECONNRESET'))).toBe(true)

    // Non-transient errors that should NOT be retried
    expect(controller.isTransientError(new Error('Unauthorized: user not found'))).toBe(false)
    expect(controller.isTransientError(new Error('Parameter validation failed'))).toBe(false)
    expect(controller.isTransientError(new Error('Foreign key violation'))).toBe(false)
  })

  it('should retry transient errors up to maxRetries (3) and succeed if recovered', async () => {
    let callCount = 0
    const operation = vi.fn(async () => {
      callCount++
      if (callCount < 3) {
        throw new Error('Network timeout glitch')
      }
      return { data: 'success_recovered' }
    })

    const onRetry = vi.fn()
    const result = await controller.executeWithRecovery(
      operation,
      { actionId: 'act_test', toolName: 'get_tasks', onRetry },
      3
    )

    expect(result.success).toBe(true)
    expect(result.result).toEqual({ data: 'success_recovered' })
    expect(result.retryCount).toBe(2)
    expect(onRetry).toHaveBeenCalledTimes(2)
  })

  it('should immediately halt without retrying on non-transient errors', async () => {
    let callCount = 0
    const operation = vi.fn(async () => {
      callCount++
      throw new Error('Unauthorized user')
    })

    const onRetry = vi.fn()
    const result = await controller.executeWithRecovery(
      operation,
      { actionId: 'act_test', toolName: 'create_task', onRetry },
      3
    )

    expect(result.success).toBe(false)
    expect(callCount).toBe(1) // Only executed once!
    expect(onRetry).not.toHaveBeenCalled()
    expect(result.error).toContain('Unauthorized user')
  })
})
