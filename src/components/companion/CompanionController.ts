import { CompanionMood, EyeExpression, MouthExpression } from './CompanionState'

type MoodListener = (mood: CompanionMood) => void

class CompanionEventBus {
  private listeners: Set<MoodListener> = new Set()
  private speechListeners: Set<(text: string | null) => void> = new Set()
  private timer: NodeJS.Timeout | null = null

  subscribe(listener: MoodListener) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  subscribeSpeech(listener: (text: string | null) => void) {
    this.speechListeners.add(listener)
    return () => {
      this.speechListeners.delete(listener)
    }
  }

  emitMood(mood: CompanionMood, revertAfterMs?: number, revertTo: CompanionMood = 'idle') {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }

    this.listeners.forEach((l) => l(mood))

    if (revertAfterMs && revertAfterMs > 0) {
      this.timer = setTimeout(() => {
        this.listeners.forEach((l) => l(revertTo))
        this.timer = null
      }, revertAfterMs)
    }
  }

  emitSpeech(text: string | null, clearAfterMs?: number) {
    this.speechListeners.forEach((l) => l(text))
    if (clearAfterMs && clearAfterMs > 0 && text) {
      setTimeout(() => {
        this.speechListeners.forEach((l) => l(null))
      }, clearAfterMs)
    }
  }

  // ── High-Level Productivity Event Triggers ──

  onTaskCompleted(taskTitle?: string) {
    this.emitMood('celebrating', 2800, 'happy')
    if (taskTitle) {
      this.emitSpeech(`Quest cleared: "${taskTitle}"! Momentum surges.`, 4000)
    } else {
      this.emitSpeech(`Clean victory! That's one less objective on your board.`, 3500)
    }
  }

  onHabitChecked(habitName?: string, streak?: number) {
    this.emitMood('happy', 2500, 'idle')
    if (streak && streak > 1) {
      this.emitSpeech(`${streak}-day streak locked! Consistency forged.`, 3500)
    } else {
      this.emitSpeech(`Habit secured. The chain remains unbroken.`, 3000)
    }
  }

  onFocusStarted(mode: string = 'Pomodoro') {
    this.emitMood('focused')
    this.emitSpeech(`Chamber locked (${mode}). Sensory barriers engaged.`, 3500)
  }

  onFocusEnded() {
    this.emitMood('celebrating', 3200, 'happy')
    this.emitSpeech(`Deep focus block conquered! Breathe and replenish.`, 4000)
  }

  onUserTyping() {
    this.emitMood('listening')
  }

  onKyroThinking() {
    this.emitMood('thinking')
  }

  onKyroSpeaking(conciseText?: string) {
    this.emitMood('speaking')
    if (conciseText) {
      this.emitSpeech(conciseText)
    }
  }

  onKyroIdle() {
    this.emitMood('idle')
  }

  onKyroError(errorMsg?: string) {
    this.emitMood('surprised', 2000, 'encouraging')
    this.emitSpeech(errorMsg || `Neural link interrupted. Standing by.`, 4000)
  }
}

export const companionController = new CompanionEventBus()

/**
 * Resolves expressive eye & mouth sub-states given a mood and active blink
 */
export function resolveExpressions(
  mood: CompanionMood,
  isBlinking: boolean
): { eye: EyeExpression; mouth: MouthExpression } {
  if (isBlinking && mood !== 'sleeping') {
    return { eye: 'blink', mouth: 'idle_curve' }
  }

  switch (mood) {
    case 'listening':
      return { eye: 'attentive', mouth: 'idle_curve' }
    case 'greeting':
      return { eye: 'joyful_arch', mouth: 'smile_open' }
    case 'thinking':
      return { eye: 'thinking_up', mouth: 'thinking_smirk' }
    case 'speaking':
      return { eye: 'normal', mouth: 'speaking_pulse' }
    case 'happy':
      return { eye: 'joyful_arch', mouth: 'smile_open' }
    case 'celebrating':
      return { eye: 'joyful_arch', mouth: 'smile_open' }
    case 'encouraging':
      return { eye: 'attentive', mouth: 'smile_open' }
    case 'surprised':
      return { eye: 'wide_surprised', mouth: 'surprised_o' }
    case 'focused':
      return { eye: 'focused', mouth: 'flat_focused' }
    case 'tired':
      return { eye: 'sleepy_line', mouth: 'sleepy_slack' }
    case 'sleeping':
      return { eye: 'sleepy_line', mouth: 'sleepy_slack' }
    default:
      return { eye: 'normal', mouth: 'idle_curve' }
  }
}
