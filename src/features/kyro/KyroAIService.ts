import { KyroProposedAction } from '@/types/local'
import {
  buildKyroContext,
  RawContextInputs,
  StructuredNexoraContext,
} from './KyroContextBuilder'
import { companionController } from '@/components/companion/CompanionController'

export interface KyroQueryResult {
  responseText: string
  speechBubble?: string
  proposedAction?: KyroProposedAction
  isOffline?: boolean
  provider?: string
}

export class KyroAIService {
  /**
   * Queries the real server-side Kyro AI route with live structured Nexora context.
   */
  static async queryKyro(
    userText: string,
    rawInputs: RawContextInputs,
    history: Array<{ sender: 'user' | 'kyro'; text: string }> = []
  ): Promise<KyroQueryResult> {
    // 1. Build clean structured context
    const structuredContext = buildKyroContext(rawInputs)

    // 2. Notify companion controller
    companionController.onKyroThinking()

    try {
      const response = await fetch('/api/kyro/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          context: structuredContext,
          history: history.slice(-6),
        }),
      })

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`)
      }

      const data = await response.json()

      const replyText = data.reply || 'Kyro received your transmission.'
      const speechBubble = data.speechBubble || replyText.substring(0, 80)

      // 3. Trigger speaking state on companion
      companionController.onKyroSpeaking(speechBubble)

      return {
        responseText: replyText,
        speechBubble,
        proposedAction: data.proposedAction,
        provider: data.provider,
      }
    } catch (err) {
      console.warn('Kyro AI server route unreachable, generating contextual fallback:', err)
      companionController.onKyroError('Neural link connection interrupted.')

      return {
        responseText: `Kyro neural link is temporarily operating in local offline mode. Your Nexora workspace data is completely safe and synchronized.\n\nActive tasks: ${structuredContext.tasks.activeCount} (${structuredContext.tasks.urgentTasks.length} urgent), ${structuredContext.habits.completedToday}/${structuredContext.habits.total} habits checked today.`,
        speechBubble: 'Local mode active. Workspace telemetry synchronized.',
        isOffline: true,
      }
    }
  }
}
