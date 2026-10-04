import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { KyroMessage, KyroProposedAction } from '@/types/local'
import { KyroAIService } from '@/features/kyro/KyroAIService'
import { RawContextInputs } from '@/features/kyro/KyroContextBuilder'
import { companionController } from '@/components/companion/CompanionController'

interface KyroChatState {
  isOpen: boolean
  isTyping: boolean
  hasError: boolean
  lastFailedText: string | null
  messages: KyroMessage[]
  quickPrompts: string[]
  setOpen: (open: boolean) => void
  toggleOpen: () => void
  notifyTyping: () => void
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

export const useKyroStore = create<KyroChatState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      isTyping: false,
      hasError: false,
      lastFailedText: null,
      messages: INITIAL_MESSAGES,
      quickPrompts: QUICK_PROMPTS,

      setOpen: (open) => set({ isOpen: open }),
      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),

      notifyTyping: () => {
        companionController.onUserTyping()
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
