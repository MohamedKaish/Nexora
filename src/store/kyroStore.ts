import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { KyroMessage, KyroProposedAction } from '@/types/local'
import { KyroAIService } from '@/features/kyro/KyroAIService'
import { RawContextInputs } from '@/features/kyro/KyroContextBuilder'
import { companionController } from '@/components/companion/CompanionController'
import {
  KyroAnimationState,
  KyroCompanionSettings,
  DEFAULT_KYRO_SETTINGS,
  KyroActionChip,
  KyroCharacterModel,
  KyroScreenAnchor,
} from '@/types/kyro'

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
  
  // Actions
  setOpen: (open: boolean) => void
  toggleOpen: () => void
  notifyTyping: () => void
  setAnimationState: (state: KyroAnimationState, revertAfterMs?: number, revertTo?: KyroAnimationState) => void
  speak: (text: string, durationMs?: number, chips?: KyroActionChip[]) => void
  dismissSpeech: () => void
  updateSettings: (partial: Partial<KyroCompanionSettings>) => void
  setModel: (model: KyroCharacterModel, customGlbUrl?: string | null) => void
  setAnchor: (anchor: KyroScreenAnchor) => void
  setCustomPosition: (pos: { x: number; y: number } | null) => void
  toggleMinimized: () => void
  toggleVoice: () => void
  
  sendMessage: (text: string, contextInputs: RawContextInputs) => Promise<void>
  retryLastMessage: (contextInputs: RawContextInputs) => Promise<void>
  executeProposedAction: (actionId: string, onExecute: (action: KyroProposedAction) => void) => void
  dismissAction: (actionId: string) => void
  clearHistory: () => void
}

const INITIAL_MESSAGES: KyroMessage[] = [
  {
    id: 'msg-welcome',
    sender: 'kyro',
    text: "Welcome to Nexora. I am Kyro, your AI companion living inside this sanctuary. I monitor your tasks, habits, focus chambers, and timetable to keep your momentum aligned. How can we make meaningful progress today?",
    timestamp: new Date().toISOString(),
  },
]

export const QUICK_PROMPTS = [
  "What should I work on today?",
  "How am I doing today?",
  "What's my next priority?",
  "Plan my day.",
  "Start a focus session.",
  "How are my habits?",
  "Review my goals.",
  "Motivate me.",
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
      activeSpeech: null,
      speechBubbleVisible: false,
      actionChips: [],
      settings: DEFAULT_KYRO_SETTINGS,
      customPosition: null,

      setOpen: (open) => set({ isOpen: open }),
      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),

      notifyTyping: () => {
        companionController.onUserTyping()
        get().setAnimationState('TALKING', 1800, 'IDLE')
      },

      setAnimationState: (animState, revertAfterMs, revertTo = 'IDLE') => {
        if (animationTimer) clearTimeout(animationTimer)
        set({ animationState: animState })
        if (revertAfterMs && revertAfterMs > 0) {
          animationTimer = setTimeout(() => {
            set({ animationState: revertTo })
          }, revertAfterMs)
        }
      },

      speak: (text, durationMs = 5000, chips = []) => {
        if (speechTimer) clearTimeout(speechTimer)
        
        // Voice synthesis if enabled
        if (get().settings.voiceEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
          try {
            window.speechSynthesis.cancel()
            const cleanText = text.replace(/[*_#`]/g, '')
            const utterance = new SpeechSynthesisUtterance(cleanText)
            utterance.rate = 1.05
            utterance.pitch = 1.0
            // Prefer natural English voices
            const voices = window.speechSynthesis.getVoices()
            const preferred = voices.find(
              (v) => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.lang.startsWith('en'))
            )
            if (preferred) utterance.voice = preferred
            window.speechSynthesis.speak(utterance)
          } catch (e) {
            console.warn('Speech synthesis failed:', e)
          }
        }

        get().setAnimationState('TALKING', Math.min(durationMs, 4000), 'IDLE')

        set({
          activeSpeech: text,
          speechBubbleVisible: true,
          actionChips: chips,
        })

        if (durationMs > 0) {
          speechTimer = setTimeout(() => {
            set({ speechBubbleVisible: false })
          }, durationMs)
        }
      },

      dismissSpeech: () => {
        if (speechTimer) clearTimeout(speechTimer)
        set({ speechBubbleVisible: false, activeSpeech: null })
      },

      updateSettings: (partial) => {
        set((state) => ({
          settings: { ...state.settings, ...partial },
        }))
      },

      setModel: (model, customGlbUrl = null) => {
        set((state) => ({
          settings: { ...state.settings, model, customGlbUrl: customGlbUrl ?? state.settings.customGlbUrl },
        }))
        get().speak(`Shifted to ${model.replace('_', ' ').toUpperCase()} matrix.`, 2800)
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

      toggleVoice: () => {
        const next = !get().settings.voiceEnabled
        set((state) => ({
          settings: { ...state.settings, voiceEnabled: next },
        }))
        if (next) {
          get().speak("Vocal synthesis matrix activated.", 2500)
        } else {
          get().speak("Audio silenced. Operating in silent stealth.", 2000)
        }
      },

      sendMessage: async (text: string, contextInputs: RawContextInputs) => {
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
          const result = await KyroAIService.queryKyro(text, contextInputs, currentHistory)

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
            hasError: false,
          }))

          // Return companion to calm idle after speaking window
          setTimeout(() => {
            companionController.onKyroIdle()
          }, 4500)
        } catch (error) {
          set({
            isTyping: false,
            hasError: true,
            lastFailedText: text,
          })
          companionController.onKyroError('Communication disruption. Please retry.')
        }
      },

      retryLastMessage: async (contextInputs: RawContextInputs) => {
        const text = get().lastFailedText
        if (text) {
          await get().sendMessage(text, contextInputs)
        }
      },

      executeProposedAction: (actionId, onExecute) => {
        set((state) => ({
          messages: state.messages.map((m) => {
            if (m.proposedAction?.id === actionId) {
              onExecute(m.proposedAction)
              return {
                ...m,
                proposedAction: { ...m.proposedAction, isExecuted: true },
              }
            }
            return m
          }),
        }))
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
