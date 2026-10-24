// Web Audio API Synthesizer + Native Android Voice TTS Bridge

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

// User-interaction unlocker for mobile browsers & Android WebView
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  const unlock = () => {
    getAudioContext()
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('touchstart', unlock)
    window.removeEventListener('pointerup', unlock)
    window.removeEventListener('keydown', unlock)
  }
  window.addEventListener('pointerdown', unlock, { once: true, passive: true })
  window.addEventListener('touchstart', unlock, { once: true, passive: true })
  window.addEventListener('pointerup', unlock, { once: true, passive: true })
  window.addEventListener('keydown', unlock, { once: true, passive: true })
}

export type ChimeType = 'celebrate' | 'notification' | 'click' | 'focus_start' | 'alert'

export function playChime(type: ChimeType = 'notification') {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime

    switch (type) {
      case 'notification': {
        // Golden sanctuary two-tone bell (D5 -> A5)
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(587.33, now) // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12) // A5

        gain.gain.setValueAtTime(0.28, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.5)
        break
      }

      case 'celebrate': {
        // Ascending crystalline triad (C5 -> E5 -> G5 -> C6)
        const notes = [523.25, 659.25, 783.99, 1046.5]
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'triangle'
          osc.frequency.setValueAtTime(freq, now + i * 0.08)

          gain.gain.setValueAtTime(0.2, now + i * 0.08)
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4)

          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(now + i * 0.08)
          osc.stop(now + i * 0.08 + 0.4)
        })
        break
      }

      case 'click': {
        // High-tech subtle tactile click
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(1200, now)
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.03)

        gain.gain.setValueAtTime(0.12, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.035)
        break
      }

      case 'focus_start': {
        // Deep resonance 432Hz sine pulse with warm harmonic overtone
        const osc1 = ctx.createOscillator()
        const osc2 = ctx.createOscillator()
        const gain = ctx.createGain()

        osc1.type = 'sine'
        osc1.frequency.setValueAtTime(432, now) // Healing focus harmonic
        osc2.type = 'sine'
        osc2.frequency.setValueAtTime(864, now)

        gain.gain.setValueAtTime(0.22, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8)

        osc1.connect(gain)
        osc2.connect(gain)
        gain.connect(ctx.destination)
        osc1.start(now)
        osc2.start(now)
        osc1.stop(now + 0.8)
        osc2.stop(now + 0.8)
        break
      }

      case 'alert': {
        // Tactical alert two-pulse ping
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(880, now)
        osc.frequency.setValueAtTime(1046.5, now + 0.1)

        gain.gain.setValueAtTime(0.18, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.35)
        break
      }
    }
  } catch (e) {
    console.warn('Sound chime playback error:', e)
  }
}

// ── Kyro Voice Synthesis (Android Native TTS + Web Speech API fallback) ──
export function speakWithKyroVoice(rawText: string) {
  if (typeof window === 'undefined') return
  const text = rawText.replace(/[*_#`~>]/g, '').trim()
  if (!text) return

  // 1. Android APK Native TextToSpeech Bridge (Priority #1 on mobile)
  const nativeBridge = (window as unknown as {
    NexoraNativeBridge?: {
      speakText?: (t: string) => void
    }
  }).NexoraNativeBridge

  if (nativeBridge?.speakText) {
    try {
      nativeBridge.speakText(text)
      return
    } catch (e) {
      console.warn('Native Android TTS failed, falling back to Web Speech:', e)
    }
  }

  // 2. Web Speech API (PC / Chrome / Safari fallback)
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.05
      utterance.pitch = 1.0

      const voices = window.speechSynthesis.getVoices()
      const preferred = voices.find(
        (v) =>
          v.name.includes('Natural') ||
          v.name.includes('Google') ||
          v.name.includes('Samantha') ||
          v.name.includes('Daniel') ||
          v.lang.startsWith('en')
      )
      if (preferred) utterance.voice = preferred

      window.speechSynthesis.speak(utterance)
    } catch (err) {
      console.warn('Web Speech API error:', err)
    }
  }
}

export function stopKyroVoice() {
  if (typeof window === 'undefined') return

  const nativeBridge = (window as unknown as {
    NexoraNativeBridge?: {
      stopSpeaking?: () => void
    }
  }).NexoraNativeBridge

  if (nativeBridge?.stopSpeaking) {
    try {
      nativeBridge.stopSpeaking()
    } catch {}
  }

  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel()
    } catch {}
  }
}

export function triggerHapticFeedback(pattern: number | number[] = 25) {
  if (typeof window === 'undefined') return
  try {
    const bridge = (window as unknown as {
      NexoraNativeBridge?: {
        vibrate?: (ms: number) => void
      }
    }).NexoraNativeBridge

    if (bridge?.vibrate) {
      bridge.vibrate(Array.isArray(pattern) ? (pattern[0] || 25) : pattern)
      return
    }

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  } catch {}
}
