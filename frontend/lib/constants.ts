/**
 * Shared frontend constants.
 *
 * Magic numbers that appear in more than one component are centralised here
 * to prevent silent drift. Import from this file rather than hard-coding.
 *
 * Sprint 3: Add AUDIO_MAX_SIZE_BYTES once voice upload is implemented.
 * Sprint 7: Consider making POLL_INTERVAL_MS adaptive based on job stage —
 *           use a shorter interval for early stages and longer for late ones.
 */

/**
 * Maximum number of backend status poll attempts before surfacing a timeout error.
 *
 * At POLL_INTERVAL_MS = 1400ms, 120 attempts = ~168 seconds (2 minutes 48 seconds).
 * Most analysis jobs complete in 30–90 seconds, so this provides a generous buffer
 * while still preventing infinite polling on a stalled backend.
 */
export const MAX_POLL_ATTEMPTS = 120;

/**
 * Milliseconds between each status poll request.
 *
 * 1400ms is chosen to balance responsiveness against unnecessary backend load.
 * The backend processes frames sequentially so a shorter interval would not
 * yield more frequent status transitions.
 */
export const POLL_INTERVAL_MS = 1_400;

/**
 * Maximum upload size enforced client-side, in bytes.
 *
 * Must match MAX_UPLOAD_SIZE_MB in backend/config/settings.py.
 * The backend enforces this limit server-side as well; this client-side
 * check avoids wasting upload bandwidth for obviously oversized files.
 */
export const UPLOAD_MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
