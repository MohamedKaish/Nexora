/**
 * Lightweight in-memory rate limiter for Vercel serverless functions.
 * 
 * IMPORTANT SECURITY NOTICE:
 * This is a BEST-EFFORT, SECONDARY protection layer. Because Vercel serverless
 * functions are distributed and scale horizontally, each instance maintains its own
 * isolated memory. This rate limiter does NOT provide a global security boundary.
 * 
 * Primary abuse prevention relies on:
 * 1. Supabase Auth's native rate limits
 * 2. Cloudflare Turnstile CAPTCHA
 * 3. Email verification and OAuth controls
 */

interface RateLimitEntry {
  timestamps: number[]
}

const store = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanupStaleEntries(windowMs: number) {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now

  const cutoff = now - windowMs * 2
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter(t => t > cutoff)
    if (entry.timestamps.length === 0) {
      store.delete(key)
    }
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterMs?: number
}

/**
 * Check rate limit for a given key.
 * @param key - Unique identifier (e.g., IP address, user ID, action name)
 * @param maxRequests - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds (default: 60 seconds)
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number = 60_000
): RateLimitResult {
  cleanupStaleEntries(windowMs)

  const now = Date.now()
  const windowStart = now - windowMs

  let entry = store.get(key)
  if (!entry) {
    entry = { timestamps: [] }
    store.set(key, entry)
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter(t => t > windowStart)

  if (entry.timestamps.length >= maxRequests) {
    const oldestInWindow = entry.timestamps[0]
    const retryAfterMs = oldestInWindow + windowMs - now
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, retryAfterMs),
    }
  }

  entry.timestamps.push(now)
  return {
    allowed: true,
    remaining: maxRequests - entry.timestamps.length,
  }
}

/**
 * Pre-configured rate limiters for common Nexora operations.
 */
export const rateLimits = {
  /** Auth operations: 10 attempts per 15 minutes */
  auth: (identifier: string) => checkRateLimit(`auth:${identifier}`, 10, 15 * 60 * 1000),

  /** Password reset: 3 attempts per 15 minutes */
  passwordReset: (identifier: string) => checkRateLimit(`pwd-reset:${identifier}`, 3, 15 * 60 * 1000),

  /** API endpoints: 60 requests per minute */
  api: (identifier: string) => checkRateLimit(`api:${identifier}`, 60, 60 * 1000),

  /** Resource creation: 30 per minute (tasks, projects, etc.) */
  create: (identifier: string) => checkRateLimit(`create:${identifier}`, 30, 60 * 1000),

  /** Bulk/expensive operations: 5 per minute */
  expensive: (identifier: string) => checkRateLimit(`expensive:${identifier}`, 5, 60 * 1000),
} as const
