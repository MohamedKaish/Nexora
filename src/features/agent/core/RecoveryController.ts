export interface RetryPolicy {
  maxRetries: number
  isTransient: (error: Error | string) => boolean
}

export class RecoveryController {
  private static readonly DEFAULT_MAX_RETRIES = 3

  /**
   * Evaluates whether an error is transient and safe to retry.
   */
  public isTransientError(error: unknown): boolean {
    if (!error) return false
    const msg = (error instanceof Error ? error.message : String(error)).toLowerCase()

    // Non-transient errors that must NEVER be retried
    if (
      msg.includes('unauthorized') ||
      msg.includes('forbidden') ||
      msg.includes('validation failed') ||
      msg.includes('not found') ||
      msg.includes('foreign key') ||
      msg.includes('duplicate key')
    ) {
      return false
    }

    // Transient network or connection glitches
    return (
      msg.includes('network') ||
      msg.includes('timeout') ||
      msg.includes('econnreset') ||
      msg.includes('deadlock') ||
      msg.includes('temporarily unavailable')
    )
  }

  /**
   * Executes an asynchronous operation with controlled retries (capped at 3).
   * Immediate exit on non-transient errors.
   */
  public async executeWithRecovery<T>(
    operation: () => Promise<T>,
    context: {
      actionId: string
      toolName: string
      onRetry?: (attempt: number, error: unknown) => void
    },
    maxRetries = RecoveryController.DEFAULT_MAX_RETRIES
  ): Promise<{
    success: boolean
    result?: T
    error?: string
    retryCount: number
  }> {
    let attempt = 0
    let lastError: unknown

    while (attempt <= maxRetries) {
      try {
        const result = await operation()
        return {
          success: true,
          result,
          retryCount: attempt
        }
      } catch (err: unknown) {
        lastError = err
        attempt++

        // If the error is not transient or we exceeded max retries, halt immediately
        if (!this.isTransientError(err) || attempt > maxRetries) {
          break
        }

        if (context.onRetry) {
          context.onRetry(attempt, err)
        }
      }
    }

    const errorMessage = lastError instanceof Error ? lastError.message : String(lastError)
    return {
      success: false,
      error: `Failed after ${attempt} attempt(s): ${errorMessage}`,
      retryCount: attempt - 1
    }
  }
}
