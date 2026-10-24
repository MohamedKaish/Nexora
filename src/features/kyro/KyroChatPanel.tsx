'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useKyroStore } from '@/store/kyroStore'
import { useAppStore } from '@/store/appStore'
import { useTaskStore } from '@/store/useTaskStore'
import { useHabitStore } from '@/store/useHabitStore'
import { useGoalStore } from '@/store/useGoalStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useFocusStore } from '@/store/useFocusStore'
import { useTimelineStore } from '@/store/timelineStore'
import { useCharacterStore } from '@/store/characterStore'
import { KyroContextBuilder, RawContextInputs } from '@/features/kyro/KyroContextBuilder'
import { Companion } from '@/components/companion/Companion'
import { CompanionSelector } from '@/components/companion/CompanionSelector'
import {
  Bot,
  Send,
  Sparkles,
  X,
  Check,
  Minimize2,
  Maximize2,
  Trash2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { format } from 'date-fns'

export function KyroChatPanel() {
  const {
    isOpen,
    isTyping,
    hasError,
    lastErrorReason,
    messages,
    quickPrompts,
    setOpen,
    toggleOpen,
    notifyTyping,
    sendMessage,
    retryLastMessage,
    executeProposedAction,
    dismissAction,
    clearHistory,
  } = useKyroStore()

  const userName = useAppStore((s) => s.preferences.displayName) || 'Explorer'
  const agentName = useAppStore((s) => s.agentConfig.name) || 'Kyro'
  const characterConfig = useCharacterStore((s) => s.config)
  const router = useRouter()

  const [input, setInput] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const getContextInputs = (): RawContextInputs =>
    KyroContextBuilder.collectLiveStoreInputs({
      userName,
      agentName,
      creatureArchetype: characterConfig.archetype || 'nyxen',
    })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = () => {
    if (!input.trim() || isTyping) return
    const text = input
    setInput('')
    sendMessage(text, getContextInputs())
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    notifyTyping()
  }

  const handleQuickPrompt = (prompt: string) => {
    if (isTyping) return
    sendMessage(prompt, getContextInputs())
  }

  return (
    <>
      {/* ── Kyro Conversational Interface (when open) ── */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-200 shadow-[0_16px_48px_rgba(0,0,0,0.75)] border border-amber-400/35 rounded-3xl bg-stone-950/98 backdrop-blur-md flex flex-col overflow-hidden ${
            isExpanded
              ? 'inset-3 sm:inset-6 md:inset-10 bottom-[4.5rem] lg:bottom-10'
              : 'bottom-[4.5rem] right-3 left-3 sm:left-auto sm:w-[440px] h-[min(560px,calc(100dvh-8.75rem))] lg:bottom-6 lg:right-6 lg:h-[580px] lg:max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-stone-800/80 flex flex-col gap-2 bg-stone-900/50 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-amber-400/10 border border-amber-400/30 overflow-hidden shrink-0">
                  <Companion
                    size={32}
                    showPlatform={false}
                    showGlow={false}
                    interactive={false}
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-foreground truncate">{agentName}</h3>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-300 font-semibold uppercase tracking-wider shrink-0">
                      AI Ally
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-400 truncate">Context Synchronized</p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-300 hover:text-stone-100 hover:bg-stone-800/70 transition-colors cursor-pointer touch-manipulation"
                  title={isExpanded ? 'Minimize' : 'Expand'}
                  aria-label={isExpanded ? 'Minimize chat' : 'Expand chat'}
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={clearHistory}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-300 hover:text-rose-400 hover:bg-stone-800/70 transition-colors cursor-pointer touch-manipulation"
                  title="Clear chat history"
                  aria-label="Clear chat history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-300 hover:text-stone-100 hover:bg-stone-800/70 transition-colors cursor-pointer touch-manipulation"
                  title="Close chat"
                  aria-label="Close chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* In-Chat Creature Switcher Bar */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-stone-800/60">
              <span className="text-[11px] font-semibold text-stone-400 shrink-0">Persona:</span>
              <CompanionSelector variant="compact" />
            </div>
          </div>

          {/* Messages Flow */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'kyro' && (
                  <div className="w-7 h-7 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-amber-400" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-amber-500 text-stone-950 font-medium ml-auto shadow-sm'
                      : 'bg-stone-900/90 text-stone-100 border border-stone-800'
                  }`}
                >
                  <p className="whitespace-pre-line text-sm">{msg.text}</p>

                  {/* Proposed Action Card with Confirmation Requirement */}
                  {msg.proposedAction && !msg.proposedAction.isExecuted && (
                    <div className="mt-3 p-3 rounded-xl bg-stone-950/80 border border-amber-400/30 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        Proposed Action
                      </div>
                      <p className="text-xs text-stone-300 font-medium">
                        {msg.proposedAction.label}
                      </p>
                      {msg.proposedAction.executionStatus === 'failed' &&
                        msg.proposedAction.executionResult && (
                          <p className="text-[11px] text-rose-400 font-medium">
                            {msg.proposedAction.executionResult}
                          </p>
                        )}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            executeProposedAction(msg.proposedAction!.id, {
                              navigate: (route) => router.push(route),
                            })
                          }
                          className="flex items-center gap-1 px-3 py-1.5 min-h-[34px] rounded-lg bg-amber-400 text-stone-950 text-xs font-bold hover:bg-amber-300 transition-colors cursor-pointer touch-manipulation"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Confirm &amp; Run
                        </button>
                        <button
                          type="button"
                          onClick={() => dismissAction(msg.proposedAction!.id)}
                          className="px-3 py-1.5 min-h-[34px] rounded-lg bg-stone-800/80 text-stone-300 text-xs font-medium hover:text-stone-100 transition-colors cursor-pointer touch-manipulation"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  )}

                  {msg.proposedAction?.isExecuted && (
                    <div className="mt-2 text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3 shrink-0" />
                      <span>
                        {msg.proposedAction.executionResult || 'Action executed'}
                      </span>
                    </div>
                  )}

                  <span className="block text-[10px] opacity-40 mt-1 text-right font-mono">
                    {format(new Date(msg.timestamp), 'HH:mm')}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 items-center text-stone-400 text-xs pl-2">
                <Bot className="w-4 h-4 text-amber-400 animate-spin" />
                <span>{agentName} is thinking &amp; analyzing your context...</span>
              </div>
            )}

            {hasError && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{lastErrorReason || 'Kyro connection issue.'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => retryLastMessage(getContextInputs())}
                  className="px-3 py-1.5 min-h-[32px] rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0 touch-manipulation"
                >
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggested Prompts */}
          <div className="px-3 py-2 border-t border-stone-800/60 bg-stone-900/30 overflow-x-auto flex gap-1.5 no-scrollbar shrink-0">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleQuickPrompt(prompt)}
                disabled={isTyping}
                className="whitespace-nowrap px-3 py-1.5 min-h-[32px] rounded-full text-xs font-medium text-stone-300 bg-stone-800/70 hover:bg-amber-400/15 hover:text-amber-300 hover:border-amber-400/30 border border-stone-700/60 transition-all cursor-pointer touch-manipulation"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="p-3 border-t border-stone-800/80 bg-stone-900/50 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder={`Message ${agentName}...`}
              disabled={isTyping}
              className="flex-1 min-w-0 bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-stone-500 focus:outline-none focus:border-amber-400/60 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="w-10 h-10 rounded-xl bg-amber-400 text-stone-950 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer font-bold shrink-0 touch-manipulation"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
