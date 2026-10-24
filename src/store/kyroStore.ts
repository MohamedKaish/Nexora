import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { KyroMessage, KyroProposedAction } from '@/types/local'
import { KyroAIService } from '@/features/kyro/KyroAIService'
import { KyroContextBuilder, type RawContextInputs } from '@/features/kyro/KyroContextBuilder'
import {
  executeKyroAction,
  type ActionExecutionOutcome,
} from '@/features/kyro/KyroActionRegistry'
import { companionController } from '@/components/companion/CompanionController'
import { playChime, speakWithKyroVoice } from '@/utils/soundEngine'
import {
  DEFAULT_KYRO_SETTINGS,
  type KyroAnimationState,
  type KyroCompanionSettings,
  type KyroActionChip,
  type KyroCharacterModel,
  type KyroCostume,
  type KyroColorTheme,
  type KyroScreenAnchor,
} from '@/types/kyro'

export type KyroProviderType =
  | 'gemini-2.5-flash'
  | 'gemini-2.0-flash'
  | 'gemini-1.5-flash'
  | 'local-context-engine'
  | 'unavailable'
  | string
  | null

interface KyroChatState {
  isOpen: boolean
  isTyping: boolean
  hasError: boolean
  lastFailedText: string | null
  messages: KyroMessage[]
  quickPrompts: string[]

  // ── 3D Companion State ──
  animationState: KyroAnimationState
  activeSpeech: string | null
  speechBubbleVisible: boolean
  actionChips: KyroActionChip[]
  settings: KyroCompanionSettings
  customPosition: { x: number; y: number } | null

  // ── Live Telemetry ──
  lastProvider: KyroProviderType
  lastLatencyMs: number | null
  lastErrorReason: string | null

  // Actions
  setOpen: (open: boolean) => void
  toggleOpen: () => void
  notifyTyping: () => void
  setAnimationState: (
    state: KyroAnimationState,
    revertAfterMs?: number,
    revertTo?: KyroAnimationState
  ) => void
  speak: (
    text: string,
    durationMs?: number,
    chips?: KyroActionChip[],
    forceShow?: boolean
  ) => void
  dismissSpeech: () => void
  updateSettings: (partial: Partial<KyroCompanionSettings>) => void
  setModel: (model: KyroCharacterModel, customGlbUrl?: string | null) => void
  setCostume: (costume: KyroCostume) => void
  setColorTheme: (colorTheme: KyroColorTheme) => void
  setAnchor: (anchor: KyroScreenAnchor) => void
  setCustomPosition: (pos: { x: number; y: number } | null) => void
  toggleMinimized: () => void
  togglePinned: () => void
  toggleVoice: () => void
  setProviderTelemetry: (
    provider: KyroProviderType,
    latencyMs?: number | null,
    errorReason?: string | null
  ) => void

  sendMessage: (text: string, contextInputs?: RawContextInputs) => Promise<void>
  retryLastMessage: (contextInputs?: RawContextInputs) => Promise<void>
  executeProposedAction: (
    actionId: string,
    onExecuteOrOptions?:
      | ((action: KyroProposedAction) => void)
      | { navigate?: (route: string) => void }
  ) => ActionExecutionOutcome
  dismissAction: (actionId: string) => void
  clearHistory: () => void
}

const INITIAL_MESSAGES: KyroMessage[] = [
  {
    id: 'msg-welcome',
    sender: 'kyro',
    text: 'Nexora companion link ready. I am Kyro—I can review your real tasks, habits, hydration, focus timer, notes, and reminders, or help you navigate Nexora and prepare actions for your confirmation.',
    timestamp: new Date().toISOString(),
  },
]

export const QUICK_PROMPTS = [
  'What should I work on today?',
  'How is my hydration today?',
  "What's my next priority?",
  'Start a 25m focus session.',
  'Review my habits.',
  'Open my Task Matrix.',
]

let animationTimer: NodeJS.Timeout | null = null
let speechTimer: NodeJS.Timeout | null = null

export const useKyroStore = create<KyroChatState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      isTyping: false,
      hasError: false,
      lastFailedText: null,
      messages: INITIAL_MESSAGES,
      quickPrompts: QUICK_PROMPTS,

      // ── 3D Companion Initial State ──
      animationState: 'IDLE',
      activeSpeech: 'Nexora systems online. Standing by at your side!',
      speechBubbleVisible: true,
      actionChips: [
        { id: 'next', label: '🎯 What next?', action: 'ask_next_task' },
        { id: 'focus', label: '⚡ 25m Focus', action: 'start_focus' },
      ],
      settings: DEFAULT_KYRO_SETTINGS,
      customPosition: null,

      // ── Live Telemetry ──
      lastProvider: null,
      lastLatencyMs: null,
      lastErrorReason: null,

      setOpen: (open) => set({ isOpen: open }),
      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),

      notifyTyping: () => {
        companionController.onUserTyping()
        get().setAnimationState('TALKING', 1800, 'IDLE')
      },

      setAnimationState: (animState, revertAfterMs, revertTo = 'IDLE') => {
        if (animationTimer) clearTimeout(animationTimer)
        set({ animationState: animState })

        if (get().settings.soundEnabled) {
          if (animState === 'CELEBRATING') {
            playChime('celebrate')
          } else if (animState === 'FOCUS_MODE') {
            playChime('focus_start')
          }
        }

        if (revertAfterMs && revertAfterMs > 0) {
          animationTimer = setTimeout(() => {
            set({ animationState: revertTo })
          }, revertAfterMs)
          animationTimer.unref?.()
        }
      },

      speak: (text, durationMs = 10000, chips = [], forceShow = true) => {
        if (speechTimer) clearTimeout(speechTimer)

        if (get().settings.voiceEnabled) {
          speakWithKyroVoice(text)
        } else if (get().settings.soundEnabled) {
          playChime('notification')
        }

        get().setAnimationState('TALKING', Math.min(durationMs, 4500), 'IDLE')

        set({
          activeSpeech: text,
          speechBubbleVisible: forceShow ? true : get().speechBubbleVisible,
          actionChips: chips.length > 0 ? chips : get().actionChips,
        })

        if (!get().settings.isPinned && durationMs > 0) {
          speechTimer = setTimeout(() => {
            set({ speechBubbleVisible: false })
          }, durationMs)
          speechTimer.unref?.()
        }
      },

      dismissSpeech: () => {
        if (speechTimer) clearTimeout(speechTimer)
        set({ speechBubbleVisible: false })
      },

      updateSettings: (partial) => {
        set((state) => ({
          settings: { ...state.settings, ...partial },
        }))
      },

      setModel: (model, customGlbUrl = null) => {
        set((state) => ({
          settings: {
            ...state.settings,
            model,
            customGlbUrl:
              customGlbUrl !== undefined ? customGlbUrl : state.settings.customGlbUrl,
          },
        }))
        const names: Record<string, string> = {
          kyro_prime: 'Kyro Prime (Cyber Spirit)',
          pyro_fox: 'Pyro Fox (Elemental Creature)',
          aegis_bot: 'Aegis Bot (Armored Defender)',
          custom_glb: 'Custom 3D Blender GLB',
        }
        get().speak(`Switched model to ${names[model] || model}.`, 4000)
      },

      setCostume: (costume) => {
        set((state) => ({
          settings: { ...state.settings, costume },
        }))
        const costumeNames: Record<string, string> = {
          none: 'Default Standard Attire',
          royal_crown: 'Golden Sovereign Crown',
          cyber_visor: 'Tactical AR Visor Glasses',
          samurai_crest: 'Shogun Crest & Pauldrons',
          wizard_hat: 'Star-Weaver Arcane Hat',
          pro_headphones: 'Studio Deep-Focus Headphones',
        }
        get().speak(`Equipped ${costumeNames[costume] || costume}.`, 3500)
      },

      setColorTheme: (colorTheme) => {
        set((state) => ({
          settings: { ...state.settings, colorTheme },
        }))
        get().speak(`Shifted aura to ${colorTheme.replace('_', ' ').toUpperCase()}.`, 3000)
      },

      setAnchor: (anchor) => {
        set((state) => ({
          settings: { ...state.settings, anchor },
          customPosition: null,
        }))
      },

      setCustomPosition: (pos) => set({ customPosition: pos }),

      toggleMinimized: () => {
        set((state) => ({
          settings: { ...state.settings, isMinimized: !state.settings.isMinimized },
        }))
      },

      togglePinned: () => {
        const next = !get().settings.isPinned
        set((state) => ({
          settings: { ...state.settings, isPinned: next },
        }))
        if (next) {
          get().speak("Speech bubble pinned. I'll stay open until you close me.", 3000)
        } else {
          get().speak('Speech bubble unpinned. Will auto-collapse after dialogue.', 3000)
        }
      },

      toggleVoice: () => {
        const next = !get().settings.voiceEnabled
        set((state) => ({
          settings: { ...state.settings, voiceEnabled: next },
        }))
        if (next) {
          get().speak('Vocal synthesis activated. I can speak aloud now!', 3000)
        } else {
          get().speak('Vocal synthesis muted.', 2500)
        }
      },

      setProviderTelemetry: (provider, latencyMs = null, errorReason = null) => {
        set({
          lastProvider: provider,
          lastLatencyMs: latencyMs,
          lastErrorReason: errorReason,
        })
      },

      sendMessage: async (text: string, contextInputs?: RawContextInputs) => {
        if (!text.trim()) return

        const userMsg: KyroMessage = {
          id: 'user_' + Math.random().toString(36).substring(2, 9),
          sender: 'user',
          text: text.trim(),
          timestamp: new Date().toISOString(),
        }

        const currentHistory = get().messages.map((m) => ({
          sender: m.sender,
          text: m.text,
        }))

        set((state) => ({
          messages: [...state.messages, userMsg],
          isTyping: true,
          hasError: false,
          lastFailedText: null,
        }))

        try {
          const resolvedInputs =
            contextInputs ?? KyroContextBuilder.collectLiveStoreInputs()
          const result = await KyroAIService.queryKyro(
            text,
            resolvedInputs,
            currentHistory
          )

          const kyroMsg: KyroMessage = {
            id: 'kyro_' + Math.random().toString(36).substring(2, 9),
            sender: 'kyro',
            text: result.responseText,
            timestamp: new Date().toISOString(),
            proposedAction: result.proposedAction,
          }

          set((state) => ({
            messages: [...state.messages, kyroMsg],
            isTyping: false,
            hasError: !result.ok,
            lastFailedText: result.ok ? null : text,
          }))

          get().speak(result.speechBubble || result.responseText, 10000, [
            { id: 'next', label: '🎯 What next?', action: 'ask_next_task' },
            { id: 'focus', label: '⚡ 25m Focus', action: 'start_focus' },
          ])
        } catch {
          set({
            isTyping: false,
            hasError: true,
            lastFailedText: text,
          })
          companionController.onKyroError('Communication disruption. Please retry.')
        }
      },

      retryLastMessage: async (contextInputs?: RawContextInputs) => {
        const text = get().lastFailedText
        if (text) {
          await get().sendMessage(text, contextInputs)
        }
      },

      executeProposedAction: (actionId, onExecuteOrOptions) => {
        const targetMsg = get().messages.find((m) => m.proposedAction?.id === actionId)
        if (!targetMsg || !targetMsg.proposedAction) {
          return { ok: false, message: 'Action not found.' }
        }

        if (targetMsg.proposedAction.isExecuted) {
          return {
            ok: true,
            message: targetMsg.proposedAction.executionResult || 'Action already executed.',
          }
        }

        const action = targetMsg.proposedAction
        const options =
          typeof onExecuteOrOptions === 'object' && onExecuteOrOptions !== null
            ? onExecuteOrOptions
            : undefined

        const outcome = executeKyroAction(action, options)

        if (typeof onExecuteOrOptions === 'function' && outcome.ok) {
          try {
            onExecuteOrOptions(action)
          } catch {
            // Handled via executeKyroAction
          }
        }

        set((state) => ({
          messages: state.messages.map((m) => {
            if (m.proposedAction?.id !== actionId) return m
            return {
              ...m,
              proposedAction: {
                ...m.proposedAction,
                isExecuted: outcome.ok,
                executionStatus: outcome.ok ? 'executed' : 'failed',
                executionResult: outcome.message,
              },
            }
          }),
        }))

        get().speak(outcome.message, 5000)
        return outcome
      },

      dismissAction: (actionId) => {
        set((state) => ({
          messages: state.messages.map((m) => {
            if (m.proposedAction?.id === actionId) {
              return { ...m, proposedAction: undefined }
            }
            return m
          }),
        }))
      },

      clearHistory: () => set({ messages: INITIAL_MESSAGES, hasError: false }),
    }),
    { name: 'nexora_kyro_storage' }
  )
)
