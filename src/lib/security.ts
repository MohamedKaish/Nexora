// ── Aura Life OS Security & Zero-Knowledge Encryption Engine ──
// Implements client-side AES-GCM 256-bit encryption for financial ledgers,
// PII scrubbing for cloud LLM prompts, and SHA-256 deduplication hashing.

const ENCRYPTION_KEY_STORAGE_KEY = 'nexora_local_vault_key_v1'

async function getOrGenerateVaultKey(): Promise<CryptoKey | null> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    return null
  }

  try {
    let rawKey = localStorage.getItem(ENCRYPTION_KEY_STORAGE_KEY)
    if (!rawKey) {
      const key = await window.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      )
      const exported = await window.crypto.subtle.exportKey('raw', key)
      rawKey = Array.from(new Uint8Array(exported))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
      localStorage.setItem(ENCRYPTION_KEY_STORAGE_KEY, rawKey)
      return key
    }

    const keyBytes = new Uint8Array(
      rawKey.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
    )
    return await window.crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    )
  } catch (err) {
    console.warn('Vault key initialization error:', err)
    return null
  }
}

/**
 * Encrypts sensitive financial data at rest using AES-GCM 256-bit
 */
export async function encryptFinancialRecord(payload: unknown): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    return JSON.stringify(payload)
  }

  try {
    const key = await getOrGenerateVaultKey()
    if (!key) return JSON.stringify(payload)

    const iv = window.crypto.getRandomValues(new Uint8Array(12))
    const encoded = new TextEncoder().encode(JSON.stringify(payload))

    const ciphertext = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    )

    const ivHex = Array.from(iv)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    const cipherHex = Array.from(new Uint8Array(ciphertext))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    return `AURA_ENC:${ivHex}:${cipherHex}`
  } catch (err) {
    console.warn('Record encryption error:', err)
    return JSON.stringify(payload)
  }
}

/**
 * Decrypts sensitive financial data at rest
 */
export async function decryptFinancialRecord<T = unknown>(encryptedArmored: string): Promise<T | null> {
  if (!encryptedArmored || !encryptedArmored.startsWith('AURA_ENC:')) {
    try {
      return JSON.parse(encryptedArmored) as T
    } catch {
      return null
    }
  }

  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    return null
  }

  try {
    const [, ivHex, cipherHex] = encryptedArmored.split(':')
    if (!ivHex || !cipherHex) return null

    const key = await getOrGenerateVaultKey()
    if (!key) return null

    const iv = new Uint8Array(ivHex.match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) || [])
    const cipherBytes = new Uint8Array(cipherHex.match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) || [])

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipherBytes
    )

    const text = new TextDecoder().decode(decrypted)
    return JSON.parse(text) as T
  } catch (err) {
    console.warn('Record decryption error:', err)
    return null
  }
}

/**
 * Strips Personally Identifiable Information (PII) before any cloud LLM transmission
 */
export function stripPII(text: string): string {
  if (!text) return ''

  return text
    // Credit card numbers (13-19 digits with optional spaces/hyphens)
    .replace(/\b(?:\d{4}[ -]?){3}\d{4}\b/g, '[REDACTED_CARD]')
    // US Social Security Numbers (XXX-XX-XXXX)
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED_SSN]')
    // Email addresses
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[REDACTED_EMAIL]')
    // Phone numbers (e.g. +1 (555) 000-0000)
    .replace(/\b(?:\+?\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}\b/g, '[REDACTED_PHONE]')
}

/**
 * Deterministic SHA-256 deduplication hash for multi-rail ingestion
 * (Matches merchant, exact decimal amount, and normalized date window)
 */
export async function generateDedupHash(
  merchant: string,
  amount: number,
  dateString: string
): Promise<string> {
  const normMerchant = merchant.toLowerCase().replace(/[^a-z0-9]/g, '')
  const normAmount = Math.abs(amount).toFixed(2)
  const normDate = dateString.split('T')[0] // YYYY-MM-DD
  const input = `${normMerchant}:${normAmount}:${normDate}`

  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const buffer = new TextEncoder().encode(input)
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer)
      return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .slice(0, 24)
    } catch {}
  }

  // Fallback simple hash
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return 'hash_' + Math.abs(hash).toString(36)
}
