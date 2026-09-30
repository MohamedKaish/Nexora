import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AgentConfig, AgentPersonality } from '@/types/local'
import { DEFAULT_AGENT_CONFIG } from '@/types/local'

interface AgentState {
  config: AgentConfig
  setConfig: (config: Partial<AgentConfig>) => void
  setName: (name: string) => void
  setPersonality: (personality: AgentPersonality) => void
  setEnabled: (enabled: boolean) => void
  resetConfig: () => void
}

export const useAgentStore = create<AgentState>()(
  persist(
    (set) => ({
      config: DEFAULT_AGENT_CONFIG,
      setConfig: (updates) =>
        set((state) => ({
          config: { ...state.config, ...updates, updatedAt: new Date().toISOString() },
        })),
      setName: (name) =>
        set((state) => ({
          config: { ...state.config, name, updatedAt: new Date().toISOString() },
        })),
      setPersonality: (personality) =>
        set((state) => ({
          config: { ...state.config, personality, updatedAt: new Date().toISOString() },
        })),
      setEnabled: (isEnabled) =>
        set((state) => ({
          config: { ...state.config, isEnabled, updatedAt: new Date().toISOString() },
        })),
      resetConfig: () => set({ config: DEFAULT_AGENT_CONFIG }),
    }),
    {
      name: 'nexora_agent_config',
      partialize: (state) => ({ config: state.config }),
    }
  )
)

// ─── Agent Message Templates ───

const GREETINGS: Record<AgentPersonality, string[]> = {
  professional: [
    'Ready to optimize your workflow.',
    'Let\'s make today productive.',
    'Your priorities are queued.',
  ],
  friendly: [
    'Hey! Great to see you 😊',
    'Welcome back! What shall we tackle?',
    'Hi there! Ready when you are.',
  ],
  calm: [
    'Take a breath. Let\'s begin.',
    'One thing at a time.',
    'Welcome. What needs your attention?',
  ],
  energetic: [
    'Let\'s crush it today! 🔥',
    'Time to make things happen!',
    'You\'ve got this! Let\'s go!',
  ],
  minimal: [
    'Ready.',
    'What\'s next?',
    'Go.',
  ],
  motivational: [
    'Every task completed is a step forward.',
    'You\'re building something great.',
    'Progress, not perfection.',
  ],
  loyal: [
    'Ready for your orders, Chief!',
    'Awaiting your command, Chief!',
    'What is our next move, Chief?',
  ],
}

const TASK_COMPLETE: Record<AgentPersonality, string[]> = {
  professional: ['Task completed. Well done.', 'Marked as done. Moving on.'],
  friendly: ['Awesome work! 🎉', 'You did it! Nice job!'],
  calm: ['Nicely done. One less thing.', 'Complete. Well paced.'],
  energetic: ['BOOM! Crushed it! 💪', 'Another one down! Keep going!'],
  minimal: ['Done.', '✓'],
  motivational: ['That\'s momentum. Keep it going.', 'Every completion counts.'],
  loyal: ['Brilliantly executed, Chief!', 'Task eliminated as ordered, Chief!', 'Victory is ours, Chief!'],
}

const FOCUS_START: Record<AgentPersonality, string[]> = {
  professional: ['Focus session initiated. Minimize distractions.'],
  friendly: ['Alright, let\'s get in the zone! 🎯'],
  calm: ['Entering deep focus. Be present.'],
  energetic: ['LET\'S FOCUS! No distractions! 🔥'],
  minimal: ['Focus.'],
  motivational: ['Deep work is where the magic happens.'],
  loyal: ['Shields up! Commencing deep focus for the Chief!', 'Protecting your focus, Chief!', 'All distractions blocked, Chief!'],
}

export function getAgentMessage(type: 'greeting' | 'taskComplete' | 'focusStart', personality: AgentPersonality): string {
  const templates = type === 'greeting'
    ? GREETINGS[personality]
    : type === 'taskComplete'
    ? TASK_COMPLETE[personality]
    : FOCUS_START[personality]
  return templates[Math.floor(Math.random() * templates.length)]
}
