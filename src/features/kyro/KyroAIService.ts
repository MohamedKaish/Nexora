import { KyroContextBuilder, type RawContextInputs } from './KyroContextBuilder'
import type { KyroProposedAction } from '@/types/local'
import { companionController } from '@/components/companion/CompanionController'
import type { CompanionMood } from '@/components/companion/CompanionState'
import { useKyroStore } from '@/store/kyroStore'
import type { KyroAnimationState } from '@/types/kyro'

export interface KyroAIResponse {
  ok: boolean
  configured: boolean
  responseText: string
  speechBubble?: string
  proposedAction?: KyroProposedAction
  mood: CompanionMood
  errorReason?: string | null
}

/**
 * KyroAIService
 * Bridges the frontend Kyro UI surfaces (Chat Panel, Agent Page, 3D Companion)
 * with the server-only `/api/kyro` Gemini 2.5 Flash endpoint.
 * Never reads or transmits API keys from client storage.
 */
export class KyroAIService {
  static async checkServerStatus(): Promise<{
    ok: boolean
    configured: boolean
    provider: 'gemini-2.5-flash' | 'unavailable'
    message: string
  }> {
    try {
      const res = await fetch('/api/kyro', { method: 'GET' })
      const data = await res.json()
      return {
        ok: Boolean(data.ok),
        configured: Boolean(data.configured),
        provider: data.configured ? 'gemini-2.5-flash' : 'unavailable',
        message:
          data.message ||
          (data.configured
            ? 'Server-side GEMINI_API_KEY is configured.'
            : 'GEMINI_API_KEY is not configured on the server.'),
      }
    } catch (err) {
      return {
        ok: false,
        configured: false,
        provider: 'unavailable',
        message: err instanceof Error ? err.message : 'Unable to reach /api/kyro.',
      }
    }
  }

  static async queryKyro(
    userInput: string,
    rawInputs: RawContextInputs,
    recentHistory: Array<{ sender: 'user' | 'kyro'; text: string }> = []
  ): Promise<KyroAIResponse> {
    companionController.onKyroThinking()
    useKyroStore.getState().setAnimationState('TALKING', 2500, 'IDLE')

    const fullInputs = KyroContextBuilder.collectLiveStoreInputs(rawInputs)
    const structuredContext = KyroContextBuilder.buildContext(fullInputs)

    try {
      const response = await fetch('/api/kyro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userInput,
          context: structuredContext,
          history: recentHistory.slice(-6),
        }),
      })

      const data = await response.json().catch(() => ({}))

      const provider =
        data.provider === 'gemini-2.5-flash' ? 'gemini-2.5-flash' : 'unavailable'
      useKyroStore
        .getState()
        .setProviderTelemetry(provider, data.latencyMs ?? null, data.errorReason ?? null)

      if (!response.ok || data.ok === false) {
        const honestReply =
          data.reply ||
          data.errorReason ||
          `Kyro AI is currently unavailable (HTTP ${response.status}).`
        const honestSpeech =
          data.speechBubble || honestReply
        companionController.onKyroError(honestSpeech)
        return {
          ok: false,
          configured: Boolean(data.configured),
          responseText: honestReply,
          speechBubble: honestSpeech,
          mood: 'idle',
          errorReason: data.errorReason || `HTTP ${response.status}`,
        }
      }

      const replyText: string =
        data.reply || 'I reviewed your Nexora telemetry. How can I help next?'
      const speechBubble: string = data.speechBubble || replyText
      const mood: CompanionMood = (data.mood as CompanionMood) || 'speaking'
      const anim: KyroAnimationState = (data.animation as KyroAnimationState) || 'TALKING'

      companionController.onKyroSpeaking(speechBubble)
      companionController.emitMood(mood, 4500, 'idle')
      useKyroStore.getState().setAnimationState(anim, 4500, 'IDLE')

      return {
        ok: true,
        configured: true,
        responseText: replyText,
        speechBubble,
        proposedAction: data.proposedAction,
        mood,
        errorReason: null,
      }
    } catch (error) {
      const errMsg =
        error instanceof Error ? error.message : 'Network error reaching /api/kyro'
      useKyroStore.getState().setProviderTelemetry('unavailable', null, errMsg)
      companionController.onKyroError('Connection to Kyro endpoint failed.')
      throw error
    }
  }
}
